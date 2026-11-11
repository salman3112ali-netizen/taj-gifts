"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Reveal, Words } from "@/components/reveal";

const SORTS = [
  { id: "featured", label: "Recommended" },
  { id: "price-asc", label: "Price · low to high" },
  { id: "price-desc", label: "Price · high to low" },
  { id: "name", label: "A → Z" },
] as const;

function haystack(p: Product): string {
  return [p.name, p.occasion, p.tagline, p.description, ...(p.tags ?? []), ...(p.contents ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function ShopClient({
  products,
  initialOccasion,
  initialQuery = "",
}: {
  products: Product[];
  initialOccasion: string;
  initialQuery?: string;
}) {
  const [occasion, setOccasion] = useState(initialOccasion);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("featured");
  const [query, setQuery] = useState(initialQuery);
  const occasions = ["All", ...new Set(products.map((p) => p.occasion))];
  const term = query.trim().toLowerCase();

  const list = useMemo(() => {
    let l = occasion === "All" ? [...products] : products.filter((p) => p.occasion === occasion);
    if (term) l = l.filter((p) => haystack(p).includes(term));
    if (sort === "price-asc") l.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") l.sort((a, b) => b.price - a.price);
    if (sort === "name") l.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") l.sort((a, b) => Number(b.featured) - Number(a.featured));
    return l;
  }, [products, occasion, sort, term]);

  return (
    <section className="wrap pb-24 pt-10 md:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The whole table</p>
          <h1 className="font-display mt-3 text-5xl font-medium leading-[1.02] md:text-6xl">
            <Words text="Shop every hamper" />
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-ink-soft">
            {products.length} hand-tied designs · contents and add-ons are listed on every product page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input w-auto cursor-pointer rounded-full py-2.5 text-[13px] font-medium">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div id="search" className="mt-8">
        <label htmlFor="shop-search" className="sr-only">Search hampers</label>
        <div className="flex items-center gap-3 rounded-full border border-ink/12 bg-white/70 px-4 py-3 focus-within:border-rose/50">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-soft" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hampers, occasions or contents — Diwali, wedding, pahadi…"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink-soft/60"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft hover:text-rose">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="hide-scroll -mx-5 mt-6 flex gap-2.5 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        {occasions.map((o) => (
          <button key={o} onClick={() => setOccasion(o)} className={"chip shrink-0 " + (occasion === o ? "chip-on" : "")}>
            {o}
            <span className="opacity-60">{o === "All" ? products.length : products.filter((p) => p.occasion === o).length}</span>
          </button>
        ))}
      </div>

      {(term || occasion !== "All") && (
        <p className="mt-6 text-[13px] text-ink-soft">
          {list.length} {list.length === 1 ? "hamper" : "hampers"}
          {term ? ` matching “${query.trim()}”` : ""}
          {occasion !== "All" ? ` in ${occasion}` : ""}.
        </p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-4">
        {list.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 0.07}>
            <ProductCard p={p} index={i} />
          </Reveal>
        ))}
      </div>

      {list.length === 0 && (
        <div className="mt-16 text-center">
          <p className="font-script text-3xl text-ink-soft">nothing matched that search…</p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-ink-soft">
            Try a broader word such as “wedding”, “festive” or “self-care”, or message the studio and we will build a hamper for your occasion.
          </p>
          <button
            type="button"
            onClick={() => { setQuery(""); setOccasion("All"); }}
            className="btn-ghost mt-6"
          >
            Show every hamper
          </button>
        </div>
      )}
    </section>
  );
}
