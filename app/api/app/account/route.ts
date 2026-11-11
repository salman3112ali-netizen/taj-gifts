import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { customerAppIdentity } from "@/lib/customer-app-auth";

export const dynamic = "force-dynamic";

function requireCustomer(req: NextRequest) {
  const identity = customerAppIdentity(req);
  if (!identity) return { identity: null, response: NextResponse.json({ ok: false, error: "Please sign in again in the Taj app." }, { status: 401 }) };
  return { identity, response: null };
}

export async function GET(req: NextRequest) {
  const { identity, response } = requireCustomer(req);
  if (!identity) return response!;
  try {
    const sb = admin();
    const [{ data: profile }, { data: addresses }] = await Promise.all([
      sb.from("profiles").select("full_name,phone,avatar_url").eq("id", identity.id).maybeSingle(),
      sb.from("addresses").select("id,label,name,phone,address,landmark,city,pincode,is_default").eq("user_id", identity.id).order("is_default", { ascending: false }).limit(5),
    ]);
    return NextResponse.json({
      ok: true,
      profile: {
        name: profile?.full_name || identity.name || "",
        phone: profile?.phone || "",
        email: identity.email || "",
        address: addresses?.[0]?.address || "",
        landmark: addresses?.[0]?.landmark || "",
        city: addresses?.[0]?.city || "",
        pincode: addresses?.[0]?.pincode || "",
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Accounts migration may still be pending; the native sign-in remains valid.
    return NextResponse.json({ ok: true, profile: { name: identity.name || "", email: identity.email || "" } });
  }
}

export async function POST(req: NextRequest) {
  const { identity, response } = requireCustomer(req);
  if (!identity) return response!;
  try {
    const input = await req.json();
    const raw = (input.profile || input) as Record<string, unknown>;
    const name = String(raw.name || "").trim().slice(0, 120);
    const phone = String(raw.phone || "").replace(/\D/g, "").slice(-10);
    const address = String(raw.address || "").trim().slice(0, 500);
    const landmark = String(raw.landmark || "").trim().slice(0, 160);
    const city = String(raw.city || "").trim().slice(0, 120);
    const pincode = String(raw.pincode || "").replace(/\D/g, "").slice(0, 6);
    const sb = admin();
    await sb.from("profiles").upsert({ id: identity.id, full_name: name || null, phone: phone || null, updated_at: new Date().toISOString() });
    if (address && city && pincode.length === 6) {
      const { data: existing } = await sb.from("addresses").select("id").eq("user_id", identity.id).eq("is_default", true).maybeSingle();
      const saved = { user_id: identity.id, label: "Home", name: name || "Taj customer", phone, address, landmark: landmark || null, city, pincode, is_default: true };
      if (existing?.id) await sb.from("addresses").update(saved).eq("id", existing.id);
      else await sb.from("addresses").insert(saved);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Could not save your account details." }, { status: 500 });
  }
}
