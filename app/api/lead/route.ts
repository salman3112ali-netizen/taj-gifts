import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";

const hits = new Map<string, number[]>();
const PHONE = /^[6-9]\d{9}$/;

/** Custom-order requests are a public form, so validate and lightly rate-limit them. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Invisible honeypot: real customers never populate it.
    if (String(body.website || "").trim()) return NextResponse.json({ ok: true });
    const name = String(body.name || "").trim().slice(0, 120);
    let phone = String(body.phone || "").replace(/\D/g, "");
    if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);
    const message = String(body.message || "").trim().slice(0, 1500);
    if (name.length < 2 || !PHONE.test(phone) || message.length < 12) {
      return NextResponse.json({ ok: false, error: "Please enter your name, a valid 10-digit mobile number and a little more detail about the request." }, { status: 400 });
    }

    const ip = (req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((at) => now - at < 3_600_000);
    if (recent.length >= 6) return NextResponse.json({ ok: false, error: "Too many requests from this connection. Please WhatsApp the studio instead." }, { status: 429 });
    recent.push(now);
    hits.set(ip, recent);

    const { error } = await admin().from("leads").insert({ id: crypto.randomUUID(), name, phone, message });
    if (error) return NextResponse.json({ ok: false, error: "Could not save your request. Please try WhatsApp." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not send your request. Please try WhatsApp." }, { status: 400 });
  }
}
