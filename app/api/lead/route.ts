import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, phone, message } = await req.json();
  if (!name || !phone || !message) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await admin().from("leads").insert({ id: crypto.randomUUID(), name: String(name).slice(0, 200), phone: String(phone).slice(0, 40), message: String(message).slice(0, 4000) });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
