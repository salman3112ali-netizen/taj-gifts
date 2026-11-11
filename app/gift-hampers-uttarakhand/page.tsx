import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getSettings } from "@/lib/store";
import ProductCard from "@/components/product-card";
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";
const title = "Gift Hampers from Uttarakhand | Taj Gifts";
const description = "Shop hand-tied gift hampers from Taj Gifts, a Kashipur studio in Uttarakhand. Discover festive, wedding, birthday, corporate and pahadi-inspired gifting with serviceability checked at checkout.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE}/gift-hampers-uttarakhand` },
  openGraph: { title, description, url: `${BASE}/gift-hampers-uttarakhand`, images: [{ url: `${BASE}/img/story.jpg`, width: 896, height: 1120, alt: "Taj Gifts hand-tied hamper studio in Uttarakhand" }] },
};

export default async function UttarakhandGiftHampersPage() {
  const [products, s] = await Promise.all([getProducts(), getSettings()]);
  const pahadi = products.filter((p) => /uttarakhand|pahadi|local/i.test(`${p.occasion} ${p.name} ${(p.tags ?? []).join(" ")}`));
  const featured = (pahadi.length ? pahadi : products).slice(0, 8);
  return (
    <>
      <JsonLd data={collectionJsonLd(title, description, "/gift-hampers-uttarakhand", products)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gift hampers from Uttarakhand", path: "/gift-hampers-uttarakhand" }])} />
      <section className="pb-24">
        <div className="wrap grid gap-10 py-14 md:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">From Uttarakhand, with care</p>
            <h1 className="font-display mt-4 text-4xl font-medium leading-[1.04] md:text-6xl">Gift hampers from <span className="italic text-rose">Uttarakhand.</span></h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-soft">Taj Gifts styles small-batch hampers from its Kashipur studio for moments worth remembering. Explore thoughtful combinations for festive gifting, family celebrations, weddings, colleagues and clients — with clear prices, live stock checks and an account-backed order history.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/shop" className="btn-primary justify-center">Shop gift hampers</Link><Link href="/gift-hampers-kashipur" className="btn-ghost justify-center">Gift hampers in Kashipur</Link></div>
          </div>
          <div className="overflow-hidden rounded-[34px] border border-ink/10 shadow-[0_30px_70px_-35px_rgba(62,54,44,.38)]"><img src="/img/story.jpg" alt="A Taj Gifts hamper being tied by hand in Uttarakhand" className="aspect-[4/4.2] w-full object-cover" /></div>
        </div>

        <div className="bg-ink py-14 text-cream md:py-20">
          <div className="wrap grid gap-8 md:grid-cols-3">
            <div><p className="eyebrow text-blush-deep">How delivery works</p><h2 className="font-display mt-3 text-3xl font-medium">Clear before you order.</h2></div>
            <p className="text-[14px] leading-relaxed text-cream/75">For Kashipur-area recipients, checkout identifies eligible local hand delivery by pincode. For other serviceable Indian pincodes, the final delivery charge and available payment method are shown before the order is placed.</p>
            <p className="text-[14px] leading-relaxed text-cream/75">Need a larger Uttarakhand wedding, corporate or return-gift order? Contact the studio first to agree the content, lead time and delivery plan rather than relying on a generic cart.</p>
          </div>
        </div>

        <div className="wrap pt-14 md:pt-20">
          <p className="eyebrow">Explore the collection</p>
          <h2 className="font-display mt-3 text-3xl font-medium md:text-5xl">Gifts with an Uttarakhand point of view.</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:gap-x-8 lg:grid-cols-4">{featured.map((p, index) => <ProductCard key={p.id} p={p} index={index} />)}</div>
          <div className="mt-10 rounded-[28px] bg-lav/60 p-7 md:flex md:items-center md:justify-between"><div><h2 className="font-display text-2xl font-medium">Looking for a specific budget or occasion?</h2><p className="mt-2 text-[14px] text-ink-soft">Tell Taj Gifts who the hamper is for, your budget and delivery city. The studio can advise before you place an order.</p></div><a className="btn-primary mt-5 md:mt-0" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hi! I need a gift hamper from Uttarakhand.")}`} target="_blank" rel="noreferrer">Ask the studio</a></div>
        </div>
      </section>
    </>
  );
}
