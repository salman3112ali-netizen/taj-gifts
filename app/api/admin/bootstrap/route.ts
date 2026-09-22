import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = admin();
  const [orders, items, products, coupons, leads, subscribers, customers, settings] = await Promise.all([
    sb.from("orders").select("*").order("created_at", { ascending: false }).limit(200),
    sb.from("order_items").select("*").order("created_at", { ascending: false }).limit(600),
    sb.from("products").select("*").order("created_at", { ascending: true }),
    sb.from("coupons").select("*").order("created_at", { ascending: true }),
    sb.from("leads").select("*").order("created_at", { ascending: false }).limit(100),
    sb.from("subscribers").select("*").order("created_at", { ascending: false }).limit(200),
    sb.from("customers").select("*").order("last_order_at", { ascending: false, nullsFirst: false }).limit(200),
    sb.from("settings").select("data").eq("id", "shop").maybeSingle(),
  ]);
  const { adminPasswordHash, apis, ...safeSettings } = (settings.data?.data ?? {}) as Record<string, unknown>;
  void adminPasswordHash;
  void apis; // secrets never ride along in bootstrap — the APIs tab fetches them separately
  return NextResponse.json({
    ok: true,
    orders: orders.data ?? [],
    items: items.data ?? [],
    products: products.data ?? [],
    coupons: coupons.data ?? [],
    leads: leads.data ?? [],
    subscribers: subscribers.data ?? [],
    customers: customers.data ?? [],
    settings: safeSettings,
  });
}
