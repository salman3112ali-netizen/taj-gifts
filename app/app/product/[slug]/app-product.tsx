"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product, Settings } from "@/lib/types";
import { unitPrice } from "@/lib/types";
import { inr, waLink } from "@/lib/store";
import { useCart } from "@/lib/cart";

export default function AppProduct({ p, settings }: { p: Product; settings: Settings }) {
  const { add, setDrawer } = useCart();
  const router = useRouter();
  const gallery = p.gallery?.length ? p.gallery : [p.image];
  const [img, setImg] = useState(0);
  const [variant, setVariant] = useState(p.variants?.[0]?.label ?? null);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const variantPrice = p.variants?.find((v) => v.label === variant)?.price ?? 0;
  const chosen = (p.addons ?? []).filter((a) => addons.includes(a.label));
  const toItem = () => ({ slug: p.slug, name: p.name, image: p.image, occasion: p.occasion, basePrice: p.price, variant, variantPrice, addons: chosen, qty });
  const price = unitPrice(toItem()) * qty;
  const out = p.stock === 0;

  return (
    <div className="pb-[calc(76px+env(safe-area-inset-bottom))]">
      {/* gallery: swipe */}
      <div className="hide-scroll flex snap-x snap-mandatory overflow-x-auto" onScroll={(e) => setImg(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {gallery.map((g, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            <div className="card-img aspect-[4/4.4] rounded-none">
              <img src={g} alt={`${p.name} view ${i + 1}`} className="absolute inset-0" />
            </div>
          </div>
        ))}
      </div>
      {gallery.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {gallery.map((_, i) => (
            <span key={i} className={"h-1.5 rounded-full transition-all " + (i === img ? "w-5 bg-rose" : "w-1.5 bg-ink/20")} />
          ))}
        </div>
      )}

      <div className="px-4 pt-4">
        <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-soft">
          <Link href="/app" className="hover:text-rose">Home</Link> / <Link href="/app/shop" className="hover:text-rose">Shop</Link> / <span className="text-rose">{p.occasion}</span>
        </nav>
        <h1 className="font-display mt-2 text-[28px] font-medium leading-[1.05]">{p.name}</h1>
        <p className="mt-1 font-script text-xl text-rose">{p.tagline}</p>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
          <span className="flex gap-0.5 text-rose">{[...Array(5)].map((_, i) => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8L12 2.5z" /></svg>)}</span>
          <b className="text-ink">{p.rating}</b> · {p.reviews} gift-givers
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <p className="font-display text-[26px] font-semibold">{inr(price)}</p>
          {p.compare_at && <p className="text-[14px] text-ink-soft/60 line-through">{inr(p.compare_at * qty)}</p>}
        </div>

        {p.description && <p className="mt-4 text-[14px] leading-relaxed text-ink-soft">{p.description}</p>}

        {p.variants?.length ? (
          <div className="mt-5">
            <p className="label">Size</p>
            <div className="flex flex-wrap gap-2">
              {p.variants.map((v) => (
                <button key={v.label} onClick={() => setVariant(v.label)} className={"chip " + (variant === v.label ? "chip-on" : "")}>
                  {v.label} · {inr(v.price)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {p.addons?.length ? (
          <div className="mt-5">
            <p className="label">Make it extra</p>
            <div className="space-y-2">
              {p.addons.map((a) => (
                <label key={a.label} className="flex cursor-pointer items-center justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3 active:scale-[0.99]">
                  <span className="flex items-center gap-3 text-[14px] font-semibold">
                    <span className={"grid h-5 w-5 place-items-center rounded-md border transition " + (addons.includes(a.label) ? "border-rose bg-rose text-white" : "border-ink/25")}>
                      {addons.includes(a.label) && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4"><path d="M4 12.5 9.5 18 20 6.5" /></svg>}
                    </span>
                    {a.label}
                  </span>
                  <span className="text-[13px] font-bold text-rose">+{inr(a.price)}</span>
                  <input type="checkbox" className="sr-only" checked={addons.includes(a.label)} onChange={() => setAddons((s) => (s.includes(a.label) ? s.filter((x) => x !== a.label) : [...s, a.label]))} />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-4 rounded-full border border-ink/15 bg-white px-4 py-2.5">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-1 py-1 text-xl leading-none text-ink-soft" aria-label="Decrease">−</button>
            <span className="min-w-5 text-center font-display text-lg font-semibold">{qty}</span>
            <button onClick={() => setQty(Math.min(Math.max(1, p.stock), qty + 1))} className="px-1 py-1 text-xl leading-none text-ink-soft" aria-label="Increase">+</button>
          </div>
          <a href={waLink(settings.whatsapp, `Hi! I love the "${p.name}" hamper — can I customise it?`)} target="_blank" rel="noreferrer" className="chip">Customise on WhatsApp</a>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-mint/70 p-3.5 text-[11.5px] font-semibold leading-snug">🚚 Free delivery above {inr(settings.freeDeliveryAbove)}</div>
          <div className="rounded-2xl bg-lav/70 p-3.5 text-[11.5px] font-semibold leading-snug">💳 COD & UPI accepted</div>
        </div>
      </div>

      {/* sticky buy bar above tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 border-t border-line bg-cream/95 px-4 pb-3 pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[560px] items-center gap-2.5">
          <button disabled={out} onClick={() => { add(toItem()); setDrawer(false); router.push("/app/cart"); }} className="btn-ghost flex-1 px-4 py-3.5 text-[11px] disabled:opacity-40">
            Add · {inr(price)}
          </button>
          <button disabled={out} onClick={() => { add(toItem()); router.push("/app/checkout"); }} className="btn-rose flex-1 px-4 py-3.5 text-[11px] disabled:opacity-40">
            Gift it now
          </button>
        </div>
      </div>
    </div>
  );
}
