import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { admin } from "@/lib/supabase";
import { ADMIN_COOKIE, ADMIN_APP_UA, adminSecretConfigured, makeToken } from "@/lib/admin";

// Fast in-process shield. Serverless instances are recycled, so the durable
// limit lives in Postgres (private.rate_limits via taj_rate_limit) below.
const tries = new Map<string, number[]>();

function noCache(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!adminSecretConfigured()) {
    return noCache({ ok: false, error: "Owner security is not configured. Set a 32+ character ADMIN_SECRET in Netlify first." }, 503);
  }

  const ip = (req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0].trim().slice(0, 80);
  const t = Date.now();
  const arr = (tries.get(ip) || []).filter((x) => t - x < 600_000);
  if (arr.length >= 8) return noCache({ ok: false, error: "Too many attempts — wait 10 minutes and try again." }, 429);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return noCache({ ok: false, error: "Wrong password — try again?" }, 400);
  }
  const password = String(body.password ?? "").slice(0, 200);
  if (!password) return noCache({ ok: false, error: "Wrong password — try again?" }, 401);

  const sb = admin();

  // Durable, cross-instance rate limit. Two counters:
  //  · admin_try:<ip>   every attempt (stops bcrypt flooding)
  //  · admin_fail:<ip>  only wrong passwords (8 per 15 minutes, survives restarts)
  let rateLimitAvailable = true;
  try {
    const { data: allowed } = await sb.rpc("taj_rate_limit", {
      p_key: `admin_try:${ip}`,
      p_max: 30,
      p_window_seconds: 900,
    });
    if (allowed === false) return noCache({ ok: false, error: "Too many attempts — wait 15 minutes and try again." }, 429);
  } catch {
    rateLimitAvailable = false;
  }

  const { data } = await sb.from("settings").select("data").eq("id", "shop").maybeSingle();
  const hash = (data?.data as Record<string, string> | null)?.adminPasswordHash;
  if (!hash || !(await bcrypt.compare(password, hash))) {
    arr.push(t);
    tries.set(ip, arr);
    if (rateLimitAvailable) {
      try {
        const [{ data: ipOk }, { data: globalOk }] = await Promise.all([
          sb.rpc("taj_rate_limit", { p_key: `admin_fail:${ip}`, p_max: 8, p_window_seconds: 900 }),
          sb.rpc("taj_rate_limit", { p_key: "admin_fail:all", p_max: 100, p_window_seconds: 900 }),
        ]);
        if (ipOk === false || globalOk === false) {
          return noCache({ ok: false, error: "Too many wrong passwords — the owner panel is locked for 15 minutes." }, 429);
        }
      } catch {
        /* fall back to the in-process counter */
      }
    }
    return noCache({ ok: false, error: "Wrong password — try again?" }, 401);
  }
  tries.delete(ip);

  const isApp = (req.headers.get("user-agent") || "").includes(ADMIN_APP_UA);
  const token = isApp ? makeToken(24 * 365, "app") : makeToken(12, "web");
  const res = noCache({ ok: true, token });
  if (isApp) {
    // private admin app ONLY: login once, stay in for a year (cookie locked to the app's user-agent)
    res.cookies.set(ADMIN_COOKIE, makeToken(24 * 365, "app"), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 365 * 24 * 3600,
    });
  }
  // website: NO cookie at all — the admin page keeps this token in the current tab only
  return res;
}
