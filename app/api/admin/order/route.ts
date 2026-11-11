import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";
import { notifyCustomer } from "@/lib/notify";
import {
  decryptTrackingToken,
  issueDeliveryOtp,
  saveFulfilment,
  trackingUrl,
  verifyDeliveryOtp,
  writeOrderEvent,
} from "@/lib/fulfilment";
import type { Order } from "@/lib/types";

/**
 * Private owner order operations.
 *
 * There is deliberately no direct status jump to delivered. A delivery can only
 * be closed after the customer provides the six-digit, expiring, one-time code.
 * The raw code never enters an order timeline, audit event or admin response.
 */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json();
  const { id, action, note } = b as { id: string; action?: string; note?: string };
  if (!id) return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });

  const sb = admin();
  const { data: current, error: lookupError } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (lookupError) return NextResponse.json({ ok: false, error: lookupError.message }, { status: 500 });
  if (!current) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  const o = current as Order & { tracking_token_ciphertext?: string | null };
  const now = new Date().toISOString();
  const savedTrackToken = decryptTrackingToken(o.tracking_token_ciphertext);
  const secureTrackingUrl = savedTrackToken ? trackingUrl(id, savedTrackToken) : undefined;

  // Cancellation is a stock-affecting state transition. Keep it inside the
  // database transaction so a double click or two staff sessions can never
  // return the same inventory twice.
  if (action === "cancel") {
    // Cancellation restores stock. A payment that has actually cleared must be
    // refunded and recorded first; cancelling it silently would make the order
    // look resolved while the customer is still owed money.
    if (o.payment_status === "paid") {
      return NextResponse.json({ ok: false, error: "Record the refund first, then cancel and restock this paid order." }, { status: 400 });
    }
    const cancellationNote = String(note || "Cancelled by studio").slice(0, 500);
    const { data, error } = await sb.rpc("taj_cancel_order", { p_order_id: id, p_note: cancellationNote });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    const result = (Array.isArray(data) ? data[0] : data) as { already_cancelled?: boolean; order_timeline?: Order["timeline"] } | null;
    if (!result) return NextResponse.json({ ok: false, error: "Could not cancel this order." }, { status: 500 });
    if (!result.already_cancelled) {
      await writeOrderEvent(id, "cancel", "Order cancelled", cancellationNote);
      notifyCustomer({ ...o, status: "cancelled", timeline: result.order_timeline ?? o.timeline }, "cancel", { trackingUrl: secureTrackingUrl }).catch(() => {});
    }
    return NextResponse.json({ ok: true, already: !!result.already_cancelled });
  }

  const timeline = [...(o.timeline ?? [])];
  const patch: Record<string, unknown> = {};
  const fulfilment = b.fulfilment && typeof b.fulfilment === "object" ? b.fulfilment as Record<string, unknown> : {};
  const push = (status: string, message: string) => timeline.push({ at: now, status, note: message } as never);
  const setTimeline = () => { if (Object.keys(patch).length || action) patch.timeline = timeline; };

  // Never accept raw status or payment-status writes: approved actions keep the
  // timeline meaningful and make a paid-order refund explicit.
  if (!action) {
    if (b.status && b.status !== o.status) {
      return NextResponse.json({ ok: false, error: "Use the fulfilment actions; direct status changes are blocked to protect delivery proof." }, { status: 400 });
    }
    if (b.payment_status && b.payment_status !== o.payment_status) {
      return NextResponse.json({ ok: false, error: "Use the payment received or refund action so the order keeps an audit trail." }, { status: 400 });
    }
  } else if (action === "confirm") {
    if (o.status !== "pending") return invalidTransition(o.status, "confirm");
    patch.status = "confirmed";
    push("confirmed", note || "Order confirmed by studio");
  } else if (action === "pack") {
    if (o.status !== "confirmed") return invalidTransition(o.status, "pack");
    patch.status = "packed";
    push("packed", note || "Hamper tied, boxed & labelled");
  } else if (action === "dispatch" || action === "resend_otp") {
    const resend = action === "resend_otp";
    if (resend ? o.status !== "out_for_delivery" : o.status !== "packed") return invalidTransition(o.status, resend ? "send a fresh code" : "dispatch");
    let issued;
    try {
      issued = await issueDeliveryOtp(id, ["private_tracking"], resend);
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Could not create delivery code." }, { status: 400 });
    }

    if (!resend) {
      patch.status = "out_for_delivery";
      push("out_for_delivery", "Out for delivery — secure customer handover code created");
      await saveFulfilment(id, { ...fulfilment, out_for_delivery_at: now });
    } else {
      push("out_for_delivery", "Customer delivery code refreshed; previous code is no longer valid");
    }
    setTimeline();
    const { error } = await sb.from("orders").update(patch).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const report = await notifyCustomer({ ...o, ...patch }, "dispatch", {
      otp: issued.code,
      otpExpiresAt: issued.expiresAt,
      trackingUrl: secureTrackingUrl,
    });
    const channels = [...new Set(["private_tracking", ...report.channels])];
    await sb.from("delivery_otps").update({ sent_channels: channels, updated_at: new Date().toISOString() }).eq("order_id", id);
    await writeOrderEvent(id, resend ? "otp_resent" : "dispatched", resend ? "Delivery code resent" : "Out for delivery", note, {
      expiresAt: issued.expiresAt, resendCount: issued.resendCount, channels,
    });
    return NextResponse.json({ ok: true, delivery: { expiresAt: issued.expiresAt, resendCount: issued.resendCount, channels } });
  } else if (action === "attempt") {
    if (o.status !== "out_for_delivery") return invalidTransition(o.status, "record a delivery attempt");
    const attemptNote = String(note || "Delivery attempted; customer was unavailable.").slice(0, 500);
    await saveFulfilment(id, { latest_attempt_note: attemptNote });
    push("out_for_delivery", attemptNote);
  } else if (action === "fulfilment") {
    await saveFulfilment(id, fulfilment);
    push(o.status, note || "Delivery details updated");
  } else if (action === "deliver") {
    if (o.status !== "out_for_delivery") return invalidTransition(o.status, "verify delivery");
    const verified = await verifyDeliveryOtp(id, String(b.otp || ""));
    if (!verified.ok) return NextResponse.json({ ok: false, error: verified.error || "Delivery code could not be verified." }, { status: 400 });
    patch.status = "delivered";
    push("delivered", "Delivered — customer handover code verified");
    if (o.payment_method === "COD" && o.payment_status !== "paid") {
      patch.payment_status = "paid";
      push("delivered", "Cash on delivery collected at handover");
    }
    await saveFulfilment(id, { ...fulfilment, delivered_at: now, delivery_note: note || null });
  } else if (action === "mark_paid") {
    if (o.payment_status === "paid") return NextResponse.json({ ok: true, already: true });
    if (o.payment_status === "refunded" || o.status === "cancelled") {
      return NextResponse.json({ ok: false, error: "A refunded or cancelled order cannot be marked paid." }, { status: 400 });
    }
    patch.payment_status = "paid";
    push(o.status, "Payment received & verified by owner");
  } else if (action === "mark_refunded") {
    if (o.payment_status === "refunded") return NextResponse.json({ ok: true, already: true });
    if (o.payment_status !== "paid") {
      return NextResponse.json({ ok: false, error: "Only a verified paid order can be recorded as refunded." }, { status: 400 });
    }
    const refundNote = String(note || "").trim();
    if (refundNote.length < 3) {
      return NextResponse.json({ ok: false, error: "Add the refund reference or a short note before recording it." }, { status: 400 });
    }
    patch.payment_status = "refunded";
    push(o.status, refundNote.slice(0, 500));
  } else {
    return NextResponse.json({ ok: false, error: "Unknown owner action." }, { status: 400 });
  }

  setTimeline();
  const { error } = await sb.from("orders").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  if (action) {
    const eventTitle: Record<string, string> = {
      confirm: "Order confirmed", pack: "Hamper packed", attempt: "Delivery attempt", fulfilment: "Delivery details updated",
      deliver: "Delivery verified", mark_paid: "Payment verified", mark_refunded: "Refund marked", cancel: "Order cancelled",
    };
    await writeOrderEvent(id, action, eventTitle[action] || "Order updated", note, action === "deliver" ? { otpVerified: true } : {});
    if (["confirm", "pack", "deliver", "cancel", "mark_paid"].includes(action)) {
      const kind = action === "confirm" ? "confirm" : action === "pack" ? "pack" : action === "deliver" ? "deliver" : action === "mark_paid" ? "mark_paid" : "cancel";
      notifyCustomer({ ...o, ...patch }, kind, { trackingUrl: secureTrackingUrl }).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}

function invalidTransition(status: string, next: string) {
  return NextResponse.json({ ok: false, error: `This order is ${status.replace(/_/g, " ")}. It cannot ${next} from this step.` }, { status: 400 });
}

/** Native Android compatibility: HttpURLConnection only allows legacy verbs. */
export async function POST(req: NextRequest) {
  if ((req.headers.get("x-http-method-override") || "").toUpperCase() !== "PATCH")
    return NextResponse.json({ ok: false, error: "Use PATCH" }, { status: 405 });
  return PATCH(req);
}
