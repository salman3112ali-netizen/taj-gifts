import type { Metadata } from "next";
import Link from "next/link";
import { getProducts, getSettings } from "@/lib/store";
import ProductCard from "@/components/product-card";
import { JsonLd, breadcrumbJsonLd, collectionJsonLd } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";
const title = "Gift Hampers in Kashipur, Uttarakhand | Taj Gifts";
const description = "Explore hand-tied gift hampers from Taj Gifts in Kashipur, Uttarakhand. Shop festive, birthday, wedding, baby, self-care and corporate gifting online with local delivery availability checked at checkout.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE}/gift-hampers-kashipur` },
  openGraph: { title, description, url: `${BASE}/gift-hampers-kashipur`, images: [{ url: `${BASE}/img/hero.jpg`, width: 1344, height: 768, alt: "Hand-tied Taj Gifts hampers in Kashipur" }] },
};

export default async function KashipurGiftHampersPage() {
  const [products, s] = await Promise.all([getProducts(), getSettings()]);
  return (
    <>
      <JsonLd data={collectionJsonLd(title, description, "/gift-hampers-kashipur", products)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gift hampers in Kashipur", path: "/gift-hampers-kashipur" }])} />
      <section className="pb-24">
        <div className="relative overflow-hidden bg-cream-deep/60">
          <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-blush/70 blur-3xl" />
          <div className="wrap relative grid gap-9 py-14 md:py-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <p className="eyebrow">Local gifting, made personal</p>
              <h1 className="font-display mt-4 max-w-3xl text-4xl font-medium leading-[1.04] md:text-6xl">Gift hampers in <span className="italic text-rose">Kashipur.</span></h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-soft">Taj Gifts is a small gifting studio in {s.city}, {s.state}. Choose a ready-to-order hamper for a birthday, wedding, festival, baby celebration, thank-you or team moment — then add the recipient details and a handwritten note at secure account checkout.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn-primary justify-center">Shop gift hampers</Link>
                <Link href="/contact" className="btn-ghost justify-center">Ask for a custom hamper</Link>
              </div>
            </div>
            <div className="rounded-[30px] border border-ink/10 bg-white/70 p-6 backdrop-blur">
              <p className="font-display text-2xl font-medium">Ordering in Kashipur?</p>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-ink-soft">
                <li><span className="font-medium text-ink">Local delivery:</span> enter the recipient pincode at checkout to see whether it falls in the hand-delivery zone and the final delivery charge.</li>
                <li><span className="font-medium text-ink">COD:</span> available only for eligible local hand-delivery orders when shown at checkout.</li>
                <li><span className="font-medium text-ink">Custom gifting:</span> message the studio for colour, budget, bulk or personalisation requests before ordering.</li>
              </ul>
              <a className="btn-ghost mt-5" href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent("Hi! I need a gift hamper in Kashipur.")}`} target="_blank" rel="noreferrer">WhatsApp Taj Gifts</a>
            </div>
          </div>
        </div>

        <div className="wrap pt-14 md:pt-20">
          <p className="eyebrow">Ready to gift</p>
          <h2 className="font-display mt-3 text-3xl font-medium md:text-5xl">Browse hand-tied hampers from Kashipur.</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:gap-x-8 lg:grid-cols-4">
            {products.slice(0, 8).map((p, index) => <ProductCard key={p.id} p={p} index={index} />)}
          </div>
          <div className="mt-10 text-center"><Link href="/shop" className="btn-ghost">View all gift hampers</Link></div>
        </div>

        <div className="wrap mt-16 grid gap-7 md:grid-cols-3">
          {[
            ["For occasions", "Birthday gifts, festive hampers, anniversaries, baby celebrations, weddings and thoughtful thank-yous."],
            ["For recipients", "Choose the hamper, add the address and write a private note. Prices are not included inside surprise gifts."],
            ["For businesses", "For team, client or bulk gifting, contact the studio before ordering so timeline, quantity and custom details are confirmed."],
          ].map(([heading, body]) => <div key={heading} className="rounded-[26px] border border-line bg-white/70 p-6"><h2 className="font-display text-xl font-medium">{heading}</h2><p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{body}</p></div>)}
        </div>
      </section>
    </>
  );
}
