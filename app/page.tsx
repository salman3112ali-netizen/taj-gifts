import Link from "next/link";
import type { Metadata } from "next";
import { getProducts, getSettings, inr } from "@/lib/store";
import { Marquee, SpinBadge } from "@/components/marquee";
import { Reveal, Words } from "@/components/reveal";
import ProductCard from "@/components/product-card";
import { Accordion } from "@/components/accordion";
import { FAQS } from "@/lib/faq";
import { JsonLd, siteJsonLd, faqJsonLd } from "@/lib/seo";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const metadata: Metadata = {
  title: "Taj Gifts — Hand-tied Gift Hampers in Kashipur, Uttarakhand",
  description:
    "Explore hand-tied gift hampers from Kashipur, Uttarakhand for festivals, weddings, birthdays, baby celebrations, self-care and corporate gifting. Delivery availability and payment options are confirmed at checkout.",
  alternates: { canonical: BASE + "/" },
};

export default async function Home() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const occasions = [...new Set(products.map((p) => p.occasion))];

  return (
    <>
      <JsonLd data={siteJsonLd(settings)} />
      <JsonLd data={faqJsonLd(FAQS)} />
      {/* ───────────────── HERO ───────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-blush/70 blur-[110px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-lav/80 blur-[110px]" />
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-[260px] w-[260px] rounded-full bg-mint/60 blur-[90px]" />

        <div className="wrap grid items-center gap-10 pb-12 pt-8 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div className="relative z-10">
            <Reveal>
              <p className="eyebrow">
                <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-rose" />
                {settings.city}, {settings.state} · home-made studio
              </p>
            </Reveal>
            <h1 className="font-display mt-6 text-[13.5vw] font-medium leading-[0.98] tracking-[-0.02em] sm:text-[64px] lg:text-[76px]">
              <Words text="Gifting, wrapped" />
              <br />
              <span className="italic text-rose"><Words text="in softness" delay={0.25} /></span>
              <span className="text-rose">.</span>
            </h1>
            <Reveal delay={0.45}>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-soft">
                Hand-tied gift hampers made at our home in {settings.city} — mithai & diya boxes for Diwali, organza wedding trays, pahadi harvest baskets and desk edits for teams. Every ribbon tied by hand.
              </p>
            </Reveal>
            <Reveal delay={0.6}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link href="/shop" className="btn-primary w-full justify-center sm:w-auto">Shop the hampers</Link>
                <Link href="/contact" className="btn-ghost w-full justify-center sm:w-auto">Build a custom hamper</Link>
              </div>
            </Reveal>
            <Reveal delay={0.75}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] font-medium text-ink-soft">
                <span>Hand-tied in {settings.city}</span>
                <span className="h-4 w-px bg-ink/20" />
                <span>Private account checkout</span>
                <span className="h-4 w-px bg-ink/20" />
                <span>Local delivery availability checked by pincode</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.25} y={50} className="relative">
            <div className="relative mx-auto max-w-[520px]">
              <div className="overflow-hidden rounded-t-[260px] rounded-b-[36px] border border-ink/10 shadow-[0_40px_90px_-40px_rgba(62,54,44,0.45)]">
                <img src="/img/hero.jpg" alt="Pastel gift hampers hand-tied in Kashipur" className="aspect-[4/4.4] w-full object-cover" />
              </div>
              <div className="absolute left-2 top-6 animate-float rounded-2xl border border-ink/10 bg-cream/90 px-4 py-3 shadow-lg backdrop-blur sm:-left-6 sm:top-10">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rose">Free delivery</p>
                <p className="font-display text-lg font-medium">above {inr(settings.freeDeliveryAbove)}</p>
              </div>
              <div className="absolute -right-1 bottom-16 animate-float-slow rounded-2xl border border-ink/10 bg-cream/90 px-4 py-3 shadow-lg backdrop-blur sm:-right-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mint-deep">COD & UPI</p>
                <p className="font-display text-lg font-medium">pay your way</p>
              </div>
              <SpinBadge className="absolute -bottom-8 -left-8 hidden md:block" />
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee items={["hand-tied in kashipur", `free delivery above ${inr(settings.freeDeliveryAbove)}`, "local delivery checked by pincode", "custom hampers on whatsapp", "small-batch gifting", "account-secure checkout"]} />

      {/* ───────────────── OCCASIONS ───────────────── */}
      <section className="wrap py-14 md:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Pick a moment</p>
            <h2 className="font-display mt-3 max-w-xl text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">
              Every occasion deserves <span className="italic text-rose">its own ribbon.</span>
            </h2>
          </div>
          <Link href="/shop" className="btn-ghost">Browse everything</Link>
        </Reveal>
        <div className="hide-scroll -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
          {occasions.map((o, i) => {
            const p = products.find((x) => x.occasion === o)!;
            const pastel = ["bg-blush", "bg-lav", "bg-mint", "bg-butter", "bg-peach"][i % 5];
            return (
              <Reveal key={o} delay={i * 0.06} className="shrink-0 snap-start">
                <Link href={`/shop?occasion=${encodeURIComponent(o)}`} className={`group block w-[210px] rounded-[26px] ${pastel} p-4 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-24px_rgba(62,54,44,0.4)]`} data-cursor>
                  <div className="overflow-hidden rounded-[18px]">
                    <img src={p.image} alt={o} className="aspect-square w-full object-cover transition-transform duration-[1.2s] group-hover:scale-108" loading="lazy" />
                  </div>
                  <p className="mt-3 px-1 font-display text-xl font-medium">{o}</p>
                  <p className="px-1 text-[12px] font-medium uppercase tracking-[0.16em] text-ink/55">
                    {products.filter((x) => x.occasion === o).length} hamper{products.filter((x) => x.occasion === o).length > 1 ? "s" : ""}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ───────────────── FEATURED ───────────────── */}
      <section className="bg-cream-deep/60 py-14 md:py-24">
        <div className="wrap">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
            <p className="eyebrow">Featured collection</p>
            <h2 className="font-display mt-3 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">A thoughtful hamper for the occasion.</h2>
            </div>
            <p className="max-w-xs font-script text-2xl leading-snug text-ink-soft">each hamper leaves our table with a handwritten tag — tell us what it should say</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.08}>
                <ProductCard p={p} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── STORY ───────────────── */}
      <section className="wrap grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
        <Reveal className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-[36px] border border-ink/10 shadow-[0_36px_80px_-40px_rgba(62,54,44,0.4)]">
            <img src="/img/story.jpg" alt="Tying a hamper by hand at home in Kashipur" className="aspect-[4/4.6] w-full object-cover" loading="lazy" />
          </div>
          <div className="absolute -right-5 -top-6 rotate-6 rounded-2xl bg-butter px-5 py-3 shadow-lg">
            <p className="font-script text-2xl text-ink">styled with care</p>
          </div>
        </Reveal>
        <div className="order-1 lg:order-2">
          <Reveal><p className="eyebrow">Our story</p></Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display mt-4 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-[52px]">
              A home studio in the <span className="italic text-rose">foothills of Uttarakhand.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
              {settings.shopName} is a small gifting studio in {settings.city}, where available hampers are styled and ribbon-tied with the recipient and occasion in mind. Explore each product’s listed contents, variants and add-ons before placing an order.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                { t: "Clear choices", d: "Contents and options are listed on each hamper", bg: "bg-mint" },
                { t: "Tied by hand", d: "A small studio approach to every available hamper", bg: "bg-blush" },
                { t: "Tracked orders", d: "Account orders stay visible after checkout", bg: "bg-lav" },
              ].map((v) => (
                <div key={v.t} className={`rounded-3xl ${v.bg} p-5`}>
                  <p className="font-display text-lg font-medium">{v.t}</p>
                  <p className="mt-1 text-[13px] leading-snug text-ink/70">{v.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.4}><Link href="/about" className="btn-ghost mt-9">Read the full story</Link></Reveal>
        </div>
      </section>

      {/* ───────────────── PROCESS ───────────────── */}
      <section className="bg-ink py-14 text-cream md:py-24">
        <div className="wrap">
          <Reveal className="text-center">
            <p className="eyebrow text-blush-deep">How gifting works here</p>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">Four steps between your thought and their doorstep.</h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Pick or design", d: "Choose a hamper, or WhatsApp us a budget & occasion and we'll sketch one for you." },
              { n: "02", t: "We tie it by hand", d: "Sourced, styled and ribbon-tied at our home studio — with your note, in your words." },
              { n: "03", t: "Choose your payment", d: "Eligible local orders can use COD; UPI is available at checkout. A secure gateway appears when configured." },
              { n: "04", t: "The delivery", d: "We confirm the delivery plan from the recipient pincode and keep account orders visible in private tracking." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="group h-full rounded-[28px] border border-cream/15 bg-cream/5 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-blush-deep/60 hover:bg-cream/10">
                  <p className="font-display text-5xl font-medium text-stroke transition-colors duration-500 group-hover:text-blush-deep group-hover:[-webkit-text-stroke:0px]">{s.n}</p>
                  <p className="mt-5 font-display text-xl font-medium">{s.t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-cream/65">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── ORDER CONFIDENCE ───────────────── */}
      <section className="wrap py-14 md:py-24">
        <Reveal className="text-center">
          <p className="eyebrow justify-center">Thoughtful, and accountable</p>
          <h2 className="font-display mt-4 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">A real order, not a hopeful DM.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">Every online order is saved to the customer account that placed it. Stock, price, delivery zone and payment status are checked before the studio starts work.</p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { t: "Private order history", d: "Sign in to see the orders placed from your account and return to private tracking whenever you need it.", bg: "bg-blush" },
            { t: "Live checkout checks", d: "The final checkout validates the current product, selected options, stock, coupon and delivery price on the server.", bg: "bg-mint" },
            { t: "Human help for custom work", d: "For bulk, wedding or fully personalised gifting, speak to the studio first so scope and timing are confirmed clearly.", bg: "bg-lav" },
          ].map((item, i) => (
            <Reveal key={item.t} delay={i * 0.1}>
              <div className={`h-full rounded-[28px] ${item.bg} p-8`}>
                <p className="font-display text-[21px] font-medium leading-snug">{item.t}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-ink/75">{item.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── CORPORATE BAND ───────────────── */}
      <section className="wrap pb-16 md:pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[40px] bg-lav px-6 py-10 md:px-16 md:py-16">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
            <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="eyebrow">For teams & bulk gifting</p>
                <h2 className="font-display mt-4 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">
                  From a thoughtful team thank-you to a coordinated bulk order — <span className="italic text-rose-deep">one calm point of contact.</span>
                </h2>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink/70">
                  Ask us about names on tags, brand cards, delivery planning and any documentation your organisation needs before we confirm the order. Use code <b>BULK25</b> for 8% off eligible orders above ₹20,000.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Link href="/shop?occasion=Corporate" className="btn-primary w-full justify-center sm:w-auto">See corporate hampers</Link>
                  <a href={`https://wa.me/${settings.whatsapp}?text=Hi! I'd like a quote for bulk gifting.`} target="_blank" rel="noreferrer" className="btn-ghost w-full justify-center sm:w-auto">Get a bulk quote</a>
                </div>
              </div>
              <div className="relative hidden md:block">
                <img src="/img/corporate.jpg" alt="Corporate desk hamper" className="ml-auto aspect-[4/4.2] w-[85%] rounded-[28px] object-cover shadow-[0_30px_70px_-30px_rgba(62,54,44,0.5)]" loading="lazy" />
                <div className="absolute -left-2 bottom-8 -rotate-3 rounded-2xl bg-cream px-5 py-3 shadow-lg">
                  <p className="font-script text-2xl text-ink">planned with care</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────────────── FAQ ───────────────── */}
      <section className="wrap pb-16 md:pb-24" id="faq">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Reveal>
            <p className="eyebrow">Good to know</p>
            <h2 className="font-display mt-4 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">Questions, answered softly.</h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              Need a custom hamper, a bulk quote or help before checkout? WhatsApp us on {settings.phone}; the studio will reply as soon as it can.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <Accordion items={FAQS} />
          </Reveal>
        </div>
      </section>
    </>
  );
}

