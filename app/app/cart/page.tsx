"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart, inr, deliveryFor } from "@/lib/cart";
import { itemKey, unitPrice } from "@/lib/types";

export default function AppCart() {
  const { items, setQty, remove, subtotal, coupon, discount, applyCoupon, clearCoupon, settings } = useCart();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const after = subtotal - discount;
  const { charge } = deliveryFor(settings, settings.pincode, after);
  const free = after >= settings.freeDeliveryAbove;

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <h1 className="font-display text-[26px] font-medium leading-none">Your basket</h1>
      <p className="mt-1 text-[12px] font-bold text-ink-soft">{items.length} item{items.length === 1 ? "" : "s"}</p>

      {items.length === 0 ? (
        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-blush">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a2505f" strokeWidth="1.6"><path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8M2 7h20v5H2zM12 21V7M12 7s-1.5-4-4.5-4S4 7 7.5 7H12Zm0 0s1.5-4 4.5-4S20 7 16.5 7H12Z" /></svg>
          </div>
          <p className="font-display text-xl font-medium">Your basket is waiting</p>
          <Link href="/app/shop" className="btn-primary">Shop hampers</Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 space-y-4">
            {items.map((i) => {
              const key = itemKey(i);
              return (
                <li key={key} className="flex gap-3 rounded-[20px] border border-line bg-white/70 p-3">
                  <Link href={`/app/product/${i.slug}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-cream-deep">
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display text-[15px] font-semibold leading-tight">{i.name}</p>
                      <button onClick={() => remove(key)} aria-label={`Remove ${i.name}`} className="text-ink-soft">✕</button>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                      {i.occasion}{i.variant ? ` · ${i.variant}` : ""}{i.addons.length ? ` · +${i.addons.length}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-ink/15 bg-white px-1.5 py-0.5">
                        <button onClick={() => setQty(key, i.qty - 1)} className="px-2 py-1 text-base leading-none text-ink-soft" aria-label="Decrease">−</button>
                        <span className="min-w-4 text-center text-[13px] font-bold">{i.qty}</span>
                        <button onClick={() => setQty(key, i.qty + 1)} className="px-2 py-1 text-base leading-none text-ink-soft" aria-label="Increase">+</button>
                      </div>
                      <p className="font-display text-[15px] font-semibold">{inr(unitPrice(i) * i.qty)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {coupon ? (
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-mint px-4 py-3 text-[13px]">
              <span className="font-bold">{coupon.code} — {coupon.label}</span>
              <button onClick={clearCoupon} className="text-[11px] font-bold uppercase tracking-wider text-rose">Remove</button>
            </div>
          ) : (
            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setErr(await applyCoupon(code.trim().toUpperCase()));
                setBusy(false);
                setCode("");
              }}
            >
              <input className="input py-2.5 text-[14px] uppercase" placeholder="Gift code (FIRSTGIFT)" value={code} onChange={(e) => setCode(e.target.value)} />
              <button className="shrink-0 rounded-xl bg-ink px-4 text-[11px] font-black uppercase tracking-wider text-cream" disabled={busy}>{busy ? "…" : "Apply"}</button>
            </form>
          )}
          {err && <p className="mt-2 text-[12px] font-semibold text-rose-deep">{err}</p>}

          <div className="mt-4 space-y-1.5 rounded-[20px] bg-white/70 p-4 text-[13.5px]">
            <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="font-bold">{inr(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-mint-deep"><span>Discount</span><span className="font-bold">−{inr(discount)}</span></div>}
            <div className="flex justify-between text-ink-soft"><span>Delivery</span><span className="font-bold text-ink">{free ? "FREE" : `from ${inr(charge)}`}</span></div>
            <div className="flex justify-between border-t border-line pt-2 font-display text-[17px] font-semibold"><span>Total</span><span>{inr(after + (free ? 0 : charge))}</span></div>
          </div>

          <Link href="/app/checkout" className="btn-rose mt-4 w-full py-4 text-[12px]">Checkout · wrap it with love</Link>
          <p className="mt-2 pb-4 text-center text-[11px] text-ink-soft">COD & UPI · free delivery above {inr(settings.freeDeliveryAbove)}</p>
        </>
      )}
    </div>
  );
}
