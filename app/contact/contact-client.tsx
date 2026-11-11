"use client";
import { useState } from "react";
import { Accordion } from "@/components/accordion";
import { Reveal } from "@/components/reveal";
import type { Settings } from "@/lib/types";

export default function ContactClient({ settings: s }: { settings: Settings }) {
  const [f, setF] = useState({ name: "", phone: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [error, setError] = useState("");

  return (
    <section className="wrap grid gap-14 pb-24 pt-12 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <Reveal>
          <p className="eyebrow">Say hello</p>
          <h1 className="font-display mt-4 text-5xl font-medium leading-[1.02] md:text-6xl">Custom hamper? Bulk quote? Just curious?</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
            Tell us the occasion, budget, delivery city and the feeling you want to create. The studio will review the request and come back with what is realistically possible.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {[
              { t: "WhatsApp (fastest)", v: s.phone, href: `https://wa.me/${s.whatsapp}`, bg: "bg-mint" },
              { t: "Call the studio", v: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}`, bg: "bg-blush" },
              { t: "Email", v: s.email, href: `mailto:${s.email}`, bg: "bg-lav" },
              { t: "Studio (by appointment)", v: `${s.address}, ${s.city}`, href: "#", bg: "bg-butter" },
            ].map((c) => (
              <a key={c.t} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`rounded-3xl ${c.bg} p-5 transition hover:-translate-y-1 hover:shadow-lg`}>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-ink/60">{c.t}</p>
                <p className="mt-1.5 font-display text-[17px] font-medium leading-snug">{c.v}</p>
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
              const response = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
              const result = await response.json().catch(() => ({}));
              if (!result.ok) { setState("error"); setError(result.error || "Could not send your request. Please try WhatsApp."); return; }
              setState("done"); setError("");
              setF({ name: "", phone: "", message: "", website: "" });
            }}
          >
            <p className="font-display text-2xl font-medium">Start a hamper conversation</p>
            <div className="mt-6 grid gap-4">
              <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
              <div><label className="label">Your name *</label><input className="input" required value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setState("idle"); }} placeholder="Priya Negi" /></div>
              <div><label className="label">Phone / WhatsApp *</label><input className="input" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98765 43210" /></div>
              <div>
                <label className="label">The dream *</label>
                <textarea className="input min-h-[130px] resize-y" required value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="40 return-gift trays for a December wedding in Haldwani, budget ₹700/tray, blush + gold vibe…" />
              </div>
              <button className="btn-rose w-full">{state === "done" ? "Request sent ✓" : "Send request"}</button>
              {state === "done" && <p className="text-center text-sm font-medium text-mint-deep">Thanks — your request reached the studio. We’ll reply as soon as we can.</p>}
              {state === "error" && <p className="text-center text-sm font-medium text-rose-deep">{error}</p>}
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12" id="faq">
            <p className="eyebrow">Quick answers</p>
            <div className="mt-4">
              <Accordion
                items={[
                  { q: "How early should I book wedding / bulk hampers?", a: "Please contact us before placing a bulk order. The feasible lead time depends on quantity, customisation, ingredients, packaging and delivery city; festival dates can need substantially more notice." },
                  { q: "Can you deliver outside Uttarakhand?", a: "Delivery availability is checked from the recipient pincode at checkout. Kashipur-area local hand delivery and courier delivery elsewhere are subject to the product, pincode and current capacity." },
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
