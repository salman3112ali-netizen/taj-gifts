import Link from "next/link";
import type { Settings } from "@/lib/types";
import { Newsletter } from "./newsletter";

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-lav-deep/20 blur-3xl" />
      <div className="wrap relative py-16">
        <Newsletter />
        <div className="mt-14 grid gap-10 border-t border-cream/15 pt-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <p className="font-display text-3xl font-semibold">
              {settings.shopName}
              <span className="text-blush-deep">.</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">
              {settings.tagline}. Small-batch gifting, tied by hand and sent across {settings.state} with a note from our family to yours.
            </p>
            <p className="mt-5 font-script text-2xl text-blush-deep">made with love, from our home to yours</p>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cream/50">Shop</p>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/80">
              <li><Link className="transition hover:text-blush-deep" href="/shop">All hampers</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/shop?occasion=Festive">Festive</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/shop?occasion=Wedding">Wedding</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/shop?occasion=Corporate">Corporate & bulk</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/shop?occasion=Uttarakhand">Pahadi special</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cream/50">Help</p>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/80">
              <li><Link className="transition hover:text-blush-deep" href="/about">Our story</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/contact">Contact & custom hampers</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/contact#faq">FAQs</Link></li>
              <li><Link className="transition hover:text-blush-deep" href="/admin">Store admin</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cream/50">Visit / talk</p>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/80">
              <li>{settings.address}</li>
              <li>{settings.city}, {settings.state} — {settings.pincode}</li>
              <li><a className="transition hover:text-blush-deep" href={`tel:${settings.phone}`}>{settings.phone}</a></li>
              <li><a className="transition hover:text-blush-deep" href={`mailto:${settings.email}`}>{settings.email}</a></li>
              <li>
                <a className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-[11px] font-black uppercase tracking-wider text-ink transition hover:bg-blush" href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">
                  WhatsApp · {settings.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-cream/15 pt-6 text-[12px] text-cream/50 md:flex-row">
          <p>© {new Date().getFullYear()} {settings.shopName}, {settings.city}. All rights reserved.</p>
          <p className="font-script text-lg text-cream/70">UPI: {settings.upiId} · COD available</p>
        </div>
      </div>
    </footer>
  );
}
