import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const b = await req.json();
  const sb = admin();
  const { data } = await sb.from("settings").select("data").eq("id", "shop").maybeSingle();
  const current = (data?.data ?? {}) as Record<string, unknown>;
  const patch: Record<string, unknown> = { ...current, ...b };
  delete patch.undefined;
  if (b.newPassword) {
    if (String(b.newPassword).length < 8) return NextResponse.json({ ok: false, error: "Password must be 8+ characters" }, { status: 400 });
    patch.adminPasswordHash = await bcrypt.hash(String(b.newPassword), 10);
  }
  delete patch.newPassword;
  const { error } = await sb.from("settings").update({ data: patch, updated_at: new Date().toISOString() }).eq("id", "shop");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
