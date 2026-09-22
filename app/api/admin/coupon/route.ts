import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json();
  const { error } = await admin().from("coupons").insert({
    code: String(b.code).toUpperCase().trim(), type: b.type === "percent" ? "percent" : "flat",
    value: Number(b.value) || 0, min_order: Number(b.min_order) || 0,
    active: b.active !== false, label: b.label || null, uses: 0,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const { code, ...patch } = await req.json();
  if (!code) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await admin().from("coupons").update(patch).eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ ok: false }, { status: 400 });
  const { error } = await admin().from("coupons").delete().eq("code", code);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
