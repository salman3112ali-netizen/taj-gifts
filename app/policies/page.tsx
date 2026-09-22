import type { Metadata } from "next";
import { getSettings, inr } from "@/lib/store";

export const metadata: Metadata = {
  title: "Shipping, returns, privacy & terms — Taj Gifts",
  description: "Clear shipping timelines, OTP-verified handover, 7-day replacement, privacy and terms for Taj Gifts, Kashipur (Uttarakhand).",
};

export const dynamic = "force-dynamic";

const S = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <section id={id} className="mt-12 scroll-mt-28">
    <h2 className="font-display text-3xl font-semibold">{title}</h2>
    <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ink-soft">{children}</div>
  </section>
);

export default async function PoliciesPage() {
  const s = await getSettings();
  return (
    <section className="wrap max-w-[820px] pb-24 pt-14">
      <p className="eyebrow">the fine print, in plain words</p>
      <h1 className="font-display mt-3 text-5xl font-medium leading-tight">
        Policies & <span className="italic text-rose">promises.</span>
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
        Everything below is exactly how we run {s.shopName} — no hidden clauses. Questions anytime on WhatsApp {s.phone}.
      </p>

      <S id="seller" title="Who you are buying from">
        <p>
          <b className="text-ink">{s.shopName}</b> — a registered home-based gifting studio at {s.address}, {s.city}, {s.state} {s.pincode}, India.
          Contact: {s.phone} · {s.email}. Every hamper is tied by hand in our own studio; we never drop-ship.
        </p>
      </S>

      <S id="shipping" title="Shipping & delivery">
        <p>
          <b className="text-ink">Local zone ({s.localPincodes.join(", ")}):</b> same-day or next-day delivery on our own bike, {s.localDeliveryCharge === 0 ? "free" : inr(s.localDeliveryCharge)}.
          Other serviceable pincodes: dispatched within 1–2 working days via insured courier, {s.deliveryCharge === 0 ? "free" : inr(s.deliveryCharge)}; free everywhere above {inr(s.freeDeliveryAbove)}.
        </p>
        <p>
          <b className="text-ink">OTP-verified handover:</b> when your order goes out for delivery we send you a 4-digit OTP on this page (and by email).
          The delivery partner (often us personally) completes the delivery only after you share that code at the door — proof it reached the right hands.
        </p>
        <p>Gift-date orders are delivered on the chosen date; surprise orders never reveal contents or price to the receiver.</p>
      </S>

      <S id="returns" title="Returns, replacements & refunds">
        <p>
          Hand-tied hampers are made to order, so we can't resell returned boxes — instead we promise a <b className="text-ink">7-day replacement</b>:
          if anything arrives damaged, missing or spoiled, send one photo on WhatsApp within 7 days and we replace the item or the whole hamper, free. No arguments, no courier runs for you.
        </p>
        <p>
          Refunds (when a replacement isn't possible) go back to the original payment method within 5–7 working days of confirmation.
          COD refunds go to your UPI/bank detail collected at the time of the complaint.
        </p>
      </S>

      <S id="privacy" title="Privacy — what we store and never sell">
        <p>We store only what an order needs: name, phone, address, email (optional), order contents and payment status. It lives in our secured Supabase database over HTTPS and is used solely to tie, deliver and support your order.</p>
        <p>We never sell or rent customer data. Payment credentials never touch our servers — UPI runs inside your own banking app, and card/netbanking (when enabled) runs inside Razorpay's RBI-compliant checkout.</p>
        <p>Want your data deleted? WhatsApp us from your registered number and it's gone within 30 days.</p>
      </S>

      <S id="terms" title="Terms of sale">
        <p>Prices are in ₹ and include packing; taxes as applicable to a registered home business are included in the price shown. Stock shown at checkout is live — an item that runs out between cart and order is refunded or substituted only with your written (WhatsApp) consent.</p>
        <p>Coupons apply as labelled and can be withdrawn anytime for future orders. Abuse of coupons/OTP (fraudulent orders) leads to cancellation without notice.</p>
        <p>By ordering you accept these terms and the shipping & return promises above.</p>
      </S>

      <p className="mt-14 rounded-2xl bg-cream-deep/70 p-5 text-[13px] text-ink-soft">
        Last updated 20 Sep 2026 · {s.shopName}, {s.city} · {s.phone} · {s.email}
      </p>
    </section>
  );
}
