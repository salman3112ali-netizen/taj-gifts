"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart, inr, deliveryFor } from "@/lib/cart";
import { itemKey, unitPrice } from "@/lib/types";
import { browserSupabase } from "@/lib/supabase/browser";
import { useUser } from "@/lib/use-user";

type Address = { id: string; label: string; name: string; phone: string; address: string; landmark: string | null; city: string; pincode: string; is_default: boolean };

type Form = {
  name: string; phone: string; email: string; address: string; landmark: string;
  city: string; pincode: string; giftNote: string; giftOccasion: string;
  giftDate: string; senderName: string; surprise: boolean;
};

export default function Checkout() {
  const { items, subtotal, coupon, discount, settings, clear, notify } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const [f, setF] = useState<Form>({ name: "", phone: "", email: "", address: "", landmark: "", city: settings.city, pincode: "", giftNote: "", giftOccasion: "", giftDate: "", senderName: "", surprise: false });
  const [pay, setPay] = useState<"COD" | "UPI">("COD");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState<Address[]>([]);

  // signed-in? prefill profile + saved addresses for one-tap checkout
  useEffect(() => {
    if (!user) return;
    (async () => {
      const sb = browserSupabase();
      const [p, a] = await Promise.all([
        sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        sb.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);
      const list = (a.data as Address[]) ?? [];
      setSaved(list);
      setF((prev) => ({
        ...prev,
        name: p.data?.full_name || prev.name || (user.user_metadata?.full_name as string) || "",
        phone: p.data?.phone || prev.phone || (user.user_metadata?.phone as string) || "",
        email: prev.email || user.email || "",
      }));
      const def = list.find((x) => x.is_default) ?? list[0];
      if (def)
        setF((prev) => ({ ...prev, name: def.name || prev.name, phone: def.phone || prev.phone, address: def.address, landmark: def.landmark || "", city: def.city, pincode: def.pincode }));
    })();
  }, [user]);

  const useAddress = (id: string) => {
    const a = saved.find((x) => x.id === id);
    if (!a) return;
    setF((prev) => ({ ...prev, name: a.name, phone: a.phone, address: a.address, landmark: a.landmark || "", city: a.city, pincode: a.pincode }));
  };

  const afterDiscount = subtotal - discount;
  const { local, charge } = useMemo(() => deliveryFor(settings, f.pincode || "000000", afterDiscount), [settings, f.pincode, afterDiscount]);
  const total = afterDiscount + charge;
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: (e.target as HTMLInputElement).type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  if (items.length === 0 && !busy) {
    return (
      <section className="wrap flex min-h-[60vh] flex-col items-center justify-center gap-5 py-24 text-center">
        <p className="font-script text-3xl text-ink-soft">your basket is empty…</p>
        <h1 className="font-display text-4xl font-medium">Let's fix that, shall we?</h1>
        <Link href="/shop" className="btn-primary">Browse hampers</Link>
      </section>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!/^\d{10}$/.test(f.phone.replace(/\D/g, "").slice(-10))) return setErr("Please enter a valid 10-digit mobile number.");
    if (!/^\d{6}$/.test(f.pincode)) return setErr("Please enter a valid 6-digit pincode.");
    if (pay === "COD" && !settings.codAvailable) return setErr("COD isn't available right now — please choose UPI.");
    setBusy(true);
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
    router.push(`/order/${j.id}?new=1`);
  };

  return (
    <section className="wrap grid gap-12 pb-24 pt-10 lg:grid-cols-[1.35fr_1fr]">
      <form onSubmit={submit}>
        <p className="eyebrow">Almost there</p>
        <h1 className="font-display mt-3 text-5xl font-medium leading-[1.02]">Checkout</h1>
        <p className="mt-2 font-script text-2xl text-ink-soft">two minutes now, a lifetime of “best gift ever” later</p>

        <fieldset className="mt-9">
          <legend className="font-display mb-4 text-xl font-semibold">1 · Who's receiving the joy?</legend>
          {saved.length > 0 && (
            <div className="mb-4">
              <label className="label">Saved address</label>
              <select className="input cursor-pointer" defaultValue="" onChange={(e) => e.target.value && useAddress(e.target.value)}>
                <option value="">Use a new address…</option>
                {saved.map((a) => (
                  <option key={a.id} value={a.id}>{a.label} — {a.address.slice(0, 40)}, {a.city} {a.is_default ? "(default)" : ""}</option>
                ))}
              </select>
            </div>
          )}
          {!user && (
            <p className="mb-4 rounded-xl bg-lav/60 px-4 py-3 text-[13px] font-semibold">
              Have an account? <Link href={`/login?next=/checkout`} className="text-rose-deep underline">Sign in</Link> to checkout with one tap — your addresses & order history come along.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Full name *</label><input className="input" required value={f.name} onChange={set("name")} placeholder="Aisha Sharma" /></div>
            <div><label className="label">Mobile / WhatsApp *</label><input className="input" required inputMode="numeric" value={f.phone} onChange={set("phone")} placeholder="98765 43210" /></div>
            <div className="sm:col-span-2"><label className="label">Email (for the receipt)</label><input className="input" type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" /></div>
            <div className="sm:col-span-2"><label className="label">Address *</label><input className="input" required value={f.address} onChange={set("address")} placeholder="House / street / area" /></div>
            <div><label className="label">Landmark</label><input className="input" value={f.landmark} onChange={set("landmark")} placeholder="Near…" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">City *</label><input className="input" required value={f.city} onChange={set("city")} /></div>
              <div><label className="label">Pincode *</label><input className="input" required inputMode="numeric" maxLength={6} value={f.pincode} onChange={set("pincode")} placeholder="244713" /></div>
            </div>
          </div>
          {f.pincode.length === 6 && (
            <p className={"mt-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold " + (local ? "bg-mint" : "bg-butter")}>
              {local ? `🛵 Lovely — ${f.pincode} is in our hand-delivery zone (${charge === 0 ? "free local delivery" : inr(charge)}).` : `📦 We ship to ${f.pincode} via tracked courier · ${afterDiscount >= settings.freeDeliveryAbove ? "free!" : inr(charge)}`}
            </p>
          )}
        </fieldset>

        <fieldset className="mt-10">
          <legend className="font-display mb-4 text-xl font-semibold">2 · The little touches</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Gift note (we hand-letter it)</label>
              <textarea className="input min-h-[84px] resize-y" value={f.giftNote} onChange={set("giftNote")} placeholder="“Happy anniversary, you two — may the chai never go cold.”" maxLength={220} />
              <p className="mt-1 text-right text-[11px] text-ink-soft">{f.giftNote.length}/220</p>
            </div>
            <div><label className="label">Occasion</label><input className="input" value={f.giftOccasion} onChange={set("giftOccasion")} placeholder="Anniversary, rakhi, sorry…" /></div>
            <div><label className="label">Preferred delivery date</label><input className="input" type="date" value={f.giftDate} onChange={set("giftDate")} /></div>
            <div><label className="label">From (sender name on tag)</label><input className="input" value={f.senderName} onChange={set("senderName")} placeholder="With love, the Kapoors" /></div>
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-ink/12 bg-white/60 px-4 py-3 text-[14px] font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-rose" checked={f.surprise} onChange={set("surprise")} />
              Keep it a surprise — no price inside 🤫
            </label>
          </div>
        </fieldset>

        <fieldset className="mt-10">
          <legend className="font-display mb-4 text-xl font-semibold">3 · Payment</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setPay("COD")} className={"rounded-2xl border-2 p-5 text-left transition " + (pay === "COD" ? "border-rose bg-blush/40" : "border-ink/10 bg-white/60 hover:border-ink/25")}>
              <p className="flex items-center gap-2 font-bold">💵 Cash on delivery {local && <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-black uppercase">local zone</span>}</p>
              <p className="mt-1 text-[13px] text-ink-soft">Pay when the hamper reaches your hands.</p>
            </button>
            <button type="button" onClick={() => setPay("UPI")} className={"rounded-2xl border-2 p-5 text-left transition " + (pay === "UPI" ? "border-rose bg-blush/40" : "border-ink/10 bg-white/60 hover:border-ink/25")}>
              <p className="font-bold">📲 UPI — pay in your own app</p>
              <p className="mt-1 text-[13px] text-ink-soft">{settings.upiId} · GPay/PhonePe/Paytm opens with the exact amount. Auto-verified.</p>
            </button>
          </div>
          {pay === "UPI" && (
            <div className="mt-4 rounded-2xl bg-lav/70 p-5 text-[14px] leading-relaxed">
              <p className="font-bold">After placing the order, tap “Pay with any UPI app” on your order page — {inr(total)} to <span className="rounded bg-white px-2 py-0.5 font-mono">{settings.upiId}</span> ({settings.payeeName}).</p>
              <p className="mt-1 text-ink/70">Everything is pre-filled and verified automatically. No screenshots, no forwarding — your hamper enters the tying queue the second payment lands.</p>
            </div>
          )}
        </fieldset>

        {err && <p className="mt-6 rounded-xl bg-blush px-5 py-3.5 text-sm font-bold text-rose-deep">{err}</p>}
        <button className="btn-rose mt-8 w-full py-4 text-sm" disabled={busy}>
          {busy ? "Tying up your order…" : `Place order · ${inr(total)}`}
        </button>
        <p className="mt-3 text-center text-[12px] text-ink-soft">By ordering you agree to our with-love return policy: damaged? photographed? replaced.</p>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[28px] border border-line bg-white/70 p-7 backdrop-blur">
          <p className="font-display text-xl font-semibold">Your basket</p>
          <ul className="mt-5 space-y-4">
            {items.map((i) => (
              <li key={itemKey(i)} className="flex gap-3.5">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                  <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-black text-cream">{i.qty}</span>
                </div>
                <div className="flex-1 text-[13px]">
                  <p className="font-display text-[15px] font-semibold leading-tight">{i.name}</p>
                  <p className="text-ink-soft">{i.variant ?? "As shown"}{i.addons.length ? ` + ${i.addons.map((a) => a.label).join(", ")}` : ""}</p>
                  <p className="mt-1 font-bold">{inr(unitPrice(i) * i.qty)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><b>{inr(subtotal)}</b></div>
            {coupon && <div className="flex justify-between text-mint-deep"><span>{coupon.code}</span><b>−{inr(discount)}</b></div>}
            <div className="flex justify-between"><span className="text-ink-soft">Delivery {local ? "(local)" : ""}</span><b>{charge === 0 ? "FREE" : inr(charge)}</b></div>
            <div className="flex justify-between border-t border-line pt-3 font-display text-2xl font-semibold"><span>Total</span><span>{inr(total)}</span></div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-wider text-ink-soft">
            <span className="rounded-xl bg-cream-deep px-2 py-2.5">🔒 Secure checkout</span>
            <span className="rounded-xl bg-cream-deep px-2 py-2.5">OTP-verified delivery</span>
            <span className="rounded-xl bg-cream-deep px-2 py-2.5">7-day replacement</span>
          </div>
        </div>
      </aside>
    </section>
  );
}
