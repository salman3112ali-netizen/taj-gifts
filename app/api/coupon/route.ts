import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { couponDiscount } from "@/lib/store";
import type { Coupon } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();
  if (!code) return NextResponse.json({ ok: false, error: "Enter a code first" }, { status: 400 });
  const { data } = await admin().from("coupons").select("*").eq("code", String(code).toUpperCase()).maybeSingle();
  const c = data as Coupon | null;
  if (!c || !c.active) return NextResponse.json({ ok: false, error: "That code isn't active right now" }, { status: 404 });
  if (subtotal < c.min_order) return NextResponse.json({ ok: false, error: `Needs a subtotal of ₹${c.min_order.toLocaleString("en-IN")} or more` }, { status: 400 });
  return NextResponse.json({ ok: true, code: c.code, type: c.type, value: c.value, label: c.label, discount: couponDiscount(c.type, c.value, subtotal) });
}
