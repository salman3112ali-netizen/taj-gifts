import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { isAdminRequest } from "@/lib/admin";
import type { Order } from "@/lib/types";

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const { id, status, payment_status, note } = await req.json();
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const { data: current } = await admin().from("orders").select("*").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ ok: false }, { status: 404 });
  const o = current as Order;
  const patch: Record<string, unknown> = {};
  const timeline = [...(o.timeline ?? [])];
  if (status && status !== o.status) { patch.status = status; timeline.push({ at: new Date().toISOString(), status, note }); }
  if (payment_status && payment_status !== o.payment_status) { patch.payment_status = payment_status; timeline.push({ at: new Date().toISOString(), status: o.status, note: `payment → ${payment_status}` }); }
  if (Object.keys(patch).length) patch.timeline = timeline;
  const { error } = await admin().from("orders").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
