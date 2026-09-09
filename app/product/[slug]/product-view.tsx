"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, Settings } from "@/lib/types";
import { unitPrice } from "@/lib/types";
import { inr, waLink } from "@/lib/store";
import { useCart } from "@/lib/cart";
import { Reveal } from "@/components/reveal";

export default function ProductView({ p, settings }: { p: Product; settings: Settings }) {
  const { add, setDrawer } = useCart();
  const router = useRouter();
  const [variant, setVariant] = useState(p.variants?.[0]?.label ?? null);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const [img, setImg] = useState(0);
  const variantPrice = p.variants?.find((v) => v.label === variant)?.price ?? 0;
  const chosenAddons = (p.addons ?? []).filter((a) => addons.includes(a.label));
  const unit = p.price + variantPrice + chosenAddons.reduce((s, a) => s + a.price, 0);
  const out = p.stock <= 0;

  const toItem = () => ({
    slug: p.slug, name: p.name, image: p.image, occasion: p.occasion,
    basePrice: p.price, variant, variantPrice, addons: chosenAddons, qty,
  });

  return (
    <section className="wrap grid gap-12 pb-16 pt-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <Reveal y={24}>
        <div className="lg:sticky lg:top-28">
          <div className="card-img aspect-[4/4.4] rounded-[32px]">
            <img src={gallery[img]} alt={p.name} className="absolute inset-0" />
            {p.badge && <span className="absolute left-5 top-5 rounded-full bg-cream/90 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur">{p.badge}</span>}
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setImg(i)} className={"h-20 w-16 overflow-hidden rounded-xl border-2 transition " + (i === img ? "border-rose" : "border-transparent opacity-70 hover:opacity-100")}>
                  <img src={g} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <div>
        <Reveal>
          <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft">
            <Link href="/" className="hover:text-rose">Home</Link> /
            <Link href="/shop" className="hover:text-rose">Shop</Link> /
            <Link href={`/shop?occasion=${encodeURIComponent(p.occasion)}`} className="hover:text-rose">{p.occasion}</Link>
          </nav>
          <h1 className="font-display mt-4 text-5xl font-medium leading-[1.02] md:text-6xl">{p.name}</h1>
          <p className="mt-3 font-script text-2xl text-rose">{p.tagline}</p>
          <div className="mt-4 flex items-center gap-3 text-sm text-ink-soft">
            <span className="flex gap-0.5 text-rose">{[...Array(5)].map((_, i) => <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8L12 2.5z" /></svg>)}</span>
            <b className="text-ink">{p.rating}</b> · {p.reviews} happy gift-givers
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-6 flex items-end gap-3">
            <p className="font-display text-4xl font-semibold">{inr(unit)}</p>
            {p.compare_at && <p className="pb-1 text-lg text-ink-soft line-through">{inr(p.compare_at)}</p>}
            {p.compare_at && <span className="mb-1.5 rounded-full bg-mint px-3 py-1 text-[11px] font-black uppercase tracking-wider text-ink">save {inr(p.compare_at - p.price)}</span>}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{p.description}</p>
        </Reveal>

        {p.variants && p.variants.length > 0 && (
          <Reveal delay={0.15}>
            <p className="label mt-8">Size / style</p>
            <div className="flex flex-wrap gap-2.5">
              {p.variants.map((v) => (
                <button key={v.label} onClick={() => setVariant(v.label)} className={"chip " + (variant === v.label ? "chip-on" : "")}>
                  {v.label}
                  {v.price > 0 && <span className="opacity-70">+{inr(v.price)}</span>}
                </button>
              ))}
            </div>
            {p.variants.find((v) => v.label === variant)?.note && (
              <p className="mt-2 font-script text-lg text-ink-soft">{p.variants.find((v) => v.label === variant)?.note}</p>
            )}
          </Reveal>
        )}

        {p.addons && p.addons.length > 0 && (
          <Reveal delay={0.2}>
            <p className="label mt-7">Make it extra</p>
            <div className="space-y-2.5">
              {p.addons.map((a) => (
                <label key={a.label} className={"flex cursor-pointer items-center justify-between rounded-2xl border px-5 py-3.5 transition " + (addons.includes(a.label) ? "border-rose bg-blush/50" : "border-ink/12 bg-white/60 hover:border-ink/30")}>
                  <span className="flex items-center gap-3 text-[14px] font-semibold">
                    <span className={"grid h-5 w-5 place-items-center rounded-md border transition " + (addons.includes(a.label) ? "border-rose bg-rose text-white" : "border-ink/25")}>
                      {addons.includes(a.label) && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4"><path d="M4 12.5 9.5 18 20 6.5" /></svg>}
                    </span>
                    {a.label}
                  </span>
                  <span className="text-sm font-bold text-rose">+{inr(a.price)}</span>
                  <input type="checkbox" className="sr-only" checked={addons.includes(a.label)} onChange={() => setAddons((s) => (s.includes(a.label) ? s.filter((x) => x !== a.label) : [...s, a.label]))} />
                </label>
              ))}
            </div>
          </Reveal>
        )}

        <Reveal delay={0.25}>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 rounded-full border border-ink/15 bg-white px-4 py-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-xl leading-none text-ink-soft hover:text-rose" aria-label="Decrease quantity">−</button>
              <span className="min-w-5 text-center font-display text-lg font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))} className="text-xl leading-none text-ink-soft hover:text-rose" aria-label="Increase quantity">+</button>
            </div>
            <button
              disabled={out}
              onClick={() => { add({ ...toItem() }); setDrawer(true); }}
              className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {out ? "Sold out — ask us to restock" : `Add to basket · ${inr(unitPrice(toItem()) * qty)}`}
            </button>
            <button
              disabled={out}
              onClick={() => { add({ ...toItem() }); router.push("/checkout"); }}
              className="btn-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              Gift it now
            </button>
          </div>
          <p className="mt-3 text-[13px] text-ink-soft">
            {p.lead_time ? `⏳ ${p.lead_time} · ` : ""}{p.stock > 0 ? `${p.stock} ready to tie` : "made to order"} · COD & UPI at checkout
          </p>
        </Reveal>

        {p.contents && p.contents.length > 0 && (
          <Reveal delay={0.3}>
            <div className="mt-9 rounded-[28px] bg-cream-deep/70 p-7">
              <p className="font-display text-xl font-semibold">What's inside</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {p.contents.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[14px] leading-snug text-ink/80">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c0697a" strokeWidth="2.6" className="mt-0.5 shrink-0"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.35}>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={waLink(settings.whatsapp, `Hi! I love the "${p.name}" hamper — can I customise it?`)} target="_blank" rel="noreferrer" className="chip hover:border-mint-deep hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.2Z" /></svg>
              Customise on WhatsApp
            </a>
            <span className="chip cursor-default">🚚 Free delivery above {inr(settings.freeDeliveryAbove)}</span>
            <span className="chip cursor-default">💳 COD · UPI</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import Link from "next/link";
