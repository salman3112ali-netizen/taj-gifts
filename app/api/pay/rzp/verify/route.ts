import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase/server";
import { customerAppIdentity } from "@/lib/customer-app-auth";
import { apiCfg } from "@/lib/apis";
import { notifyCustomer } from "@/lib/notify";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Payment is marked paid only after all of these agree: the signed-in order
 * owner, the stored Razorpay order id, Razorpay's checkout signature and a live
 * Razorpay payment lookup with the expected amount/currency/status.
 */
export async function POST(req: NextRequest) {
  try {
    const cfg = await apiCfg();
    const secret = cfg.rzpKeySecret;
    const key = cfg.rzpKeyId;
    if (!key || !secret) return NextResponse.json({ ok: false, error: "Secure payment is not configured." }, { status: 503 });

    const identity = customerAppIdentity(req) ?? await getCurrentUser();
    if (!identity) return NextResponse.json({ ok: false, error: "Please sign in to the account that placed this order." }, { status: 401 });

    const { orderId, rzpOrderId, paymentId, signature } = await req.json();
    if (![orderId, rzpOrderId, paymentId, signature].every((value) => typeof value === "string" && value.length > 5 && value.length < 300)) {
      return NextResponse.json({ ok: false, error: "Payment verification data is incomplete." }, { status: 400 });
    }
    const expected = crypto.createHmac("sha256", secret).update(`${rzpOrderId}|${paymentId}`).digest("hex");
    const provided = String(signature);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(expected, "utf8"))) {
      return NextResponse.json({ ok: false, error: "Payment signature could not be verified." }, { status: 400 });
    }

    const sb = admin();
    const { data: current } = await sb
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", identity.id)
      .maybeSingle();
    if (!current) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    const order = current as Order & { user_id?: string | null; updated_at?: string | null };
    if (order.status === "cancelled") return NextResponse.json({ ok: false, error: "This order was cancelled and cannot be paid." }, { status: 409 });
    if (order.payment_status === "paid") return NextResponse.json({ ok: true, already: true });
    if (!order.razorpay_order_id || order.razorpay_order_id !== rzpOrderId) {
      return NextResponse.json({ ok: false, error: "This payment does not belong to the current order." }, { status: 400 });
    }

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
    });
    if (!paymentResponse.ok) return NextResponse.json({ ok: false, error: "The payment provider could not confirm this payment yet." }, { status: 502 });
    const payment = await paymentResponse.json() as { id?: string; order_id?: string; amount?: number; currency?: string; status?: string };
    const expectedAmount = Math.round(Number(order.total) * 100);
    if (
      payment.id !== paymentId ||
      payment.order_id !== order.razorpay_order_id ||
      payment.amount !== expectedAmount ||
      payment.currency !== "INR" ||
      !["captured", "authorized"].includes(String(payment.status))
    ) {
      return NextResponse.json({ ok: false, error: "The provider payment details do not match this order." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const timeline = [...(order.timeline ?? []), { at: now, status: order.status, note: `Payment verified securely (${paymentId.slice(0, 12)}…)` }];
    const { data: updated, error } = await sb
      .from("orders")
      .update({
        payment_status: "paid",
        payment_method: "Razorpay",
        razorpay_payment_id: paymentId,
        timeline,
      })
      .eq("id", order.id)
      .eq("user_id", identity.id)
      .neq("status", "cancelled")
      .neq("payment_status", "paid")
      .select("id")
      .maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: "Could not save verified payment. Please contact the studio with your payment reference." }, { status: 409 });
    if (!updated) {
      const { data: latest } = await sb.from("orders").select("payment_status").eq("id", order.id).eq("user_id", identity.id).maybeSingle();
      return latest?.payment_status === "paid"
        ? NextResponse.json({ ok: true, already: true })
        : NextResponse.json({ ok: false, error: "This order changed before payment verification completed." }, { status: 409 });
    }

    notifyCustomer({ ...order, payment_status: "paid", payment_method: "Razorpay", timeline } as never, "mark_paid").catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Payment verification could not be completed. Please do not pay again; contact the studio if money was debited." }, { status: 500 });
  }
}
