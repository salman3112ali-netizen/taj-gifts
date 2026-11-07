import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
type AppEvent = {
  id: string; type: "offer" | "arrival" | "studio"; title: string; body: string;
  image?: string | null; deeplink?: string | null; createdAt: string;
};

/**
 * Customer-safe notification feed. It uses no third-party data backend:
 * - owner-authored broadcasts live in settings.data.appAnnouncements
 * - active coupon promotions and newly published products are generated from
 *   the existing Supabase records.
 * Android background jobs poll this feed and post native notifications.
 */
export async function GET() {
  const sb = admin();
  const [settingsRes, productsRes, couponsRes] = await Promise.all([
    sb.from("settings").select("data,updated_at").eq("id", "shop").maybeSingle(),
    sb.from("products").select("id,slug,name,tagline,image,badge,created_at,updated_at,published").eq("published", true).order("updated_at", { ascending: false, nullsFirst: false }).limit(16),
    sb.from("coupons").select("code,type,value,min_order,label,created_at,active").eq("active", true).order("created_at", { ascending: false }).limit(12),
  ]);
  const raw = (settingsRes.data?.data ?? {}) as Record<string, unknown>;
  const broadcasts = Array.isArray(raw.appAnnouncements) ? raw.appAnnouncements : [];
  const events: AppEvent[] = [];

  for (const v of broadcasts.slice(0, 40)) {
    const b = v as Record<string, unknown>;
    if (!b.id || !b.title || b.active === false) continue;
    events.push({
      id: `broadcast:${String(b.id)}`,
      type: (b.type === "arrival" || b.type === "studio") ? b.type : "offer",
      title: String(b.title).slice(0, 90),
      body: String(b.body || "A little something from Taj Gifts.").slice(0, 240),
      image: typeof b.image === "string" ? b.image : null,
      deeplink: typeof b.deeplink === "string" ? b.deeplink : "/shop",
      createdAt: String(b.createdAt || settingsRes.data?.updated_at || new Date().toISOString()),
    });
  }

  for (const c of (couponsRes.data ?? []) as Record<string, unknown>[]) {
    const percent = c.type === "percent" ? `${c.value}%` : `₹${c.value}`;
    events.push({
      id: `coupon:${String(c.code)}:${String(c.created_at || "")}`,
      type: "offer",
      title: `${String(c.code)} · ${percent} off`,
      body: String(c.label || `Use ${String(c.code)} on your next hand-tied hamper.`),
      image: null,
      deeplink: "/shop",
      createdAt: String(c.created_at || new Date().toISOString()),
    });
  }

  for (const p of (productsRes.data ?? []) as Record<string, unknown>[]) {
    const at = String(p.updated_at || p.created_at || new Date().toISOString());
    events.push({
      id: `product:${String(p.id)}:${at}`,
      type: "arrival",
      title: p.badge ? String(p.badge) : `Fresh from the studio`,
      body: `${String(p.name)}${p.tagline ? ` · ${String(p.tagline)}` : " is ready to be wrapped."}`,
      image: typeof p.image === "string" ? p.image : null,
      deeplink: `/product/${String(p.slug)}`,
      createdAt: at,
    });
  }

  // newest first, stable IDs let phones de-duplicate without a database migration
  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ ok: true, events: events.slice(0, 50) }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
