import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase";
import { getUserFromRequest } from "@/lib/supabase/server";
import { couponDiscount } from "@/lib/store";
import { workOrderText } from "@/lib/workorder";
import { notifyOwners, notifyCustomer } from "@/lib/notify";
import {
  decryptTrackingToken,
  encryptTrackingToken,
  hashTrackingToken,
  makeTrackingToken,
  trackingUrl,
} from "@/lib/fulfilment";
import { customerAppIdentity } from "@/lib/customer-app-auth";
import type { Coupon, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

// A small extra shield for malformed/bot traffic. The database function also
// enforces a stronger per-account hourly limit, which remains correct across
// serverless instances.
const hits = new Map<string, number[]>();
const REQUEST_ID = /^[A-Za-z0-9_-]{8,160}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE = /^\d{6}$/;

function clientError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function digits(value: unknown) {
  let output = String(value ?? "").replace(/\D/g, "");
  if (output.length === 11 && output.startsWith("0")) output = output.slice(1);
  if (output.length === 12 && output.startsWith("91")) output = output.slice(2);
  return output;
}

function cleanCheckoutError(message: string) {
  const safe = [
    "account is required",
    "basket",
    "checkout",
    "gift code",
    "hamper",
    "piece(s) left",
    "price",
    "style",
    "add-on",
    "order limit",
    "delivery details",
    "payment method",
    "COD",
    "currently unavailable",
  ];
  return safe.some((needle) => message.toLowerCase().includes(needle.toLowerCase()))
    ? message.replace(/^.*?:\s*/, "")
    : "We couldn’t safely place this order. Please refresh your basket and try again, or contact the studio for help.";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Never trust a browser hint that it has a customer account. A real Supabase
    // cookie session or our server-issued native-app account token is required.
    const nativeCustomer = customerAppIdentity(req);
    const sessionUser = nativeCustomer ?? await getUserFromRequest(req);
    if (!sessionUser) {
      return clientError("Please sign in or create an account before placing an order.", 401);
    }
    const accountEmail = text(sessionUser.email, 254).toLowerCase();
    if (!EMAIL.test(accountEmail)) {
      return clientError("Your account needs a verified email address before you can place an order.", 400);
    }

    const ip = (req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    const nowMs = Date.now();
    const recent = (hits.get(ip) || []).filter((at) => nowMs - at < 3600_000);
    recent.push(nowMs);
    hits.set(ip, recent);
    if (recent.length > 12) {
      return clientError("Too many checkout attempts from this connection. Please wait a little or WhatsApp us at +91 76688 19833.", 429);
    }
    // Durable limit keyed to the real account, so clearing cookies or hopping
    // serverless instances cannot reset the budget.
    try {
      const { data: accountOk } = await (await import("@/lib/supabase")).admin().rpc("taj_rate_limit", {
        p_key: `checkout:${sessionUser.id}`,
        p_max: 15,
        p_window_seconds: 3600,
      });
      if (accountOk === false) {
        return clientError("Too many checkout attempts on this account. Please wait a little or WhatsApp us at +91 76688 19833.", 429);
      }
    } catch {
      /* limiter unavailable — the in-process guard above still applies */
    }

    const items: unknown[] = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return clientError("Your basket is empty.");
    if (items.length > 25) return clientError("Please split very large baskets into separate orders or contact us for a bulk quote.");

    const customer = body.customer && typeof body.customer === "object" ? body.customer as Record<string, unknown> : {};
    const name = text(customer.name, 120);
    const phone = digits(customer.phone);
    const address = text(customer.address, 350);
    const landmark = text(customer.landmark, 160) || null;
    const city = text(customer.city, 100);
    const pincode = text(customer.pincode, 6);
    const giftNote = text(customer.giftNote, 220) || null;
    const giftOccasion = text(customer.giftOccasion, 100) || null;
    const giftDate = text(customer.giftDate, 10) || null;
    const senderName = text(customer.senderName, 120) || null;
    const surprise = customer.surprise === true;

    if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone) || address.length < 8 || city.length < 2 || !PINCODE.test(pincode)) {
      return clientError("Please enter your full name, a valid 10-digit Indian mobile number, and a complete delivery address.");
    }
    if (giftDate) {
      const parts = giftDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const parsedDate = parts ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])) : null;
      const realDate = !!parsedDate && parsedDate.getFullYear() === Number(parts?.[1]) && parsedDate.getMonth() === Number(parts?.[2]) - 1 && parsedDate.getDate() === Number(parts?.[3]);
      const todayIndia = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      todayIndia.setHours(0, 0, 0, 0);
      if (!realDate || !parsedDate || parsedDate < todayIndia) {
        return clientError("Please choose today or a future preferred delivery date.");
      }
    }

    const suppliedRequestId = text(body.client_request_id, 160);
    if (!REQUEST_ID.test(suppliedRequestId)) {
      return clientError("Your checkout session expired. Please refresh the page and try again.");
    }

    const sb = admin();
    const slugs = [...new Set(items.map((item) => {
      const raw = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return text(raw.slug, 140);
    }).filter(Boolean))];
    if (!slugs.length || slugs.length !== new Set(slugs).size) return clientError("Your basket contains an invalid hamper.");
    const [{ data: settingsRow }, { data: productRows }] = await Promise.all([
      sb.from("settings").select("data").eq("id", "shop").maybeSingle(),
      sb.from("products").select("*").in("slug", slugs),
    ]);
    const settings = (settingsRow?.data ?? {}) as Record<string, unknown>;
    if (settings.shopOpen === false) return clientError("The studio is not taking online orders right now. Please WhatsApp us for help.", 503);

    const products = new Map((productRows ?? []).map((p: Product) => [p.slug, p]));
    if (products.size !== slugs.length) return clientError("One of the hampers in your basket is no longer available. Please refresh your basket.", 409);

    const lines = items.map((item) => {
      const raw = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const slug = text(raw.slug, 140);
      const product = products.get(slug);
      if (!product) throw new Error("A hamper in your basket is no longer available.");
      if (!product.published) throw new Error(`“${product.name}” is not currently available.`);

      const qty = Number(raw.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error("Please choose a valid quantity for every hamper.");

      const requestedVariant = raw.variant == null ? null : text(raw.variant, 120) || null;
      const variant = requestedVariant ? (product.variants ?? []).find((choice) => choice.label === requestedVariant) ?? null : null;
      if (requestedVariant && !variant) throw new Error(`The selected style for “${product.name}” is no longer available.`);

      const requestedAddons = Array.isArray(raw.addons) ? raw.addons.map((value) => text(value, 120)).filter(Boolean) : [];
      if (requestedAddons.length > 20 || new Set(requestedAddons).size !== requestedAddons.length) throw new Error("One or more selected add-ons are invalid.");
      const addons = (product.addons ?? []).filter((addon) => requestedAddons.includes(addon.label));
      if (addons.length !== requestedAddons.length) throw new Error(`An add-on for “${product.name}” is no longer available.`);

      const unit = product.price + (variant?.price ?? 0) + addons.reduce((sum, addon) => sum + addon.price, 0);
      return { product, qty, variant, addons, unit, lineTotal: unit * qty };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

    let discount = 0;
    let couponCode: string | null = null;
    const suppliedCoupon = text(body.coupon, 48).toUpperCase();
    if (suppliedCoupon) {
      const { data: couponRow } = await sb.from("coupons").select("*").eq("code", suppliedCoupon).maybeSingle();
      const coupon = couponRow as Coupon | null;
      if (!coupon?.active) return clientError("That gift code is no longer active. Please remove it and try again.");
      if (subtotal < coupon.min_order) return clientError(`That gift code needs a basket of ₹${coupon.min_order.toLocaleString("en-IN")} or more.`);
      discount = couponDiscount(coupon.type, coupon.value, subtotal);
      couponCode = coupon.code;
    }

    const afterDiscount = subtotal - discount;
    const localPincodes = Array.isArray(settings.localPincodes) ? settings.localPincodes.map(String) : [];
    const local = localPincodes.includes(pincode);
    let delivery = local ? Number(settings.localDeliveryCharge ?? 0) : Number(settings.deliveryCharge ?? 99);
    if (afterDiscount >= Number(settings.freeDeliveryAbove ?? 2499)) delivery = 0;
    if (!Number.isFinite(delivery) || delivery < 0) return clientError("Delivery pricing is temporarily unavailable. Please contact the studio.", 503);
    const total = afterDiscount + delivery;

    const paymentMethod = body.payment_method === "UPI" ? "UPI" : "COD";
    if (paymentMethod === "COD" && settings.codAvailable === false) return clientError("Cash on delivery is currently unavailable.");
    // The storefront has always promised COD in the local hand-delivery zone and
    // prepaid UPI elsewhere. Enforce that promise server-side, not just in copy.
    if (paymentMethod === "COD" && !local) return clientError("Cash on delivery is available in our local delivery zone. Please choose UPI for this pincode.");

    const trackingToken = makeTrackingToken();
    const createdAt = new Date().toISOString();
    const candidateOrderId = crypto.randomUUID();
    const orderPayload = {
      id: candidateOrderId,
      subtotal,
      discount,
      coupon: couponCode,
      delivery_charge: delivery,
      total,
      customer_name: name,
      customer_phone: phone,
      // Account email wins over form input: a receipt/order cannot be silently
      // associated with an address someone typed into a guest-like form.
      customer_email: accountEmail,
      customer_address: address,
      customer_landmark: landmark,
      customer_city: city,
      customer_pincode: pincode,
      gift_note: giftNote,
      gift_occasion: giftOccasion,
      gift_delivery_date: giftDate,
      gift_sender_name: senderName,
      gift_surprise: surprise,
      payment_method: paymentMethod,
      source: body.source === "android" ? "android" : "web",
      tracking_token_hash: hashTrackingToken(trackingToken),
      tracking_token_ciphertext: encryptTrackingToken(trackingToken),
      client_request_id: suppliedRequestId,
      created_at: createdAt,
    };
    const orderItems = lines.map((line) => ({
      product_id: line.product.id,
      base_price: line.product.price,
      unit_price: line.unit,
      variant: line.variant?.label ?? null,
      addons: line.addons.map((addon) => ({ label: addon.label, price: addon.price })),
      qty: line.qty,
      line_total: line.lineTotal,
    }));

    const { data: created, error: createError } = await sb.rpc("taj_create_account_order", {
      p_user_id: sessionUser.id,
      p_order: orderPayload,
      p_items: orderItems,
    });
    if (createError || !created?.[0]?.order_id) {
      return clientError(cleanCheckoutError(createError?.message || "Checkout could not be completed."), 409);
    }

    const createdOrder = created[0] as { order_id: string; order_total: number; is_duplicate: boolean };
    let responseTrackingToken = trackingToken;
    if (createdOrder.is_duplicate) {
      // A lost response can be safely retried. Return the original private link
      // only after scoping the lookup to the authenticated account that owns it.
      const { data: existing } = await sb
        .from("orders")
        .select("tracking_token_ciphertext")
        .eq("id", createdOrder.order_id)
        .eq("user_id", sessionUser.id)
        .maybeSingle();
      responseTrackingToken = decryptTrackingToken(existing?.tracking_token_ciphertext) || trackingToken;
      return NextResponse.json({
        ok: true,
        id: createdOrder.order_id,
        total: createdOrder.order_total,
        trackingToken: responseTrackingToken,
        duplicate: true,
      });
    }

    const customerTrackUrl = trackingUrl(createdOrder.order_id, responseTrackingToken);
    const briefItems = lines.map((line) => ({
      id: "",
      order_id: createdOrder.order_id,
      product_id: line.product.id,
      slug: line.product.slug,
      name: line.product.name,
      image: line.product.image,
      occasion: line.product.occasion,
      unit_price: line.unit,
      base_price: line.product.price,
      variant: line.variant?.label ?? null,
      addons: line.addons,
      qty: line.qty,
      line_total: line.lineTotal,
      created_at: createdAt,
    }));
    const orderForNotification = {
      ...orderPayload,
      id: createdOrder.order_id,
      user_id: sessionUser.id,
      status: "pending",
      payment_status: "pending",
      timeline: [{ at: createdAt, status: "pending", note: paymentMethod === "UPI" ? "Awaiting UPI payment confirmation" : "Order placed" }],
    };
    // Notifications are deliberately non-blocking. The committed order is the
    // source of truth; a mail/WhatsApp provider outage must never lose a sale or
    // make customers submit the same order again. Only real order data is sent:
    // no synthetic customer-facing product imagery is generated or shared.
    notifyOwners({
      order: orderForNotification as never,
      brief: workOrderText(orderForNotification as never, briefItems as never, settings as never),
      items: briefItems.map((item) => ({ name: item.name, qty: item.qty, variant: item.variant, addons: item.addons.map((addon) => addon.label), line_total: item.line_total })),
    }).catch(() => {});
    notifyCustomer(orderForNotification as never, "placed", { trackingUrl: customerTrackUrl }).catch(() => {});

    const upiId = String(settings.upiId || "tajgifts@upi");
    const upiLink =
      `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(String(settings.payeeName || "Taj Gifts"))}` +
      `&am=${createdOrder.order_total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Taj ${createdOrder.order_id.slice(0, 8)}`)}`;

    return NextResponse.json({
      ok: true,
      id: createdOrder.order_id,
      total: createdOrder.order_total,
      upiLink,
      trackingToken: responseTrackingToken,
      trackingUrl: customerTrackUrl,
    });
  } catch (error) {
    return clientError(error instanceof Error ? cleanCheckoutError(error.message) : "Unexpected checkout error.", 500);
  }
}
