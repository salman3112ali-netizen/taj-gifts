import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase/server";
import { couponDiscount, deliveryFor } from "@/lib/store";
import type { Coupon, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { slug: string; qty: number; variant: string | null; addons: string[] }[] = body.items ?? [];
    const c = body.customer ?? {};
    if (!items.length) return NextResponse.json({ ok: false, error: "Your basket is empty." }, { status: 400 });
    if (!c.name || !c.phone || !c.address || !c.city || !/^\d{6}$/.test(String(c.pincode)))
      return NextResponse.json({ ok: false, error: "Please fill all required address fields." }, { status: 400 });

    const sb = admin();
    const { data: settingsRow } = await sb.from("settings").select("data").eq("id", "shop").maybeSingle();
    const settings = settingsRow?.data as Record<string, unknown> | null;
    const { data: prows } = await sb.from("products").select("*").in("slug", items.map((i) => i.slug));
    const products = new Map((prows ?? []).map((p: Product) => [p.slug, p]));

    // Price server-side — never trust the browser.
    const lines = items.map((i) => {
      const p = products.get(i.slug);
      if (!p) throw new Error(`Unknown product ${i.slug}`);
      const qty = Math.max(1, Math.min(Number(i.qty) || 1, 99));
      const variant = (p.variants ?? []).find((v) => v.label === i.variant) ?? null;
      const addons = (p.addons ?? []).filter((a) => (i.addons ?? []).includes(a.label));
      const unit = p.price + (variant?.price ?? 0) + addons.reduce((s, a) => s + a.price, 0);
      return { p, qty, variant, addons, unit, line_total: unit * qty };
    });
    const subtotal = lines.reduce((s, l) => s + l.line_total, 0);

    let discount = 0;
    let couponCode: string | null = null;
    if (body.coupon) {
      const { data: crow } = await sb.from("coupons").select("*").eq("code", String(body.coupon).toUpperCase()).maybeSingle();
      const cp = crow as Coupon | null;
      if (cp?.active && subtotal >= cp.min_order) {
        discount = couponDiscount(cp.type, cp.value, subtotal);
        couponCode = cp.code;
      }
    }

    const afterDiscount = subtotal - discount;
    const local = ((settings?.localPincodes as string[]) ?? []).includes(String(c.pincode));
    let delivery = local ? Number(settings?.localDeliveryCharge ?? 0) : Number(settings?.deliveryCharge ?? 99);
    if (afterDiscount >= Number(settings?.freeDeliveryAbove ?? 2499)) delivery = 0;
    const total = afterDiscount + delivery;

    const payment_method = body.payment_method === "UPI" ? "UPI" : "COD";
    if (payment_method === "COD" && settings?.codAvailable === false)
      return NextResponse.json({ ok: false, error: "COD is currently unavailable." }, { status: 400 });

    const now = new Date().toISOString();
    const orderId = crypto.randomUUID();
    const baseRow = {
      id: orderId,
      status: "pending",
      subtotal, discount, coupon: couponCode, delivery_charge: delivery, total,
      customer_name: c.name, customer_phone: String(c.phone).replace(/\D/g, "").slice(-10),
      customer_email: c.email || null, customer_address: c.address, customer_landmark: c.landmark || null,
      customer_city: c.city, customer_pincode: String(c.pincode),
      gift_note: c.giftNote || null, gift_occasion: c.giftOccasion || null,
      gift_delivery_date: c.giftDate || null, gift_sender_name: c.senderName || null,
      gift_surprise: !!c.surprise,
      payment_method,
      payment_status: payment_method === "COD" ? "pending" : "pending",
      source: "web",
      timeline: [{ at: now, status: "pending", note: payment_method === "UPI" ? "Awaiting UPI confirmation" : "Order placed" }],
    };

    // attach the signed-in account (once the accounts migration is applied)
    const sessionUser = await getCurrentUser();
    let row: Record<string, unknown> = { ...baseRow, user_id: sessionUser?.id ?? null };
    let { data: order, error } = await sb.from("orders").insert(row).select("id").single();
    if (error && /user_id/i.test(error.message)) {
      // accounts migration not applied yet — store without the link
      const { user_id, ...rest } = row;
      void user_id;
      row = rest;
      ({ data: order, error } = await sb.from("orders").insert(row).select("id").single());
    }
    if (error || !order) return NextResponse.json({ ok: false, error: error?.message || "Could not save order" }, { status: 500 });

    await sb.from("order_items").insert(
      lines.map((l) => ({
        id: crypto.randomUUID(),
        order_id: order.id, product_id: l.p.id, slug: l.p.slug, name: l.p.name, image: l.p.image,
        occasion: l.p.occasion, unit_price: l.unit, base_price: l.p.price,
        variant: l.variant?.label ?? null, addons: l.addons, qty: l.qty, line_total: l.line_total,
      }))
    );

    // customer ledger upsert + coupon usage
    const phone = String(c.phone).replace(/\D/g, "").slice(-10);
    const { data: existing } = await sb.from("customers").select("phone,email,order_count,total_spend").eq("phone", phone).maybeSingle();
    if (existing) {
      await sb.from("customers").update({
        name: c.name, email: c.email || existing.email, city: c.city, pincode: String(c.pincode),
        order_count: (existing.order_count ?? 0) + 1, total_spend: (existing.total_spend ?? 0) + total, last_order_at: now,
      }).eq("phone", phone);
    } else {
      await sb.from("customers").insert({ phone, name: c.name, email: c.email || null, city: c.city, pincode: String(c.pincode), order_count: 1, total_spend: total, first_order_at: now, last_order_at: now });
    }
    if (couponCode) {
      const { data: cc } = await sb.from("coupons").select("uses").eq("code", couponCode).maybeSingle();
      await sb.from("coupons").update({ uses: (cc?.uses ?? 0) + 1 }).eq("code", couponCode);
    }

    return NextResponse.json({ ok: true, id: order.id, total });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Unexpected error" }, { status: 500 });
  }
}
