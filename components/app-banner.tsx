"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Flipkart/Amazon-style smart app banner: phones only, dismissible, remembers the choice. */
export default function AppBanner() {
  const [show, setShow] = useState(false);
  const path = usePathname();

  useEffect(() => {
    try {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const dismissed = localStorage.getItem("taj-app-banner") === "1";
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      setShow(coarse && !dismissed && !standalone);
    } catch {
      setShow(false);
    }
  }, [path]);

  if (!show || path.startsWith("/app") || path.startsWith("/download")) return null;

  return (
    <div className="relative z-30 border-b border-line bg-blush px-4 py-2.5 md:hidden">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-rose text-[16px] text-cream">🎀</span>
        <p className="flex-1 text-[12px] font-bold leading-snug">
          Get the Taj Gifts app — one tap, faster, free.
        </p>
        <Link href="/download" className="shrink-0 rounded-full bg-ink px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-cream">
          View
        </Link>
        <button
          aria-label="Dismiss app banner"
          className="shrink-0 px-1 text-ink-soft"
          onClick={() => {
            try { localStorage.setItem("taj-app-banner", "1"); } catch { /* noop */ }
            setShow(false);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
