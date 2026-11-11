import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { couponDiscount } from "@/lib/store";
import type { Coupon } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Gift-code preview used by the basket.
 *
 * The coupons table is no longer readable from the browser (0009), so this is
 * the only path that resolves a code — and it is rate-limited so the code space
 * cannot be walked by a script. The server-side checkout re-validates the code
 * again; this endpoint is only a preview and never writes anything.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Enter a code first" }, { status: 400 });
  }

  const code = String(body.code || "").trim().toUpperCase().slice(0, 32);
  const subtotal = Math.max(0, Math.min(Number(body.subtotal) || 0, 10_000_000));
  if (!code) return NextResponse.json({ ok: false, error: "Enter a code first" }, { status: 400 });

  const ip = (req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0].trim().slice(0, 80);
  const sb = admin();
  try {
    const { data: allowed } = await sb.rpc("taj_rate_limit", {
      p_key: `coupon:${ip}`,
      p_max: 40,
      p_window_seconds: 600,
    });
    if (allowed === false) {
      return NextResponse.json({ ok: false, error: "Too many code checks. Please wait a minute." }, { status: 429 });
    }
  } catch {
    /* fail open for real customers if the limiter is unavailable */
  }

  const { data } = await sb.from("coupons").select("*").eq("code", code).maybeSingle();
  const c = data as Coupon | null;
  if (!c || !c.active) return NextResponse.json({ ok: false, error: "That code isn't active right now" }, { status: 404 });
  if (subtotal < c.min_order) {
    return NextResponse.json(
      { ok: false, error: `Needs a subtotal of ₹${c.min_order.toLocaleString("en-IN")} or more` },
      { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    code: c.code,
    type: c.type,
    value: c.value,
    label: c.label,
    discount: couponDiscount(c.type, c.value, subtotal),
  });
}
