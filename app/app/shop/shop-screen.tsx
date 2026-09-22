"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import AppProductCard from "@/components/app/product-card";

const SORTS = [
  { id: "featured", label: "Most loved" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
  { id: "name", label: "A–Z" },
] as const;

export default function ShopScreen({ products, initialOccasion }: { products: Product[]; initialOccasion: string }) {
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
    <div className="pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="flex items-end justify-between px-4">
        <h1 className="font-display text-[26px] font-medium leading-none">Shop all</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-full border border-ink/12 bg-white px-3 py-2 text-[12px] font-bold outline-none" aria-label="Sort">
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <div className="hide-scroll mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {occasions.map((o) => (
          <button key={o} onClick={() => setOccasion(o)} className={"chip shrink-0 " + (occasion === o ? "chip-on" : "")}>
            {o}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3.5 gap-y-6 px-4">
        {list.map((p) => <AppProductCard key={p.id} p={p} />)}
      </div>
      {list.length === 0 && <p className="mt-12 pb-8 text-center font-script text-2xl text-ink-soft">nothing here yet ♥</p>}
    </div>
  );
}
