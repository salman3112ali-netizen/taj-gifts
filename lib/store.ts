import type { Coupon, Product, Settings } from "./types";
import { admin } from "./supabase";

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Taj Gifts",
  tagline: "Hand-tied hampers, made at home in Kashipur",
  announcement: "Handmade in Kashipur · Free delivery above ₹2,499",
  shopOpen: true,
  email: "tajgifts.orders@gmail.com",
  phone: "+91 76688 19833",
  whatsapp: "917668819833",
  address: "Pakiza Colony, Kashipur, Uttarakhand 244713, India",
  city: "Kashipur",
  state: "Uttarakhand",
  pincode: "244713",
  upiId: "tajgifts@upi",
  payeeName: "Taj Gifts",
  codAvailable: true,
  razorpayEnabled: false,
  deliveryCharge: 99,
  localDeliveryCharge: 0,
  freeDeliveryAbove: 2499,
  localPincodes: ["244713", "244715", "244001", "263139", "263153"],
};

export async function getSettings(): Promise<Settings> {
  const { data } = await admin()
    .from("settings")
    .select("data")
    .eq("id", "shop")
    .maybeSingle();
  const raw = (data?.data ?? {}) as Partial<Settings>;
  const merged = { ...DEFAULT_SETTINGS, ...raw } as Settings;
  // This function returns storefront-safe settings, and its result is serialised
  // into every page (CartProvider) and into /api/products. Strip every secret
  // column explicitly: an admin password hash, the integration-key vault (SMTP
  // password, Telegram/Meta tokens, webhook URLs, Razorpay secret) and owner
  // broadcast drafts must never reach a browser payload.
  const secretKeys = ["adminPasswordHash", "apis", "appAnnouncements"] as const;
  for (const key of secretKeys) delete (merged as Record<string, unknown>)[key];
  return merged;
}

export async function getProducts(includeUnpublished = false): Promise<Product[]> {
  let q = admin().from("products").select("*");
  if (!includeUnpublished) q = q.eq("published", true);
  const { data } = await q.order("sort_order", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });
  return (data ?? []) as Product[];
}

export async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await admin().from("products").select("*").eq("slug", slug).maybeSingle();
  return (data as Product) ?? null;
}

/** Storefront promo copy must come from the live coupon record, never a stale hard-coded offer. */
export async function getActiveCoupons(): Promise<Coupon[]> {
  const { data } = await admin().from("coupons").select("*").eq("active", true).order("created_at", { ascending: true });
  return (data ?? []) as Coupon[];
}

// Display helpers live in lib/format.ts so client components never import this
// server-only module. Re-exported here for existing server-side callers.
export { inr, orderCode, dateFmt, dateTimeFmt, waLink } from "./format";

export function deliveryFor(settings: Settings, pincode: string, subtotalAfterDiscount: number) {
  const local = settings.localPincodes.includes(pincode);
  let charge = local ? settings.localDeliveryCharge : settings.deliveryCharge;
  if (subtotalAfterDiscount >= settings.freeDeliveryAbove) charge = 0;
  return { local, charge };
}

export function couponDiscount(type: "flat" | "percent", value: number, subtotal: number) {
  const d = type === "flat" ? value : Math.round((subtotal * value) / 100);
  return Math.min(d, subtotal);
}

