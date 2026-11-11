/**
 * Pure display helpers.
 *
 * These are imported by client components (product cards, checkout, admin), so
 * this module must never import the Supabase service-role client. Keeping the
 * formatters here means a browser bundle cannot accidentally pull in the
 * server-only store module.
 */

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const orderCode = (id: string) => "TG-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();

export const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const dateTimeFmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function waLink(whatsapp: string, text: string) {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}
