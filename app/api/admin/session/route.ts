import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export async function GET() {
  return NextResponse.json({ ok: await isAdminRequest() });
}

export async function POST() {
  // logout
  const res = NextResponse.json({ ok: true });
  res.cookies.set("taj_admin_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
