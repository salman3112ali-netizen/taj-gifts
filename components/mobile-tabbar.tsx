"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useUser } from "@/lib/use-user";

/** App-style bottom tab bar for phones — thumb-reach navigation, safe-area aware. */
export default function MobileTabBar() {
  const { count, setDrawer, settings } = useCart();
  const { user } = useUser();
  const path = usePathname();
  // pages that own the bottom edge themselves (sticky buy bar / forms / admin)
  if (["/product", "/checkout", "/order", "/admin"].some((p) => path.startsWith(p))) return null;

  const base = "flex flex-col items-center justify-center gap-1 text-[9.5px] font-black uppercase tracking-[0.14em] transition-colors duration-200";
  const on = "text-rose";
  const off = "text-ink-soft/80";

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="grid h-[62px] grid-cols-5">
        <Link href="/" className={`${base} ${path === "/" ? on : off}`} aria-label="Home">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
          </svg>
          Home
        </Link>
        <Link href="/shop" className={`${base} ${path.startsWith("/shop") ? on : off}`} aria-label="Shop hampers">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Z" />
            <path d="M9 10V6a3 3 0 0 1 6 0v4" />
          </svg>
          Shop
        </Link>
        <button onClick={() => setDrawer(true)} className={`${base} ${off}`} aria-label="Open basket">
          <span className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M4 10h16l-1.3 9a2 2 0 0 1-2 1.7H7.3a2 2 0 0 1-2-1.7L4 10Z" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[9px] font-black text-white">
                {count}
              </span>
            )}
          </span>
          Basket
        </button>
        <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className={`${base} ${off}`} aria-label="Chat on WhatsApp">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.1.5.2.6.4 0 .1 0 .7-.2 1.2Z" />
          </svg>
          Chat
        </a>
        <Link href={user ? "/account" : "/login"} className={`${base} ${path.startsWith("/account") || path.startsWith("/login") ? on : off}`} aria-label="Your account">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 5-5.5 8-5.5S18.5 17 20 21" />
          </svg>
          {user ? "Me" : "Login"}
        </Link>
      </div>
    </nav>
  );
}
