import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { customerAppIdentity } from "@/lib/customer-app-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const identity = customerAppIdentity(req);
  if (!identity) return NextResponse.json({ ok: false, error: "Please sign in again in the Taj app." }, { status: 401 });
  try {
    const sb = admin();
    // Migrate genuine past guest orders only when their checkout email matches the
    // verified account email. We deliberately never link by an unverified phone.
    if (identity.email) {
      await sb.from("orders").update({ user_id: identity.id }).eq("customer_email", identity.email).is("user_id", null);
    }
    const { data, error } = await sb
      .from("orders")
      .select("id,status,total,created_at,payment_method,payment_status")
      .eq("user_id", identity.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    const ids = (data || []).map((order) => order.id);
    const { data: items } = ids.length
      ? await sb.from("order_items").select("order_id,image").in("order_id", ids).order("created_at", { ascending: true })
      : { data: [] as { order_id: string; image: string | null }[] };
    const imageByOrder = new Map<string, string>();
    for (const item of items || []) if (!imageByOrder.has(item.order_id) && item.image) imageByOrder.set(item.order_id, item.image);
    return NextResponse.json({
      ok: true,
      orders: (data || []).map((order) => ({ ...order, image: imageByOrder.get(order.id) || "" })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not retrieve your orders." }, { status: 500 });
  }
}
