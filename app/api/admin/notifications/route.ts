import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

export const dynamic = "force-dynamic";
type AdminEvent = { id: string; type: string; title: string; body: string; createdAt: string; orderId?: string; image?: string | null; deeplink?: string };

/** Private owner notification feed + campaign composer. No Firebase/database migration
 * is required: operational events are derived from live Supabase records and marketing
 * broadcasts are retained safely in settings.data.appAnnouncements. */
export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = admin();
  const [ordersRes, customersRes, leadsRes, subscribersRes, productsRes, settingsRes] = await Promise.all([
    sb.from("orders").select("id,created_at,total,customer_name,customer_city,status,payment_method").order("created_at", { ascending: false }).limit(80),
    sb.from("customers").select("phone,name,city,order_count,last_order_at,first_order_at").order("last_order_at", { ascending: false, nullsFirst: false }).limit(80),
    sb.from("leads").select("*").order("created_at", { ascending: false }).limit(60),
    sb.from("subscribers").select("*").order("created_at", { ascending: false }).limit(60),
    sb.from("products").select("id,name,stock,image,updated_at").lte("stock", 3).order("stock", { ascending: true }).limit(40),
    sb.from("settings").select("data").eq("id", "shop").maybeSingle(),
  ]);
  const events: AdminEvent[] = [];
  for (const o of (ordersRes.data ?? []) as Record<string, unknown>[]) events.push({
    id: `order:${String(o.id)}`, type: "order", title: `New order · ₹${Number(o.total || 0).toLocaleString("en-IN")}`,
    body: `${String(o.customer_name || "Customer")} · ${String(o.customer_city || "")}${o.payment_method ? ` · ${String(o.payment_method)}` : ""}`,
    createdAt: String(o.created_at), orderId: String(o.id), deeplink: `/order/${String(o.id)}`,
  });
  for (const c of (customersRes.data ?? []) as Record<string, unknown>[]) {
    if (Number(c.order_count || 0) !== 1) continue;
    const at = String(c.first_order_at || c.last_order_at || new Date().toISOString());
    events.push({ id: `customer:${String(c.phone)}:${at}`, type: "customer", title: "New customer", body: `${String(c.name || "Guest")} · ${String(c.city || "")}`, createdAt: at, deeplink: "/customers" });
  }
  for (const l of (leadsRes.data ?? []) as Record<string, unknown>[]) {
    const at = String(l.created_at || new Date().toISOString()); const who = String(l.name || l.email || l.phone || "New enquiry");
    events.push({ id: `lead:${String(l.id || who)}:${at}`, type: "lead", title: "New enquiry", body: who, createdAt: at, deeplink: "/enquiries" });
  }
  for (const s of (subscribersRes.data ?? []) as Record<string, unknown>[]) {
    const at = String(s.created_at || new Date().toISOString()); const email = String(s.email || "New subscriber");
    events.push({ id: `subscriber:${String(s.id || email)}:${at}`, type: "subscriber", title: "Newsletter signup", body: email, createdAt: at, deeplink: "/subscribers" });
  }
  for (const p of (productsRes.data ?? []) as Record<string, unknown>[]) {
    const at = String(p.updated_at || new Date().toISOString());
    events.push({ id: `stock:${String(p.id)}:${at}:${String(p.stock)}`, type: "stock", title: `Low stock · ${String(p.stock)} left`, body: String(p.name), createdAt: at, image: typeof p.image === "string" ? p.image : null, deeplink: "/catalog" });
  }
  const raw = (settingsRes.data?.data ?? {}) as Record<string, unknown>;
  const broadcasts = Array.isArray(raw.appAnnouncements) ? raw.appAnnouncements : [];
  for (const b of broadcasts.slice(0, 20) as Record<string, unknown>[]) {
    if (!b.id || b.active === false) continue;
    events.push({ id: `broadcast:${String(b.id)}`, type: "broadcast", title: `Live to customers · ${String(b.title || "Campaign")}`, body: String(b.body || ""), createdAt: String(b.createdAt || new Date().toISOString()), image: typeof b.image === "string" ? b.image : null, deeplink: "/campaigns" });
  }
  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ ok: true, events: events.slice(0, 180) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json() as Record<string, unknown>;
  const title = String(b.title || "").trim();
  const body = String(b.body || "").trim();
  if (!title || !body) return NextResponse.json({ ok: false, error: "A campaign needs a title and message." }, { status: 400 });
  const now = new Date().toISOString();
  const event = {
    id: crypto.randomUUID(), title: title.slice(0, 90), body: body.slice(0, 240),
    type: b.type === "arrival" || b.type === "studio" ? b.type : "offer",
    image: typeof b.image === "string" ? b.image.slice(0, 2000) : null,
    deeplink: typeof b.deeplink === "string" ? b.deeplink.slice(0, 300) : "/shop",
    active: true, createdAt: now,
  };
  const sb = admin();
  const { data } = await sb.from("settings").select("data").eq("id", "shop").maybeSingle();
  const current = (data?.data ?? {}) as Record<string, unknown>;
  const old = Array.isArray(current.appAnnouncements) ? current.appAnnouncements : [];
  const next = [event, ...old].slice(0, 50);
  const { error } = await sb.from("settings").update({ data: { ...current, appAnnouncements: next }, updated_at: now }).eq("id", "shop");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, event });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing campaign id" }, { status: 400 });
  const sb = admin();
  const { data } = await sb.from("settings").select("data").eq("id", "shop").maybeSingle();
  const current = (data?.data ?? {}) as Record<string, unknown>;
  const old = Array.isArray(current.appAnnouncements) ? current.appAnnouncements as Record<string, unknown>[] : [];
  const appAnnouncements = old.filter((x) => String(x.id) !== id);
  const { error } = await sb.from("settings").update({ data: { ...current, appAnnouncements }, updated_at: new Date().toISOString() }).eq("id", "shop");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
