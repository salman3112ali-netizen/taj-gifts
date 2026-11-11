import type { Metadata } from "next";
import { getSettings } from "@/lib/store";
import { Reveal, Words } from "@/components/reveal";
import { SpinBadge } from "@/components/marquee";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

export const metadata: Metadata = {
  title: "Our Story — A Home Hamper Studio in Kashipur, Uttarakhand",
  description:
    "Meet Taj Gifts, a home hamper studio in Kashipur, Uttarakhand. Browse clear product details, request a custom gifting conversation and keep account orders visible after checkout.",
  alternates: { canonical: BASE + "/about" },
};

export default async function About() {
  const s = await getSettings();
  return (
    <section className="pb-24">
      <div className="wrap pt-12 md:pt-16">
        <Reveal><p className="eyebrow">A home hamper studio in Kashipur</p></Reveal>
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
              a family gifting studio working from {s.city}, {s.state}. We focus on gift hampers that feel considered rather than generic: a clear list of contents, a handwritten note, and a delivery plan that fits the recipient and occasion.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p>
              Each available hamper is assembled and ribbon-tied at the studio. Contents, variants and add-ons are listed on the product page so you can choose deliberately; for allergies, dietary needs or a fully customised order, please ask before placing it.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p>
              We stay deliberately small-batch. Made-to-order trays and festival windows can need additional lead time, so checkout and the studio will confirm what is realistically possible before a promise is made.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[["Hand-tied", "at the studio"], ["Small batch", "made for the moment"], ["Account-backed", "private order history"]].map(([a, b]) => (
                <div key={b} className="rounded-3xl bg-cream-deep/80 p-5 text-center">
                  <p className="font-display text-3xl font-medium text-ink">{a}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">{b}</p>
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
            { t: "Clear product details", d: "Review listed contents, variants and add-ons before adding a hamper to your basket.", bg: "bg-blush" },
            { t: "Ask before ordering", d: "For allergies, dietary needs, bulk gifting or a custom request, speak with the studio first.", bg: "bg-mint" },
            { t: "Account-backed orders", d: "An account keeps your order history and private tracking in one place.", bg: "bg-lav" },
            { t: "Delivery issue? Tell us promptly.", d: "If something arrives damaged or incorrect, contact us within 24 hours with clear photos so we can review the right resolution.", bg: "bg-butter" },
          ].map((v, i) => (
            <Reveal key={v.t} delay={i * 0.08}>
              <div className={`h-full rounded-[28px] ${v.bg} p-7`}>
                <p className="font-display text-xl font-medium">{v.t}</p>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink/70">{v.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
