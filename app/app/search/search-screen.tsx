"use client";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import AppProductCard from "@/components/app/product-card";

const POPULAR = ["diwali", "wedding", "baby", "corporate", "honey", "candle"];

export default function SearchScreen({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    try { setRecent(JSON.parse(localStorage.getItem("taj-app-recent") || "[]")); } catch { /* noop */ }
  }, []);

  const save = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    try { localStorage.setItem("taj-app-recent", JSON.stringify(next)); } catch { /* noop */ }
  };

  const needle = q.trim().toLowerCase();
  const results = needle
    ? products.filter((p) => `${p.name} ${p.tagline} ${p.occasion} ${(p.contents ?? []).join(" ")}`.toLowerCase().includes(needle))
    : [];

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-white px-4 py-3">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-soft"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && needle && save(needle)}
          placeholder="Search hampers, mithai, candles…"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-soft/50"
        />
        {q && <button onClick={() => setQ("")} aria-label="Clear" className="text-ink-soft">✕</button>}
      </div>

      {!needle && (
        <div className="mt-6">
          {recent.length > 0 && (
            <>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ink-soft">Recent</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => setQ(r)} className="chip">{r}</button>
                ))}
              </div>
            </>
          )}
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.18em] text-ink-soft">Popular</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {POPULAR.map((p) => (
              <button key={p} onClick={() => setQ(p)} className="chip">{p}</button>
            ))}
          </div>
        </div>
      )}

      {needle && (
        <div className="mt-5">
          <p className="text-[12px] font-bold text-ink-soft">{results.length} result{results.length === 1 ? "" : "s"} for “{q}”</p>
          <div className="mt-3 grid grid-cols-2 gap-x-3.5 gap-y-6">
            {results.map((p) => <AppProductCard key={p.id} p={p} />)}
          </div>
          {results.length === 0 && (
            <p className="mt-10 text-center font-script text-2xl text-ink-soft">nothing found — try “diwali” 🎀</p>
          )}
        </div>
      )}
    </div>
  );
}
