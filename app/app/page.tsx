import Link from "next/link";
import { getActiveCoupons, getProducts, getSettings, inr } from "@/lib/store";
import AppProductCard from "@/components/app/product-card";

export default async function AppHome() {
  const [products, settings, coupons] = await Promise.all([getProducts(), getSettings(), getActiveCoupons()]);
  const promo = coupons.find((coupon) => coupon.code === "FIRSTGIFT") ?? coupons[0] ?? null;
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const occasions = [...new Set(products.map((p) => p.occasion))];

  return (
    <>
      {/* app header */}
      <header className="sticky top-0 z-30 bg-cream/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-[22px] font-medium leading-none">
            Taj<span className="text-rose">.</span>
            <span className="ml-2 font-script text-base text-ink-soft">gifts</span>
          </p>
          <span className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-medium text-ink-soft">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
            {settings.city}
          </span>
        </div>
        <Link href="/app/search" className="mt-3 flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-[14px] text-ink-soft/70 active:scale-[0.99]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          Search hampers, occasions…
        </Link>
      </header>

      {/* hero banner */}
      <section className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-[26px] bg-blush p-6">
          <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-rose-deep">hand-tied in {settings.city}</p>
          <h1 className="font-display mt-2 max-w-[220px] text-[26px] font-medium leading-[1.08]">
            Gifting, wrapped <span className="italic text-rose">in softness.</span>
          </h1>
          <p className="mt-2 max-w-[240px] text-[12.5px] leading-relaxed text-ink/70">Festive boxes, wedding trays & pahadi specials — tied by hand, delivered with love.</p>
          <Link href="/app/shop" className="btn-primary mt-4 px-6 py-3 text-[11px]">Shop hampers</Link>
        </div>
      </section>

      {/* occasions rail */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="font-display text-[17px] font-medium">Shop by occasion</h2>
          <Link href="/app/shop" className="text-[11px] font-medium uppercase tracking-[0.14em] text-rose">All</Link>
        </div>
        <div className="hide-scroll mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {occasions.map((o, i) => (
            <Link key={o} href={`/app/shop?occasion=${encodeURIComponent(o)}`} className={`shrink-0 rounded-full px-4 py-2.5 text-[12px] font-medium active:scale-95 ${["bg-blush", "bg-lav", "bg-mint", "bg-butter", "bg-peach"][i % 5]}`}>
              {o}
            </Link>
          ))}
        </div>
      </section>

      {/* featured carousel */}
      <section className="mt-6">
        <div className="flex items-center justify-between px-4">
          <h2 className="font-display text-[17px] font-medium">Featured hampers</h2>
        </div>
        <div className="hide-scroll mt-3 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2">
          {featured.map((p) => (
            <div key={p.id} className="w-[46%] shrink-0 snap-start">
              <AppProductCard p={p} />
            </div>
          ))}
        </div>
      </section>

      {/* offer strip — rendered only from an active live coupon */}
      {promo && (
        <section className="px-4 pt-3">
          <div className="flex items-center gap-3 rounded-[20px] bg-mint p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/80 text-[16px]">🎁</span>
            <p className="text-[12.5px] font-medium leading-snug">
              Use code <b className="rounded bg-white px-1.5 py-0.5 font-mono">{promo.code}</b> — {promo.type === "percent" ? `${promo.value}% off` : `${inr(promo.value)} off`}{promo.min_order > 0 ? ` orders of ${inr(promo.min_order)} or more` : ""}. Delivery is calculated at checkout.
            </p>
          </div>
        </section>
      )}

      {/* grid */}
      <section className="mt-6 px-4">
        <h2 className="font-display text-[17px] font-medium">All hampers</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-3.5 gap-y-6">
          {products.slice(0, 6).map((p) => <AppProductCard key={p.id} p={p} />)}
        </div>
        <Link href="/app/shop" className="btn-ghost mt-5 w-full justify-center py-3.5 text-[11px]">See all {products.length} hampers</Link>
      </section>

      <p className="px-4 pb-6 pt-8 text-center font-script text-lg text-ink-soft">tied by hand in the foothills 🎀</p>
    </>
  );
}
