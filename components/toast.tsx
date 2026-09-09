"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";

export default function Toast() {
  const { toast } = useCart();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-6 left-1/2 z-[96] -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-2xl">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-mint text-ink">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
            </span>
            {toast}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
