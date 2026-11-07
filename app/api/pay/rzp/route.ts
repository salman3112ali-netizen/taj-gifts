import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { apiCfg } from "@/lib/apis";
import { notifyCustomer } from "@/lib/notify";

/**
 * Razorpay (real gateway: UPI + cards + netbanking, RBI-compliant, auto-verified).
 * Stays INVISIBLE until RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are set in Netlify env
 * (free signup at razorpay.com → KYC → keys). No keys = option never shows.
 */
export async function GET() {
  const cfg = await apiCfg();
  const key = cfg.rzpKeyId;
  return NextResponse.json({ enabled: !!key && !!cfg.rzpKeySecret, key: key || null });
}

export async function POST(req: NextRequest) {
  const cfg = await apiCfg();
  const key = cfg.rzpKeyId;
  const secret = cfg.rzpKeySecret;
  if (!key || !secret) return NextResponse.json({ ok: false, error: "gateway not configured" }, { status: 503 });
  const { orderId } = await req.json();
  const sb = admin();
  const { data: o } = await sb.from("orders").select("id,total,customer_name,customer_email,payment_status,status").eq("id", orderId).maybeSingle();
  if (!o) return NextResponse.json({ ok: false, error: "order not found" }, { status: 404 });
  if (o.payment_status === "paid") return NextResponse.json({ ok: false, error: "already paid" }, { status: 409 });
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64"), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(Number(o.total) * 100), currency: "INR", receipt: o.id.slice(0, 20), notes: { order_id: o.id } }),
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: "gateway error" }, { status: 502 });
  const rzp = await r.json();
  return NextResponse.json({ ok: true, rzpOrderId: rzp.id, key, amount: Math.round(Number(o.total) * 100), name: "Taj Gifts", email: o.customer_email || "", prefill_name: o.customer_name || "" });
}
