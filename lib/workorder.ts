import type { Order, OrderItem, Settings } from "./types";
import { inr, orderCode, waLink } from "./store";

/** Composes the full "hamper work order" brief sent to the studio WhatsApp. */
export function workOrderText(o: Order, items: OrderItem[], s: Settings, previewUrl?: string): string {
  const L: string[] = [];
  L.push(`🎀 NEW HAMPER ORDER ${orderCode(o.id)}`);
  L.push(`──────────────────`);
  for (const it of items) {
    L.push(`• ${it.name} × ${it.qty}${it.variant ? ` (${it.variant})` : ""} — ${inr(it.line_total)}`);
    if (it.addons?.length) L.push(`   extras: ${it.addons.map((a) => a.label).join(", ")}`);
  }
  L.push(`──────────────────`);
  L.push(`👤 ${o.customer_name} · ${o.customer_phone}`);
  L.push(`📍 ${o.customer_address}${o.customer_landmark ? `, ${o.customer_landmark}` : ""}, ${o.customer_city} — ${o.customer_pincode}`);
  if (o.gift_occasion) L.push(`🎉 Occasion: ${o.gift_occasion}`);
  if (o.gift_delivery_date) L.push(`📅 Deliver by: ${o.gift_delivery_date}`);
  if (o.gift_note) L.push(`✍️ Tag note: “${o.gift_note}”${o.gift_sender_name ? ` — ${o.gift_sender_name}` : ""}`);
  if (o.gift_surprise) L.push(`🤫 Surprise: YES — no prices inside`);
  L.push(`💰 ${o.payment_method} · ${o.payment_status} · totals ${inr(o.subtotal)} −${inr(o.discount)}${o.coupon ? ` (${o.coupon})` : ""} +${inr(o.delivery_charge)} = ${inr(o.total)}`);
  if (previewUrl) L.push(` Preview: ${previewUrl}`);
  L.push(`— auto-sent by ${s.shopName} store`);
  return L.join("\n");
}

export function workOrderLink(o: Order, items: OrderItem[], s: Settings, previewUrl?: string): string {
  return waLink(s.whatsapp, workOrderText(o, items, s, previewUrl));
}
