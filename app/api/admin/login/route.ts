import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { admin } from "@/lib/supabase";
import { ADMIN_COOKIE, ADMIN_APP_UA, adminSecretConfigured, makeToken } from "@/lib/admin";

// brute-force shield: 8 wrong tries per IP per 10 minutes
const tries = new Map<string, number[]>();

export async function POST(req: NextRequest) {
  if (!adminSecretConfigured()) return NextResponse.json({ ok: false, error: "Owner security is not configured. Set a 32+ character ADMIN_SECRET in Netlify first." }, { status: 503 });
  const ip = req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown";
  const t = Date.now();
  const arr = (tries.get(ip) || []).filter((x) => t - x < 600_000);
  if (arr.length >= 8) return NextResponse.json({ ok: false, error: "Too many attempts — wait 10 minutes and try again." }, { status: 429 });

  const { password } = await req.json();
  const { data } = await admin().from("settings").select("data").eq("id", "shop").maybeSingle();
  const hash = (data?.data as Record<string, string> | null)?.adminPasswordHash;
  if (!hash || !(await bcrypt.compare(String(password ?? ""), hash))) {
    arr.push(t);
    tries.set(ip, arr);
    return NextResponse.json({ ok: false, error: "Wrong password — try again?" }, { status: 401 });
  }
  tries.delete(ip);

  const isApp = (req.headers.get("user-agent") || "").includes(ADMIN_APP_UA);
  const token = isApp ? makeToken(24 * 365, "app") : makeToken(12, "web");
  const res = NextResponse.json({ ok: true, token });
  if (isApp) {
    // private admin app ONLY: login once, stay in for a year (cookie locked to the app's user-agent)
    res.cookies.set(ADMIN_COOKIE, makeToken(24 * 365, "app"), { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 365 * 24 * 3600 });
  }
  // website: NO cookie at all — the admin page keeps this token in the current tab only
  return res;
}
