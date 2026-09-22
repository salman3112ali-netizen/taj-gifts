import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await admin().from("subscribers").upsert({ email: String(email).toLowerCase() }, { onConflict: "email" });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
