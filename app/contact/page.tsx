"use client";
import { useState } from "react";
import { Accordion } from "@/components/accordion";
import { Reveal } from "@/components/reveal";

export default function Contact() {
  const [f, setF] = useState({ name: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "done">("idle");

  return (
    <section className="wrap grid gap-14 pb-24 pt-12 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <Reveal>
          <p className="eyebrow">Say hello</p>
          <h1 className="font-display mt-4 text-5xl font-medium leading-[1.02] md:text-6xl">Custom hamper? Bulk quote? Just curious?</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Tell us the occasion, the budget and the vibe — we'll sketch a hamper and WhatsApp you photos. Humans reply, usually within the hour, 10 am – 8 pm IST.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {[
              { t: "WhatsApp (fastest)", v: "Message us", href: "https://wa.me/919876543210", bg: "bg-mint" },
              { t: "Call the studio", v: "+91 98765 43210", href: "tel:+919876543210", bg: "bg-blush" },
              { t: "Email", v: "hello@tajgifts.in", href: "mailto:hello@tajgifts.in", bg: "bg-lav" },
              { t: "Studio (by appointment)", v: "Gandhi Ashram Market, Kashipur", href: "#", bg: "bg-butter" },
            ].map((c) => (
              <a key={c.t} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`rounded-3xl ${c.bg} p-5 transition hover:-translate-y-1 hover:shadow-lg`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/60">{c.t}</p>
                <p className="mt-1.5 font-display text-[17px] font-semibold leading-snug">{c.v}</p>
              </a>
            ))}
          </div>
        </Reveal>
      </div>

      <div>
        <Reveal delay={0.1}>
          <form
            className="rounded-[32px] border border-line bg-white/70 p-8 backdrop-blur"
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
              setState("done");
              setF({ name: "", phone: "", message: "" });
            }}
          >
            <p className="font-display text-2xl font-semibold">Start a hamper conversation</p>
            <div className="mt-6 grid gap-4">
              <div><label className="label">Your name *</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Priya Negi" /></div>
              <div><label className="label">Phone / WhatsApp *</label><input className="input" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98765 43210" /></div>
              <div>
                <label className="label">The dream *</label>
                <textarea className="input min-h-[130px] resize-y" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="40 return-gift trays for a December wedding in Haldwani, budget ₹700/tray, blush + gold vibe…" />
              </div>
              <button className="btn-rose w-full">{state === "done" ? "Sent! We'll WhatsApp you ♥" : "Send it over"}</button>
              {state === "done" && <p className="text-center text-sm font-semibold text-mint-deep">Got it — expect a reply within the hour (10 am–8 pm IST).</p>}
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12" id="faq">
            <p className="eyebrow">Quick answers</p>
            <div className="mt-4">
              <Accordion
                items={[
                  { q: "How early should I book wedding / bulk hampers?", a: "7–10 days is comfortable for 20–100 pieces; above that, two weeks. Festive seasons (Diwali, Rakhi) fill fast — pre-order windows open a month ahead and subscribers hear first." },
                  { q: "Can you deliver outside Uttarakhand?", a: "Yes — pan-India via tracked courier, double-boxed with petal-safe packing. Same-day hand delivery stays exclusive to Kashipur & nearby pincodes." },
                  { q: "Do you include prices inside the hamper?", a: "Never unless you ask. Tick “keep it a surprise” at checkout and the box carries only your note and our contents card." },
                ]}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
