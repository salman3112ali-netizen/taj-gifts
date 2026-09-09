import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { admin } from "@/lib/supabase";
import { ADMIN_COOKIE, makeToken } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const { data } = await admin().from("settings").select("data").eq("id", "shop").maybeSingle();
  const hash = (data?.data as Record<string, string> | null)?.adminPasswordHash;
  if (!hash || !(await bcrypt.compare(String(password ?? ""), hash)))
    return NextResponse.json({ ok: false, error: "Wrong password — try again?" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, makeToken(12), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 12 * 3600 });
  return res;
}
