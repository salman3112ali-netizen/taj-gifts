"use client";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/store";
import { useCart } from "@/lib/cart";

export default function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { add } = useCart();
  return (
    <Link href={`/product/${p.slug}`} className="group block" data-cursor>
      <div className="card-img aspect-[4/5]">
        <img src={p.image} alt={p.name} loading={index > 3 ? "lazy" : "eager"} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {p.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-cream/90 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-ink backdrop-blur">
            {p.badge}
          </span>
        )}
        {p.compare_at && p.compare_at > p.price && (
          <span className="absolute right-4 top-4 rounded-full bg-rose px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
            −{Math.round((1 - p.price / p.compare_at) * 100)}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            add({ slug: p.slug, name: p.name, image: p.image, occasion: p.occasion, basePrice: p.price, variant: null, variantPrice: 0, addons: [], qty: 1 });
          }}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 translate-y-0 items-center gap-2 rounded-full bg-cream/95 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-ink opacity-100 shadow-lg backdrop-blur transition-all duration-400 hover:bg-ink hover:text-cream md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Quick add
        </button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose">{p.occasion}</p>
          <h3 className="font-display mt-1 line-clamp-2 text-[17px] font-semibold leading-snug transition-colors duration-300 group-hover:text-rose-deep sm:text-[19px]">
            {p.name}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-soft sm:text-[13px]">{p.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[17px] font-semibold sm:text-[19px]">{inr(p.price)}</p>
          {p.compare_at && <p className="text-[12px] text-ink-soft/70 line-through">{inr(p.compare_at)}</p>}
        </div>
      </div>
    </Link>
  );
}
