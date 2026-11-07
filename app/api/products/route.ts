import { NextResponse } from "next/server";
import { getProducts, getSettings } from "@/lib/store";

/**
 * Native storefront bootstrap. Intentionally contains only published catalog data
 * and customer-safe store settings — never admin hashes, integration keys or APIs.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const [products, raw] = await Promise.all([getProducts(), getSettings()]);
  const settings = { ...(raw as Record<string, unknown>) };
  delete settings.adminPasswordHash;
  delete settings.apis;
  delete settings.appAnnouncements; // campaign copy is delivered by /api/app/notifications
  return NextResponse.json(
    { ok: true, products, settings, fetchedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
