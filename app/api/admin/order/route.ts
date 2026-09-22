import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";
import { notifyCustomer } from "@/lib/notify";
import type { Order, OrderItem } from "@/lib/types";

/**
 * Order operations — the full real-commerce lifecycle, all server-side:
 *   confirm → pack → dispatch (generates delivery OTP, emails it to customer)
 *   → deliver (OTP MUST match) | cancel (restocks) | mark_paid
 * Legacy {status}/{payment_status} patches still work for the old selects.
 */
export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json();
  const { id, action, note } = b as { id: string; action?: string; note?: string };
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  const sb = admin();
  const { data: current } = await sb.from("orders").select("*").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
  const o = current as Order;
  const now = new Date().toISOString();
  const timeline = [...(o.timeline ?? [])];
  const patch: Record<string, unknown> = {};

  const push = (status: string, n?: string, extra?: Record<string, unknown>) =>
    timeline.push({ at: now, status, note: n, ...extra } as never);

  if (!action) {
    // legacy direct patches
    if (b.status && b.status !== o.status) { patch.status = b.status; push(b.status, b.note); }
    if (b.payment_status && b.payment_status !== o.payment_status) { patch.payment_status = b.payment_status; push(o.status, `payment → ${b.payment_status}`); }
  } else if (action === "confirm") {
    patch.status = "confirmed"; push("confirmed", note || "Order confirmed by studio");
  } else if (action === "pack") {
    patch.status = "packed"; push("packed", note || "Hamper tied, boxed & labelled");
  } else if (action === "dispatch") {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    patch.status = "out_for_delivery";
    push("out_for_delivery", "Out for delivery — OTP sent to customer", { otp });
    patch.timeline = timeline;
    const { error } = await sb.from("orders").update(patch).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    notifyCustomer(o, "dispatch", otp).catch(() => {});
    return NextResponse.json({ ok: true, otp });
  } else if (action === "deliver") {
    const otpEntries = (o.timeline ?? []).filter((t: { otp?: string }) => t.otp);
    const expected = otpEntries.length ? String((otpEntries[otpEntries.length - 1] as { otp: string }).otp) : null;
    if (!expected) return NextResponse.json({ ok: false, error: "Dispatch the order first — that generates the customer OTP." }, { status: 400 });
    if (String(b.otp ?? "").trim() !== expected) return NextResponse.json({ ok: false, error: "Wrong OTP — ask the customer for the 4-digit code from their order page / email." }, { status: 400 });
    patch.status = "delivered";
    push("delivered", `Delivered — OTP ${expected} verified at doorstep`);
    if (o.payment_method === "COD" && o.payment_status !== "paid") { patch.payment_status = "paid"; push("delivered", "Cash collected at doorstep"); }
  } else if (action === "mark_paid") {
    patch.payment_status = "paid"; push(o.status, "Payment received & verified");
  } else if (action === "cancel") {
    patch.status = "cancelled"; push("cancelled", note || "Cancelled");
    // restock
    const { data: its } = await sb.from("order_items").select("product_id,qty").eq("order_id", id);
    for (const it of (its ?? []) as Pick<OrderItem, "product_id" | "qty">[]) {
      if (!it.product_id) continue;
      const { data: p } = await sb.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (p) await sb.from("products").update({ stock: (p.stock ?? 0) + it.qty }).eq("id", it.product_id);
    }
  } else {
    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  }

  if (Object.keys(patch).length) patch.timeline = timeline;
  const { error } = await sb.from("orders").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  if (action && action !== "dispatch") notifyCustomer(o, action as never, undefined).catch(() => {});
  return NextResponse.json({ ok: true });
}
