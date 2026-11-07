"use client";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/store";
import { useCart } from "@/lib/cart";

/** Compact app-style product card: big tap target, one-tap add. */
export default function AppProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <Link href={`/app/product/${p.slug}`} className="group block active:opacity-90">
      <div className="card-img aspect-[4/5] rounded-[20px]">
        <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0" />
        {p.badge && <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-ink backdrop-blur">{p.badge}</span>}
        <button
          aria-label={`Add ${p.name} to cart`}
          onClick={(e) => {
            e.preventDefault();
            add({ slug: p.slug, name: p.name, image: p.image, occasion: p.occasion, basePrice: p.price, variant: null, variantPrice: 0, addons: [], qty: 1 });
          }}
          className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-ink text-cream shadow-lg transition active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose">{p.occasion}</p>
        <h3 className="font-display mt-0.5 line-clamp-1 text-[15px] font-semibold leading-tight">{p.name}</h3>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <p className="font-display text-[15px] font-semibold">{inr(p.price)}</p>
          {p.compare_at && <p className="text-[11px] text-ink-soft/60 line-through">{inr(p.compare_at)}</p>}
        </div>
      </div>
    </Link>
  );
}
