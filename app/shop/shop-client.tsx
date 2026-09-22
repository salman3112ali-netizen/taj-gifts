"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/product-card";
import { Reveal, Words } from "@/components/reveal";

const SORTS = [
  { id: "featured", label: "Most loved" },
  { id: "price-asc", label: "Price · low to high" },
  { id: "price-desc", label: "Price · high to low" },
  { id: "name", label: "A → Z" },
] as const;

export default function ShopClient({ products, initialOccasion }: { products: Product[]; initialOccasion: string }) {
  const [occasion, setOccasion] = useState(initialOccasion);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("featured");
  const occasions = ["All", ...new Set(products.map((p) => p.occasion))];

  const list = useMemo(() => {
    let l = occasion === "All" ? [...products] : products.filter((p) => p.occasion === occasion);
    if (sort === "price-asc") l.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") l.sort((a, b) => b.price - a.price);
    if (sort === "name") l.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") l.sort((a, b) => Number(b.featured) - Number(a.featured));
    return l;
  }, [products, occasion, sort]);

  return (
    <section className="wrap pb-24 pt-10 md:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">The whole table</p>
          <h1 className="font-display mt-3 text-5xl font-medium leading-[1.02] md:text-6xl">
            <Words text="Shop every hamper" />
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-ink-soft">{products.length} hand-tied designs · each one customisable on WhatsApp before we seal it.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-black uppercase tracking-[0.18em] text-ink-soft" htmlFor="sort">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="input w-auto cursor-pointer rounded-full py-2.5 text-[13px] font-bold">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="hide-scroll -mx-5 mt-9 flex gap-2.5 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        {occasions.map((o) => (
          <button key={o} onClick={() => setOccasion(o)} className={"chip shrink-0 " + (occasion === o ? "chip-on" : "")}>
            {o}
            <span className="opacity-60">{o === "All" ? products.length : products.filter((p) => p.occasion === o).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:gap-x-8 lg:grid-cols-4">
        {list.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 0.07}>
            <ProductCard p={p} index={i} />
          </Reveal>
        ))}
      </div>
      {list.length === 0 && <p className="mt-16 text-center font-script text-3xl text-ink-soft">nothing here yet — try another occasion ♥</p>}
    </section>
  );
}
