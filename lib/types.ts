export type Variant = { label: string; note?: string; price: number };
export type Addon = { label: string; price: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  occasion: string;
  price: number;
  compare_at: number | null;
  image: string;
  gallery: string[] | null;
  badge: string | null;
  featured: boolean;
  stock: number;
  rating: number;
  reviews: number;
  lead_time: string | null;
  description: string | null;
  contents: string[] | null;
  variants: Variant[] | null;
  addons: Addon[] | null;
  tags: string[] | null;
  published: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string | null;
};

export type Settings = {
  shopName: string;
  tagline: string;
  announcement: string;
  shopOpen: boolean;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  upiId: string;
  payeeName: string;
  codAvailable: boolean;
  razorpayEnabled: boolean;
  deliveryCharge: number;
  localDeliveryCharge: number;
  freeDeliveryAbove: number;
  localPincodes: string[];
  adminPasswordHash?: string;
};

export type Coupon = {
  code: string;
  type: "flat" | "percent";
  value: number;
  min_order: number;
  active: boolean;
  label: string | null;
  uses: number;
  created_at: string;
};

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  occasion: string;
  basePrice: number;
  variant: string | null;
  variantPrice: number;
  addons: { label: string; price: number }[];
  qty: number;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  slug: string;
  name: string;
  image: string | null;
  occasion: string | null;
  unit_price: number;
  base_price: number;
  variant: string | null;
  addons: { label: string; price: number }[] | null;
  qty: number;
  line_total: number;
  created_at: string;
};

export type Order = {
  id: string;
  created_at: string;
  status: string;
  subtotal: number;
  discount: number;
  coupon: string | null;
  delivery_charge: number;
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_landmark: string | null;
  customer_city: string;
  customer_pincode: string;
  gift_note: string | null;
  gift_occasion: string | null;
  gift_delivery_date: string | null;
  gift_sender_name: string | null;
  gift_surprise: boolean | null;
  payment_method: string;
  payment_status: string;
  payment_ref: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  source: string | null;
  timeline: { at: string; status: string; note?: string }[] | null;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const unitPrice = (i: CartItem) =>
  i.basePrice + (i.variantPrice || 0) + i.addons.reduce((s, a) => s + a.price, 0);

export const itemKey = (i: CartItem) =>
  [i.slug, i.variant || "", i.addons.map((a) => a.label).sort().join("+")].join("::");
