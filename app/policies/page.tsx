import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const metadata: Metadata = {
  title: "Delivery, Returns, Privacy & Terms | Taj Gifts",
  description: "Read Taj Gifts' delivery, payment, returns, privacy and terms of sale information before ordering a hand-tied gift hamper from Kashipur, Uttarakhand.",
  alternates: { canonical: `${BASE}/policies` },
};

const updated = "9 September 2026";

export default async function PoliciesPage() {
  const s = await getSettings();
  return (
    <section className="wrap max-w-4xl pb-24 pt-12">
      <p className="eyebrow">Clear before checkout</p>
      <h1 className="font-display mt-3 text-4xl font-medium leading-[1.05] md:text-6xl">Delivery, returns, privacy & terms.</h1>
      <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-ink-soft">
        These policies explain how {s.shopName} handles made-to-order gift hampers, account data and payments. Please read them before placing an order. Last updated {updated}.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2" aria-label="Policy sections">
        {[
          ["shipping", "Shipping & delivery"],
          ["payments", "Payments"],
          ["returns", "Returns & refunds"],
          ["privacy", "Privacy"],
          ["terms", "Terms of sale"],
        ].map(([id, label]) => <a key={id} href={`#${id}`} className="chip">{label}</a>)}
      </nav>

      <div className="mt-12 space-y-7">
        <Policy id="shipping" title="Shipping & delivery">
          <p>Checkout checks the delivery pincode before showing the available delivery charge. Local hand-delivery is offered only for the pincode zone shown at checkout. Other serviceable Indian pincodes are sent by courier where available.</p>
          <p>A preferred delivery date is a request, not a guarantee. Dispatch and arrival can be affected by receiver availability, courier coverage, weather, festivals and product-specific lead time. Please enter a reachable receiver phone number and complete address; we may contact you if clarification is needed.</p>
          <p>For bespoke, wedding or corporate orders, delivery dates, quantities and packaging are confirmed separately in writing before production starts.</p>
        </Policy>

        <Policy id="payments" title="Payments & account-required checkout">
          <p>A Taj Gifts customer account is required to place an order. It protects your delivery details and gives you a private order history and tracking access.</p>
          <p>Cash on delivery is available only for eligible local hand-delivery orders when it is displayed at checkout. UPI orders remain pending until payment is verified. If a secure payment gateway is offered on your order page, its verification is automatic; otherwise a direct UPI payment is checked by the studio before fulfilment.</p>
          <p>Never send money to a UPI ID or payment link received from an unverified third party. If anything looks different from the payment details on your Taj Gifts order page, pause and contact us before paying.</p>
        </Policy>

        <Policy id="returns" title="Returns, replacements & refunds">
          <p>Many Taj Gifts hampers are assembled or personalised to order, and edible or perishable components cannot ordinarily be returned once dispatched. This does not affect your right to report an item that arrives damaged, materially different from the confirmed order, or incomplete.</p>
          <p>Please contact us within 24 hours of delivery with your order code, clear photos of the outer package and affected item, and a short description of the issue. We review the evidence and, where a genuine fulfilment or transit issue is verified, arrange an appropriate replacement, store credit or refund for the affected item.</p>
          <p>Cancellation requests should be sent as early as possible. Once personalised work, food preparation or courier dispatch has begun, a cancellation may no longer be possible. Refund timing, when approved, depends on the original payment method and banking network.</p>
        </Policy>

        <Policy id="privacy" title="Privacy policy">
          <p>We collect the details needed to operate your account and fulfil an order: name, email address, phone number, delivery address, order contents, gift note, payment status and messages you send us. We use this information to process orders, provide support, prevent fraud and meet legal or accounting obligations.</p>
          <p>Payment card and gateway credentials are handled by the payment provider, not stored in your Taj Gifts customer account. We do not sell customer data. We share only the minimum necessary details with delivery, payment and communication providers involved in fulfilling your order.</p>
          <p>Marketing emails are optional. You may ask us to update or delete account information that we are not required to retain by law by contacting <a className="underline hover:text-rose" href={`mailto:${s.email}`}>{s.email}</a>. Order records may be retained where necessary for customer service, accounting, fraud prevention or legal compliance.</p>
        </Policy>

        <Policy id="terms" title="Terms of sale">
          <p>Prices, stock and delivery charges shown in the basket are estimates until checkout validates the live catalogue. An order is accepted when Taj Gifts creates an order record and sends its confirmation; stock may change before that point.</p>
          <p>You are responsible for providing accurate recipient and delivery details and for ensuring that your gift note, customisation request and chosen products are lawful and appropriate. We may contact you to clarify a request or cancel and refund an order that cannot be fulfilled safely or reasonably.</p>
          <p>These terms are governed by applicable law in India. For any concern, please contact the studio first at <a className="underline hover:text-rose" href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>, WhatsApp, or <a className="underline hover:text-rose" href={`mailto:${s.email}`}>{s.email}</a>. You can also read our <Link className="underline hover:text-rose" href="/contact">contact and custom-hamper information</Link>.</p>
        </Policy>
      </div>
    </section>
  );
}

function Policy({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <article id={id} className="scroll-mt-28 rounded-[28px] border border-line bg-white/70 p-6 md:p-8">
      <h2 className="font-display text-2xl font-medium md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-ink-soft md:text-[15px]">{children}</div>
    </article>
  );
}
