"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@/lib/use-user";
import { browserSupabase } from "@/lib/supabase/browser";

export default function UserMenu() {
  const { user, loading } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (loading) return <div className="h-9 w-9 rounded-full bg-cream-deep" />;

  if (!user)
    return (
      <Link
        href="/login"
        className="hidden items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink/80 transition-all hover:border-rose hover:text-rose sm:inline-flex"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
        </svg>
        Sign in
      </Link>
    );

  const initial = (user.user_metadata?.full_name || user.email || "?").trim()[0]?.toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-full bg-lav font-display text-[15px] font-bold text-ink ring-2 ring-transparent transition hover:ring-rose"
        aria-label="Account menu"
      >
        {initial}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-line bg-cream shadow-xl"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold">{user.user_metadata?.full_name || "Friend"}</p>
              <p className="truncate text-[12px] text-ink-soft">{user.email}</p>
            </div>
            {[
              { href: "/account", label: "My account" },
              { href: "/account?tab=orders", label: "Order history" },
              { href: "/account?tab=addresses", label: "Saved addresses" },
            ].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[13px] font-semibold transition hover:bg-blush/50">
                {l.label}
              </Link>
            ))}
            <button
              className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-rose-deep transition hover:bg-blush/50"
              onClick={async () => {
                await browserSupabase().auth.signOut();
                setOpen(false);
                router.push("/");
                router.refresh();
              }}
            >
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
