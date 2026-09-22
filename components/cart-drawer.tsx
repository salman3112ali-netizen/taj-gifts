"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useCart, inr, deliveryFor } from "@/lib/cart";
import { itemKey, unitPrice } from "@/lib/types";

export default function CartDrawer() {
  const { drawer, setDrawer, items, setQty, remove, subtotal, coupon, discount, applyCoupon, clearCoupon, settings } = useCart();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const afterDiscount = subtotal - discount;
  const { local, charge } = deliveryFor(settings, settings.pincode, afterDiscount); // estimate w/ local pincode; final at checkout
  const freeShip = afterDiscount >= settings.freeDeliveryAbove;

  return (
    <AnimatePresence>
      {drawer && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawer(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[440px] flex-col bg-cream shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-2xl font-semibold">
                Your basket <span className="font-script text-lg text-rose">({items.length} {items.length === 1 ? "hamper" : "hampers"})</span>
              </h2>
              <button onClick={() => setDrawer(false)} aria-label="Close cart" className="rounded-full border border-ink/15 p-2 transition hover:bg-ink hover:text-cream">
                <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-blush">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a2505f" strokeWidth="1.6">
                      <path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 21V7M12 7s-1.5-4-4.5-4S4 7 7.5 7H12Zm0 0s1.5-4 4.5-4S20 7 16.5 7H12Z" />
                    </svg>
                  </div>
                  <p className="font-display text-xl font-medium">Your basket is waiting to be filled</p>
                  <p className="max-w-[240px] text-sm text-ink-soft">Browse our hand-tied hampers — every one wrapped at home in {settings.city}.</p>
                  <Link href="/shop" onClick={() => setDrawer(false)} className="btn-primary mt-2">Shop hampers</Link>
                </div>
              ) : (
                <ul className="space-y-5">
                  {items.map((i) => {
                    const key = itemKey(i);
                    return (
                      <li key={key} className="flex gap-4">
                        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-deep">
                          <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-display text-[16px] font-semibold leading-tight">{i.name}</p>
                              <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                                {i.occasion}
                                {i.variant ? ` · ${i.variant}` : ""}
                                {i.addons.length ? ` · +${i.addons.length}` : ""}
                              </p>
                            </div>
                            <button onClick={() => remove(key)} className="text-ink-soft transition hover:text-rose" aria-label={`Remove ${i.name}`}>
                              <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-ink/15 bg-white px-1.5 py-1">
                              <button onClick={() => setQty(key, i.qty - 1)} className="px-2.5 py-1.5 text-lg leading-none text-ink-soft hover:text-rose" aria-label="Decrease">−</button>
                              <span className="min-w-5 text-center text-sm font-bold">{i.qty}</span>
                              <button onClick={() => setQty(key, i.qty + 1)} className="px-2.5 py-1.5 text-lg leading-none text-ink-soft hover:text-rose" aria-label="Increase">+</button>
                            </div>
                            <p className="font-display text-[16px] font-semibold">{inr(unitPrice(i) * i.qty)}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-line bg-white/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
                {coupon ? (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-mint px-4 py-2.5 text-sm">
                    <span className="font-bold">
                      {coupon.code} <span className="font-normal text-ink-soft">— {coupon.label}</span>
                    </span>
                    <button onClick={clearCoupon} className="text-xs font-bold uppercase tracking-wider text-rose hover:underline">Remove</button>
                  </div>
                ) : (
                  <form
                    className="mb-3 flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      setErr(await applyCoupon(code.trim().toUpperCase()));
                      setBusy(false);
                      setCode("");
                    }}
                  >
                    <input className="input py-2.5 text-sm uppercase tracking-wider" placeholder="Gift code (try FIRSTGIFT)" value={code} onChange={(e) => setCode(e.target.value)} />
                    <button className="shrink-0 rounded-xl bg-ink px-5 text-[11px] font-black uppercase tracking-wider text-cream transition hover:bg-rose-deep" disabled={busy}>
                      {busy ? "…" : "Apply"}
                    </button>
                  </form>
                )}
                {err && <p className="mb-2 text-xs font-semibold text-rose-deep">{err}</p>}

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="font-bold">{inr(subtotal)}</span></div>
                  {discount > 0 && <div className="flex justify-between text-mint-deep"><span>Discount</span><span className="font-bold">−{inr(discount)}</span></div>}
                  <div className="flex justify-between text-ink-soft">
                    <span>Delivery</span>
                    <span className="font-bold text-ink">{freeShip ? "FREE" : `from ${inr(charge === 0 ? settings.localDeliveryCharge : charge)}${local ? "" : "*"}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 font-display text-lg font-semibold">
                    <span>Total</span><span>{inr(afterDiscount + (freeShip ? 0 : charge))}</span>
                  </div>
                </div>
                <Link href="/checkout" onClick={() => setDrawer(false)} className="btn-rose mt-4 w-full">
                  Checkout · wrap it with love
                </Link>
                <p className="mt-2.5 text-center text-[11px] text-ink-soft">COD & UPI accepted · Free delivery above {inr(settings.freeDeliveryAbove)}</p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
