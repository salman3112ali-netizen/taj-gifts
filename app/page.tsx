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
  title: "Taj Gifts — Hand-tied Gift Hampers in Kashipur, Uttarakhand | Free Local Delivery",
  description:
    "Buy hand-tied gift hampers online from Kashipur, Uttarakhand — Diwali & festive boxes, wedding return-gift trays, baby, anniversary, self-care and pahadi-special hampers. Same-day local delivery, COD & UPI, custom hampers on WhatsApp +91 76688 19833.",
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
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] font-semibold text-ink-soft">
                <span className="flex items-center gap-2">
                  <span className="font-display text-xl font-semibold text-ink">12,000+</span> hampers tied
                </span>
                <span className="h-4 w-px bg-ink/20" />
                <span className="flex items-center gap-1.5">
                  <Stars />
                  <span className="font-display text-xl font-semibold text-ink">4.9</span> from 900+ gifts-givers
                </span>
                <span className="h-4 w-px bg-ink/20" />
                <span>Same-day dispatch in {settings.city}</span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.25} y={50} className="relative">
            <div className="relative mx-auto max-w-[520px]">
              <div className="overflow-hidden rounded-t-[260px] rounded-b-[36px] border border-ink/10 shadow-[0_40px_90px_-40px_rgba(62,54,44,0.45)]">
                <img src="/img/hero.jpg" alt="Pastel gift hampers hand-tied in Kashipur" className="aspect-[4/4.4] w-full object-cover" />
              </div>
              <div className="absolute left-2 top-6 animate-float rounded-2xl border border-ink/10 bg-cream/90 px-4 py-3 shadow-lg backdrop-blur sm:-left-6 sm:top-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose">Free delivery</p>
                <p className="font-display text-lg font-semibold">above {inr(settings.freeDeliveryAbove)}</p>
              </div>
              <div className="absolute -right-1 bottom-16 animate-float-slow rounded-2xl border border-ink/10 bg-cream/90 px-4 py-3 shadow-lg backdrop-blur sm:-right-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-mint-deep">COD & UPI</p>
                <p className="font-display text-lg font-semibold">pay your way</p>
              </div>
              <SpinBadge className="absolute -bottom-8 -left-8 hidden md:block" />
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee items={["hand-tied in kashipur", "free delivery above ₹2,499", "same-day dispatch before 2 pm", "custom hampers on whatsapp", "pahadi-made · small batch", "cod & upi accepted"]} />

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
                  <p className="mt-3 px-1 font-display text-xl font-semibold">{o}</p>
                  <p className="px-1 text-[12px] font-bold uppercase tracking-[0.16em] text-ink/55">
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
              <p className="eyebrow">Loved & re-gifted</p>
              <h2 className="font-display mt-3 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">This season's most-wrapped.</h2>
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
            <p className="font-script text-2xl text-ink">est. at our kitchen table</p>
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
              {settings.shopName} began the way most good things do — at home, with one Diwali box too many. What started as festive trays for neighbours in {settings.city} is now a small studio where hampers are sourced, styled and tied by hand: pahadi honey and jams from village co-operatives, mithai from trusted local halwais, candles poured in small batches.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                { t: "Sourced local", d: "Pahadi makers, halwais & co-ops first", bg: "bg-mint" },
                { t: "Tied by hand", d: "No factory lines, only our table", bg: "bg-blush" },
                { t: "Sent with care", d: "Double-boxed, note included", bg: "bg-lav" },
              ].map((v) => (
                <div key={v.t} className={`rounded-3xl ${v.bg} p-5`}>
                  <p className="font-display text-lg font-semibold">{v.t}</p>
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
              { n: "03", t: "Pay your way", d: "COD across our delivery zone, UPI anywhere. GST invoices for corporate orders." },
              { n: "04", t: "The unboxing", d: "Double-boxed, petal-packed, delivered same-day in Kashipur & tracked everywhere else." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="group h-full rounded-[28px] border border-cream/15 bg-cream/5 p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-blush-deep/60 hover:bg-cream/10">
                  <p className="font-display text-5xl font-semibold text-stroke transition-colors duration-500 group-hover:text-blush-deep group-hover:[-webkit-text-stroke:0px]">{s.n}</p>
                  <p className="mt-5 font-display text-xl font-semibold">{s.t}</p>
                  <p className="mt-2 text-sm leading-relaxed text-cream/65">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── TESTIMONIALS ───────────────── */}
      <section className="wrap py-14 md:py-24">
        <Reveal className="text-center">
          <p className="eyebrow justify-center">Gift-givers, unfiltered</p>
          <h2 className="font-display mt-4 text-[30px] font-medium leading-[1.1] sm:text-4xl md:text-5xl">Notes left on our table.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { q: "Ordered 40 wedding return-trays at 11pm in a panic. Delivered in six days, each one photographed by our guests before the thaali even came. Unreal care.", n: "Meera & Aditya", c: "Haldwani · wedding order", bg: "bg-blush" },
            { q: "We send The Desk Edit to our whole team every Diwali. GST invoice, names on tags, zero follow-ups needed. Our go-to for three years running.", n: "Rohit Bhandari", c: "People-ops, Noida · corporate", bg: "bg-mint" },
            { q: "Amma got the Pahadi Virasat box and called me crying happy — the honey jar reminded her of her maika village. That's not gifting, that's time travel.", n: "Naina Rawat", c: "Dehradun · family", bg: "bg-lav" },
          ].map((t, i) => (
            <Reveal key={t.n} delay={i * 0.1}>
              <figure className={`flex h-full flex-col justify-between rounded-[28px] ${t.bg} p-8`}>
                <div>
                  <div className="flex gap-1 text-rose"><Stars /></div>
                  <blockquote className="mt-4 font-display text-[19px] leading-snug">“{t.q}”</blockquote>
                </div>
                <figcaption className="mt-6">
                  <p className="font-bold">{t.n}</p>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink/55">{t.c}</p>
                </figcaption>
              </figure>
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
                  25 or 2,500 hampers — <span className="italic text-rose-deep">one very calm point of contact.</span>
                </h2>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink/70">
                  Name-calligraphy tags, brand cards, GST invoicing and pan-India dispatch. Use code <b>BULK25</b> for 8% off orders above ₹20,000.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <Link href="/shop?occasion=Corporate" className="btn-primary w-full justify-center sm:w-auto">See corporate hampers</Link>
                  <a href={`https://wa.me/${settings.whatsapp}?text=Hi! I'd like a quote for bulk gifting.`} target="_blank" rel="noreferrer" className="btn-ghost w-full justify-center sm:w-auto">Get a bulk quote</a>
                </div>
              </div>
              <div className="relative hidden md:block">
                <img src="/img/corporate.jpg" alt="Corporate desk hamper" className="ml-auto aspect-[4/4.2] w-[85%] rounded-[28px] object-cover shadow-[0_30px_70px_-30px_rgba(62,54,44,0.5)]" loading="lazy" />
                <div className="absolute -left-2 bottom-8 -rotate-3 rounded-2xl bg-cream px-5 py-3 shadow-lg">
                  <p className="font-script text-2xl text-ink">GST invoice included</p>
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
              Anything else? WhatsApp us on {settings.phone} — a human (usually with ribbon on their sleeves) replies within the hour.
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

function Stars() {
  return (
    <span className="inline-flex gap-0.5 text-rose" aria-label="Rated 4.9 out of 5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
