"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((it, i) => (
        <div key={i}>
          <button className="flex w-full items-center justify-between gap-6 py-6 text-left" onClick={() => setOpen(open === i ? null : i)}>
            <span className="font-display text-lg font-semibold md:text-xl">{it.q}</span>
            <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/20 transition-all duration-400 " + (open === i ? "rotate-45 bg-ink text-cream" : "")}>
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" fill="none"><path d="M12 5v14M5 12h14" /></svg>
            </span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-ink-soft">{it.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
