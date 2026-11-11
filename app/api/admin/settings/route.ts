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
  const safeBody = { ...b } as Record<string, unknown>;
  // A raw hash must never be writable through the settings patch: it would
  // bypass the strength check below and could lock the owner out.
  delete safeBody.adminPasswordHash;
  delete safeBody.apis;
  const patch: Record<string, unknown> = { ...current, ...safeBody };
  delete patch.undefined;
  if (safeBody.newPassword) {
    const next = String(safeBody.newPassword);
    if (next.length < 10) return NextResponse.json({ ok: false, error: "Use at least 10 characters for the owner password." }, { status: 400 });
    patch.adminPasswordHash = await bcrypt.hash(next, 12);
  }
  delete patch.newPassword;
  const { error } = await sb.from("settings").update({ data: patch, updated_at: new Date().toISOString() }).eq("id", "shop");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}


/** Android uses POST plus this explicit override because HttpURLConnection rejects PATCH. */
export async function POST(req: NextRequest) {
  if ((req.headers.get("x-http-method-override") || "").toUpperCase() !== "PATCH")
    return NextResponse.json({ ok: false, error: "Use PATCH" }, { status: 405 });
  return PATCH(req);
}
