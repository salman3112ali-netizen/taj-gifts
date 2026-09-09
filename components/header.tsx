"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const MotionLink = motion(Link);
import { useCart } from "@/lib/cart";
import UserMenu from "./user-menu";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop Hampers" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const { count, setDrawer, settings } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => setMenu(false), [pathname]);

  return (
    <>
      <div className="relative z-40 bg-ink py-2 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-cream/90">
        {settings.announcement}
      </div>
      <header
        className={
          "sticky top-0 z-40 transition-all duration-500 " +
          (scrolled ? "bg-cream/85 shadow-[0_10px_40px_-18px_rgba(62,54,44,0.28)] backdrop-blur-xl" : "bg-transparent")
        }
      >
        <div className={"wrap flex items-center justify-between transition-all duration-500 " + (scrolled ? "py-3" : "py-5")}>
          <Link href="/" className="group flex items-baseline gap-2" data-cursor>
            <span className="font-display text-[26px] font-semibold leading-none tracking-tight">
              {settings.shopName.split(" ")[0]}
              <span className="text-rose">.</span>
            </span>
            <span className="hidden font-script text-lg text-ink-soft sm:inline">{settings.shopName.split(" ").slice(1).join(" ") || "gifts"}</span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={
                  "relative text-[12.5px] font-extrabold uppercase tracking-[0.2em] transition-colors duration-300 hover:text-rose " +
                  (pathname === n.href ? "text-rose" : "text-ink/75")
                }
              >
                {n.label}
                {pathname === n.href && <motion.span layoutId="navdot" className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-rose" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <UserMenu />
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-ink/15 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink/80 transition-all hover:border-mint-deep hover:bg-mint hover:text-ink sm:inline-flex"
            >
              WhatsApp us
            </a>
            <button
              onClick={() => setDrawer(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-cream transition-all hover:bg-rose-deep"
              aria-label="Open cart"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L6 7Z" />
                <path d="M9 10V6a3 3 0 0 1 6 0v4" />
              </svg>
              Basket
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[10px] font-black text-white">{count}</span>
            </button>
            <button onClick={() => setMenu(true)} className="md:hidden" aria-label="Menu">
              <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
                <path d="M3 7h18M3 12h13M3 17h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-cream md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-5">
              <span className="font-display text-2xl font-semibold">
                {settings.shopName}
                <span className="text-rose">.</span>
              </span>
              <button onClick={() => setMenu(false)} aria-label="Close menu">
                <svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-2 px-7">
              {NAV.map((n, i) => (
                <MotionLink
                  key={n.href}
                  href={n.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 * i + 0.1 }}
                  className="font-display text-[38px] font-medium leading-tight text-ink"
                >
                  {n.label}
                </MotionLink>
              ))}
            </nav>
            <p className="px-7 pb-10 font-script text-xl text-ink-soft">{settings.tagline}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
