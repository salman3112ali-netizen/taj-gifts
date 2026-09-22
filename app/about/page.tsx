import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import { Reveal, Words } from "@/components/reveal";
import { SpinBadge } from "@/components/marquee";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const metadata: Metadata = {
  title: "Our Story — A Home Hamper Studio in Kashipur, Uttarakhand",
  description:
    "How one Diwali at a kitchen table in Kashipur became a hand-tied gifting studio sourcing from pahadi makers, halwais and women's collectives across Uttarakhand.",
  alternates: { canonical: BASE + "/about" },
};

export default async function About() {
  const s = await getSettings();
  return (
    <section className="pb-24">
      <div className="wrap pt-12 md:pt-16">
        <Reveal><p className="eyebrow">Since one Diwali, several thousand ribbons ago</p></Reveal>
        <h1 className="font-display mt-4 max-w-4xl text-5xl font-medium leading-[1.02] md:text-7xl">
          <Words text="We tie hampers the way" />
          <br />
          <span className="italic text-rose"><Words text="you'd tie them yourself" delay={0.3} /></span>
          <span className="text-rose">.</span>
        </h1>
      </div>

      <div className="wrap mt-14 grid gap-14 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="relative">
          <div className="overflow-hidden rounded-[36px] border border-ink/10">
            <img src="/img/story.jpg" alt="Hands tying a ribbon on a hamper" className="aspect-[4/4.4] w-full object-cover" />
          </div>
          <SpinBadge className="absolute -bottom-10 right-6" text="from our home · to their home · " />
        </Reveal>
        <div className="space-y-6 text-[16px] leading-relaxed text-ink-soft">
          <Reveal><p className="font-script text-3xl text-rose">namaste, we're {s.shopName} —</p></Reveal>
          <Reveal delay={0.1}>
            <p>
              a family gifting studio running out of a sunny home in {s.city}, {s.state}. It started with one Diwali when we couldn't find a gift box that felt like <em>us</em> — so we tied fifteen of them at the kitchen table, and neighbours kept asking for "one more, but for a birthday".
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p>
              Today every hamper still begins the same way: sourced from pahadi makers we know by name — village co-op honey and jams, halwai mithai in small licensed batches, candles poured by a women's collective in Ramnagar — then styled, ribbon-tied and double-boxed at home.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p>
              We stay deliberately small-batch. It means lead times on made-to-order trays, and festival windows that fill up. It also means no hamper leaves this house with a loose bow, a sad petal, or a note we wouldn't sign ourselves.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[["12,000+", "hampers tied"], ["9", "pahadi maker partners"], ["4.9★", "average rating"]].map(([a, b]) => (
                <div key={b} className="rounded-3xl bg-cream-deep/80 p-5 text-center">
                  <p className="font-display text-3xl font-semibold text-ink">{a}</p>
                  <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft">{b}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="wrap mt-24">
        <Reveal className="text-center"><h2 className="font-display text-4xl font-medium md:text-5xl">What we promise, every single box.</h2></Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {[
            { t: "Honest contents", d: "Every item listed on the card inside — brands, bakers, shelf life. No mystery mithai.", bg: "bg-blush" },
            { t: "Fresh over frozen", d: "Food is ordered from makers against real order volume, not warehoused for months.", bg: "bg-mint" },
            { t: "Photographed proofs", d: "Custom & bulk orders get photos before sealing. What you approve is what arrives.", bg: "bg-lav" },
            { t: "Damage? Replaced.", d: "A photo within 24 hours and we re-ship or refund that line. Nine times in three years. Nine.", bg: "bg-butter" },
          ].map((v, i) => (
            <Reveal key={v.t} delay={i * 0.08}>
              <div className={`h-full rounded-[28px] ${v.bg} p-7`}>
                <p className="font-display text-xl font-semibold">{v.t}</p>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink/70">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
