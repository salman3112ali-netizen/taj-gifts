"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, inr, deliveryFor } from "@/lib/cart";
import { useUser } from "@/lib/use-user";

type Form = { name: string; phone: string; email: string; address: string; landmark: string; city: string; pincode: string; giftNote: string; giftOccasion: string; giftDate: string; senderName: string; surprise: boolean };
function opaqueClientId(prefix: string) {
  try { return `${prefix}_${globalThis.crypto.randomUUID().replace(/-/g, "")}`; }
  catch { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`; }
}

export default function AppCheckout() {
  const { items, subtotal, coupon, discount, settings, clear, notify } = useCart();
  const { user, loading } = useUser();
  const router = useRouter();
  const [f, setF] = useState<Form>({ name: "", phone: "", email: "", address: "", landmark: "", city: settings.city, pincode: "", giftNote: "", giftOccasion: "", giftDate: "", senderName: "", surprise: false });
  const [pay, setPay] = useState<"COD" | "UPI">("COD");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const requestId = useRef(opaqueClientId("order"));
  const trackingToken = useRef(opaqueClientId("track"));
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const after = subtotal - discount;
  const { local, charge } = deliveryFor(settings, f.pincode, after);
  const free = after >= settings.freeDeliveryAbove;
  const total = after + (free ? 0 : local ? settings.localDeliveryCharge : charge);

  useEffect(() => {
    if (f.pincode.length === 6 && !local && pay === "COD") setPay("UPI");
  }, [f.pincode.length, local, pay]);
  useEffect(() => {
    if (user?.email) setF((current) => current.email ? current : { ...current, email: user.email || "" });
  }, [user?.email]);

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push("/login?next=/app/checkout"); return; }
    if (!items.length) { setErr("Your basket is empty."); return; }
    if (pay === "COD" && !local) { setErr("Cash on delivery is available in our local delivery zone. Please choose UPI for this pincode."); return; }
    setBusy(true); setErr(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ slug: i.slug, qty: i.qty, variant: i.variant, addons: i.addons.map((a) => a.label) })),
        customer: f,
        coupon: coupon?.code ?? null,
        payment_method: pay,
        client_request_id: requestId.current,
        tracking_token: trackingToken.current,
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!j.ok) { setErr(j.error || "Something went wrong — please try again."); return; }
    clear();
    notify("Order placed! We're tying your hamper 🎀");
    router.push(`/app/order/${j.id}?new=1&t=${encodeURIComponent(j.trackingToken || trackingToken.current)}`);
  };

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center px-4 text-center"><p className="font-script text-2xl text-ink-soft">checking your account…</p></div>;
  }
  if (!user) {
    return (
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="mt-10 rounded-[26px] border border-line bg-white/75 p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#a2505f" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5.5 8-5.5S18.5 17 20 21" /></svg>
          </div>
          <p className="font-display mt-4 text-[22px] font-medium">Your account keeps this gift safe.</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">Sign in or create an account before placing an order. Your basket stays saved on this device.</p>
          <Link href="/login?next=/app/checkout" className="btn-primary mt-5 w-full justify-center py-3.5 text-[11px]">Sign in to checkout</Link>
          <Link href="/signup?next=/app/checkout" className="btn-ghost mt-2 w-full justify-center py-3.5 text-[11px]">Create an account</Link>
          <p className="mt-3 text-[11px] text-ink-soft">Guest orders are not available.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={place} className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <h1 className="font-display text-[26px] font-medium leading-none">Checkout</h1>

      <fieldset className="mt-5">
        <legend className="label">1 · Who's gifting</legend>
        <div className="space-y-2.5">
          <input className="input" placeholder="Full name *" value={f.name} onChange={set("name")} required />
          <input className="input" placeholder="Mobile number *" inputMode="numeric" value={f.phone} onChange={set("phone")} required />
          <input className="input bg-cream-deep/40" placeholder="Account email" type="email" value={user.email || f.email} readOnly aria-readonly="true" />
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
          {f.pincode.length === 6 && local && <p className="rounded-xl bg-mint px-3 py-2 text-[12px] font-medium">🚚 Local hand-delivery availability confirmed. The delivery amount is shown below.</p>}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">3 · Gift touches (optional)</legend>
        <div className="space-y-2.5">
          <input className="input" placeholder="Occasion — Diwali, wedding, birthday…" value={f.giftOccasion} onChange={set("giftOccasion")} />
          <input className="input" placeholder="Deliver by (date)" onFocus={(e) => (e.target.type = "date")} onBlur={(e) => (e.target.type = "text")} value={f.giftDate} onChange={set("giftDate")} />
          <input className="input" placeholder="Tag note — we handwrite it" value={f.giftNote} onChange={set("giftNote")} />
          <input className="input" placeholder="From (sender name on tag)" value={f.senderName} onChange={set("senderName")} />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/12 bg-white/60 px-4 py-3 text-[13.5px] font-medium">
            <input type="checkbox" className="h-4 w-4 accent-rose" checked={f.surprise} onChange={(e) => setF({ ...f, surprise: e.target.checked })} />
            Keep it a surprise — no prices inside 🤫
          </label>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="label">4 · Payment</legend>
        <div className="grid gap-2.5">
          <button type="button" disabled={!local || !settings.codAvailable} onClick={() => setPay("COD")} className={"rounded-2xl border-2 p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 " + (pay === "COD" ? "border-rose bg-blush/40" : "border-ink/10 bg-white/60")}>
            <p className="text-[14px] font-medium">💵 Cash on delivery</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">{local && settings.codAvailable ? "Pay when the hamper reaches your hands." : "Available for local hand delivery."}</p>
          </button>
          <button type="button" onClick={() => setPay("UPI")} className={"rounded-2xl border-2 p-4 text-left transition " + (pay === "UPI" ? "border-rose bg-blush/40" : "border-ink/10 bg-white/60")}>
            <p className="text-[14px] font-medium">📲 UPI transfer</p>
            <p className="mt-0.5 text-[12px] text-ink-soft">{settings.upiId} · your account keeps the order visible while payment is checked.</p>
          </button>
        </div>
      </fieldset>

      <div className="mt-6 space-y-1.5 rounded-[20px] bg-white/70 p-4 text-[13.5px]">
        <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="font-medium">{inr(subtotal)}</span></div>
        {discount > 0 && <div className="flex justify-between text-mint-deep"><span>Coupon {coupon?.code}</span><span className="font-medium">−{inr(discount)}</span></div>}
        <div className="flex justify-between text-ink-soft"><span>Delivery</span><span className="font-medium text-ink">{free ? "FREE" : inr(local ? settings.localDeliveryCharge : charge)}</span></div>
        <div className="flex justify-between border-t border-line pt-2 font-display text-[17px] font-medium"><span>To pay</span><span>{inr(total)}</span></div>
      </div>

      {err && <p className="mt-4 rounded-xl bg-blush px-4 py-3 text-[13px] font-medium text-rose-deep">{err}</p>}
      <button className="btn-rose mt-4 w-full py-4 text-[12px]" disabled={busy}>
        {busy ? "Tying up your order…" : `Place order · ${inr(total)}`}
      </button>
      <p className="mt-2 pb-6 text-center text-[11px] text-ink-soft">By ordering you agree to our with-love terms 🎀</p>
    </form>
  );
}
