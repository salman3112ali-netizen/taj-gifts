"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const TABS = [
  { href: "/app", label: "Home", icon: (a: boolean) => <svg width="21" height="21" viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg> },
  { href: "/app/shop", label: "Shop", icon: (a: boolean) => <svg width="21" height="21" viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></svg> },
  { href: "/app/search", label: "Search", icon: (a: boolean) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.4 : 1.8}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg> },
  { href: "/app/cart", label: "Cart", icon: (a: boolean) => <svg width="21" height="21" viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M4 10h16l-1.3 9a2 2 0 0 1-2 1.7H7.3a2 2 0 0 1-2-1.7L4 10Z" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg> },
  { href: "/app/account", label: "You", icon: (a: boolean) => <svg width="21" height="21" viewBox="0 0 24 24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5.5 8-5.5S18.5 17 20 21" /></svg> },
];

export default function AppTabBar() {
  const path = usePathname();
  const { count } = useCart();
  return (
    <nav aria-label="App navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid h-[60px] max-w-[560px] grid-cols-5">
        {TABS.map((t) => {
          const active = t.href === "/app" ? path === "/app" : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={"relative flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-black uppercase tracking-[0.12em] transition-colors " + (active ? "text-rose" : "text-ink-soft/75")} aria-label={t.label}>
              <span className="relative">
                {t.icon(active)}
                {t.href === "/app/cart" && count > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-black text-white">{count}</span>
                )}
              </span>
              {t.label}
              {active && <span className="absolute -top-[1px] h-[3px] w-8 rounded-full bg-rose" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
