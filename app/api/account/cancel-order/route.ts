import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/supabase/server";
import { customerAppIdentity } from "@/lib/customer-app-auth";
import { notifyCustomer } from "@/lib/notify";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Customer self-service cancellation.
 *
 * Runs inside `taj_customer_cancel_order`, which locks the order row, proves
 * the order belongs to the signed-in account, refuses anything already packed,
 * dispatched or paid, restocks the hampers exactly once and writes an audit
 * event. The route only maps that result to HTTP.
 */
export async function POST(req: NextRequest) {
  try {
    const identity = customerAppIdentity(req) ?? await getUserFromRequest(req);
    if (!identity) return NextResponse.json({ ok: false, error: "Please sign in to manage this order." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const orderId = String((body as Record<string, unknown>).orderId || "");
    const reason = String((body as Record<string, unknown>).reason || "").trim().slice(0, 200);
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
      return NextResponse.json({ ok: false, error: "Invalid order reference." }, { status: 400 });
    }

    const sb = admin();
    const { data: order } = await sb
      .from("orders")
      .select("id,customer_email,customer_name,status,total,payment_method,payment_status")
      .eq("id", orderId)
      .eq("user_id", identity.id)
      .maybeSingle();
    if (!order) return NextResponse.json({ ok: false, error: "Order not found on this account." }, { status: 404 });

    const { data, error } = await sb.rpc("taj_customer_cancel_order", {
      p_user_id: identity.id,
      p_order_id: orderId,
      p_reason: reason || null,
    });

    if (error) {
      // The database messages are already written for customers.
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    const result = (data ?? {}) as { ok?: boolean; already?: boolean };

    if (!result.already) {
      notifyCustomer({ ...(order as Order), status: "cancelled" }, "cancel").catch(() => {});
    }
    return NextResponse.json({ ok: true, already: !!result.already });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not cancel this order. Please WhatsApp the studio." }, { status: 500 });
  }
}
