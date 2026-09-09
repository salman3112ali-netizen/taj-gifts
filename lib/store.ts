import type { Product, Settings } from "./types";
import { admin } from "./supabase";

export const DEFAULT_SETTINGS: Settings = {
  shopName: "Taj Gifts",
  tagline: "Hand-tied hampers, made at home in Kashipur",
  announcement: "Handmade in Kashipur · Free delivery above ₹2,499",
  shopOpen: true,
  email: "hello@tajgifts.in",
  phone: "+91 98765 43210",
  whatsapp: "919876543210",
  address: "Near Gandhi Ashram Market, Kashipur, Udham Singh Nagar",
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
  return { ...DEFAULT_SETTINGS, ...raw } as Settings;
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

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export const orderCode = (id: string) => "TG-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();

export const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const dateTimeFmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

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

export function waLink(whatsapp: string, text: string) {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}
