import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { admin } from "@/lib/supabase";
import { apiCfg } from "@/lib/apis";
import { notifyCustomer } from "@/lib/notify";
import type { Order } from "@/lib/types";

/** Server-side signature verification — payment is trusted ONLY after this passes. */
export async function POST(req: NextRequest) {
  const secret = (await apiCfg()).rzpKeySecret;
  if (!secret) return NextResponse.json({ ok: false }, { status: 503 });
  const { orderId, rzpOrderId, paymentId, signature } = await req.json();
  const expected = crypto.createHmac("sha256", secret).update(`${rzpOrderId}|${paymentId}`).digest("hex");
  const ok = expected === String(signature || "");
  if (!ok) return NextResponse.json({ ok: false, error: "signature mismatch" }, { status: 400 });

  const sb = admin();
  const { data: cur } = await sb.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!cur) return NextResponse.json({ ok: false }, { status: 404 });
  const o = cur as Order;
  const now = new Date().toISOString();
  const timeline = [...(o.timeline ?? []), { at: now, status: o.status, note: `Payment verified via Razorpay (${String(paymentId).slice(0, 12)}…)` } as never];
  await sb.from("orders").update({ payment_status: "paid", payment_method: "UPI", timeline, updated_at: now }).eq("id", orderId);
  notifyCustomer(o, "mark_paid").catch(() => {});
  return NextResponse.json({ ok: true });
}
