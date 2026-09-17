"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, inr, deliveryFor } from "@/lib/cart";

type Form = { name: string; phone: string; email: string; address: string; landmark: string; city: string; pincode: string; giftNote: string; giftOccasion: string; giftDate: string; senderName: string; surprise: boolean };

export default function AppCheckout() {
  const { items, subtotal, coupon, discount, settings, clear, notify } = useCart();
  const router = useRouter();
  const [f, setF] = useState<Form>({ name: "", phone: "", email: "", address: "", landmark: "", city: settings.city, pincode: "", giftNote: "", giftOccasion: "", giftDate: "", senderName: "", surprise: false });
  const [pay, setPay] = useState<"COD" | "UPI">("COD");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const after = subtotal - discount;
  const { local, charge } = deliveryFor(settings, f.pincode, after);
  const free = after >= settings.freeDeliveryAbove;
  const total = after + (free ? 0 : local ? settings.localDeliveryCharge : charge);

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) { setErr("Your basket is empty."); return; }
    setBusy(true); setErr(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ slug: i.slug, qty: i.qty, variant: i.variant, addons: i.addons.map((a) => a.label) })),
        customer: f,
        coupon: coupon?.code ?? null,
        payment_method: pay,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!j.ok) { setErr(j.error || "Something went wrong — please try again."); return; }
    clear();
    notify("Order placed! We're tying your hamper 🎀");
    router.push(`/app/order/${j.id}?new=1`);
  };

  return (
    <form onSubmit={place} className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <h1 className="font-display text-[26px] font-medium leading-none">Checkout</h1>

      <fieldset className="mt-5">
        <legend className="label">1 · Who's gifting</legend>
        <div className="space-y-2.5">
          <input className="input" placeholder="Full name *" value={f.name} onChange={set("name")} required />
          <input className="input" placeholder="Mobile number *" inputMode="numeric" value={f.phone} onChange={set("phone")} required />
          <input className="input" placeholder="Email (for updates)" type="email" value={f.email} onChange={set("email")} />
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">2 · Deliver to</legend>
        <div className="space-y-2.5">
          <textarea className="input min-h-[76px]" placeholder="House / street / area *" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required />
          <input className="input" placeholder="Landmark (optional)" value={f.landmark} onChange={set("landmark")} />
          <div className="grid grid-cols-2 gap-2.5">
            <input className="input" placeholder="City *" value={f.city} onChange={set("city")} required />
            <input className="input" placeholder="Pincode *" inputMode="numeric" maxLength={6} value={f.pincode} onChange={set("pincode")} required />
          </div>
          {f.pincode.length === 6 && local && <p className="rounded-xl bg-mint px-3 py-2 text-[12px] font-bold">🚚 Same-day hand delivery zone — free local delivery!</p>}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">3 · Gift touches (optional)</legend>
        <div className="space-y-2.5">
          <input className="input" placeholder="Occasion — Diwali, wedding, birthday…" value={f.giftOccasion} onChange={set("giftOccasion")} />
          <input className="input" placeholder="Deliver by (date)" onFocus={(e) => (e.target.type = "date")} onBlur={(e) => (e.target.type = "text")} value={f.giftDate} onChange={set("giftDate")} />
          <input className="input" placeholder="Tag note — we handwrite it" value={f.giftNote} onChange={set("giftNote")} />
          <input className="input" placeholder="From (sender name on tag)" value={f.senderName} onChange={set("senderName")} />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/12 bg-white/60 px-4 py-3 text-[13.5px] font-semibold">
            <input type="checkbox" className="h-4 w-4 accent-rose" checked={f.surprise} onChange={(e) => setF({ ...f, surprise: e.target.checked })} />
            Keep it a surprise — no prices inside 🤫
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">4 · Payment</legend>
        <div className="grid gap-2.5">
          <button type="button" onClick={() => setPay("COD")} className={"rounded-2xl border-2 p-4 text-left transition " + (pay === "COD" ? "border-rose bg-blush/40" : "border-ink/10 bg-white/60")}>
            <p className="text-[14px] font-bold">💵 Cash on delivery</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">Pay when the hamper reaches your hands.</p>
          </button>
          <button type="button" onClick={() => setPay("UPI")} className={"rounded-2xl border-2 p-4 text-left transition " + (pay === "UPI" ? "border-rose bg-blush/40" : "border-ink/10 bg-white/60")}>
            <p className="text-[14px] font-bold">📲 UPI transfer</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">{settings.upiId} · confirm on WhatsApp in minutes.</p>
          </button>
        </div>
      </fieldset>

      <div className="mt-6 space-y-1.5 rounded-[20px] bg-white/70 p-4 text-[13.5px]">
        <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="font-bold">{inr(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-mint-deep"><span>Coupon {coupon?.code}</span><span className="font-bold">−{inr(discount)}</span></div>}
        <div className="flex justify-between text-ink-soft"><span>Delivery</span><span className="font-bold text-ink">{free ? "FREE" : inr(local ? settings.localDeliveryCharge : charge)}</span></div>
        <div className="flex justify-between border-t border-line pt-2 font-display text-[17px] font-semibold"><span>To pay</span><span>{inr(total)}</span></div>
      </div>

      {err && <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-[13px] font-bold text-rose-deep">{err}</p>}
      <button className="btn-rose mt-4 w-full py-4 text-[12px]" disabled={busy}>
        {busy ? "Tying up your order…" : `Place order · ${inr(total)}`}
      </button>
      <p className="mt-2 pb-6 text-center text-[11px] text-ink-soft">By ordering you agree to our with-love terms 🎀</p>
    </form>
  );
}
