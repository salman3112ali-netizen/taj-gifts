import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Newsletter signup.
 *
 * Public endpoint, so it is deliberately boring: one bounded string, one
 * server-side rate limit per connection, and a silent success for repeats.
 * No customer data is echoed back.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot: real people never fill a hidden field.
  if (String(body.website || "").trim()) return NextResponse.json({ ok: true });

  const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]{1,64}@[^\s@]{1,189}\.[^\s@]{2,}$/.test(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = (req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0].trim().slice(0, 80);
  const sb = admin();
  try {
    const { data: allowed } = await sb.rpc("taj_rate_limit", {
      p_key: `subscribe:${ip}`,
      p_max: 5,
      p_window_seconds: 3600,
    });
    if (allowed === false) return NextResponse.json({ ok: true }); // stay quiet, stop the loop
  } catch {
    /* rate-limit table unavailable — never block a real customer over it */
  }

  const { error } = await sb.from("subscribers").upsert({ email }, { onConflict: "email" });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
