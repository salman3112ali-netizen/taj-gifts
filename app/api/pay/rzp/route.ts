import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase/server";
import { customerAppIdentity } from "@/lib/customer-app-auth";
import { apiCfg } from "@/lib/apis";

export const dynamic = "force-dynamic";
const ORDER_ID = /^[0-9a-f-]{16,120}$/i;

/**
 * Razorpay is optional. The public GET deliberately reveals only whether it is
 * available and the publishable key needed by Checkout.js — never the secret.
 */
export async function GET() {
  const cfg = await apiCfg();
  const key = cfg.rzpKeyId;
  return NextResponse.json({ enabled: !!key && !!cfg.rzpKeySecret, key: key || null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  try {
    const cfg = await apiCfg();
    const key = cfg.rzpKeyId;
    const secret = cfg.rzpKeySecret;
    if (!key || !secret) return NextResponse.json({ ok: false, error: "Secure card/UPI checkout is not configured yet." }, { status: 503 });

    const identity = customerAppIdentity(req) ?? await getCurrentUser();
    if (!identity) return NextResponse.json({ ok: false, error: "Please sign in to the account that placed this order." }, { status: 401 });
    const { orderId } = await req.json();
    if (!ORDER_ID.test(String(orderId || ""))) return NextResponse.json({ ok: false, error: "Invalid order reference." }, { status: 400 });

    const sb = admin();
    const { data: order } = await sb
      .from("orders")
      .select("id,total,customer_name,customer_email,payment_status,status,user_id,razorpay_order_id")
      .eq("id", orderId)
      .eq("user_id", identity.id)
      .maybeSingle();
    // Avoid turning this endpoint into an order-ID oracle.
    if (!order) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    if (order.status === "cancelled") return NextResponse.json({ ok: false, error: "This order was cancelled and cannot be paid." }, { status: 409 });
    if (order.payment_status === "paid") return NextResponse.json({ ok: false, error: "This order is already paid." }, { status: 409 });
    if (!Number.isInteger(order.total) || order.total <= 0) return NextResponse.json({ ok: false, error: "This order total is invalid." }, { status: 409 });

    // Reuse the Razorpay order for a retry; generating several gateway orders
    // for one Taj order makes reconciliation needlessly difficult.
    if (order.razorpay_order_id) {
      return NextResponse.json({
        ok: true,
        rzpOrderId: order.razorpay_order_id,
        key,
        amount: Math.round(Number(order.total) * 100),
        name: "Taj Gifts",
        email: order.customer_email || identity.email || "",
        prefill_name: order.customer_name || "",
      });
    }

    const gateway = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(Number(order.total) * 100),
        currency: "INR",
        receipt: order.id.slice(0, 40),
        notes: { taj_order_id: order.id },
      }),
    });
    if (!gateway.ok) return NextResponse.json({ ok: false, error: "The secure payment provider is unavailable. Please try again shortly." }, { status: 502 });
    const razorpay = await gateway.json() as { id?: string; amount?: number; currency?: string };
    if (!razorpay.id || razorpay.amount !== Math.round(Number(order.total) * 100) || razorpay.currency !== "INR") {
      return NextResponse.json({ ok: false, error: "The payment provider returned an invalid order." }, { status: 502 });
    }

    // Only attach it if the Taj order is still unpaid and does not already have
    // a gateway order. In a simultaneous retry we return the winner's order.
    const { data: claimed, error } = await sb
      .from("orders")
      .update({ razorpay_order_id: razorpay.id })
      .eq("id", order.id)
      .eq("user_id", identity.id)
      .is("razorpay_order_id", null)
      .neq("payment_status", "paid")
      .select("razorpay_order_id")
      .maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: "Could not initialise secure payment. Please try again." }, { status: 409 });
    const rzpOrderId = claimed?.razorpay_order_id || order.razorpay_order_id;
    if (!rzpOrderId) return NextResponse.json({ ok: false, error: "This order changed before payment could begin. Please refresh it." }, { status: 409 });

    return NextResponse.json({
      ok: true,
      rzpOrderId,
      key,
      amount: Math.round(Number(order.total) * 100),
      name: "Taj Gifts",
      email: order.customer_email || identity.email || "",
      prefill_name: order.customer_name || "",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not initialise secure payment. Please try again." }, { status: 500 });
  }
}
