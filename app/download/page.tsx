import Link from "next/link";
import type { Metadata } from "next";
import InstallButton from "@/components/app/install";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";
const APK_URL =
  process.env.NEXT_PUBLIC_APK_URL || BASE + "/tajgifts.apk";

export const metadata: Metadata = {
  title: "Download the Taj Gifts app — free",
  description:
    "Install the Taj Gifts mobile app free: browse hampers, search, track orders, one-tap WhatsApp. Android APK + instant install for iPhone & Android.",
  alternates: { canonical: BASE + "/download" },
  openGraph: { title: "Taj Gifts, in your pocket — free app", url: BASE + "/download" },
};

export default function DownloadPage() {
  return (
    <section className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute -left-32 top-0 h-[380px] w-[380px] rounded-full bg-blush/70 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 top-40 h-[320px] w-[320px] rounded-full bg-lav/70 blur-[100px]" />

      <div className="wrap relative pt-8">
        <div className="flex items-center justify-between">
          <p className="font-display text-[26px] font-semibold leading-none">
            Taj<span className="text-rose">.</span>
            <span className="ml-2 font-script text-lg text-ink-soft">gifts</span>
          </p>
          <Link href="/" className="text-[11px] font-black uppercase tracking-[0.16em] text-ink-soft hover:text-rose">
            Continue to website →
          </Link>
        </div>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">the app · free forever</p>
            <h1 className="font-display mt-4 text-[40px] font-medium leading-[1.03] md:text-[56px]">
              Taj Gifts, <span className="italic text-rose">in your pocket.</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">
              The full boutique as a native-feeling app: swipeable hampers, instant search, one-tap reorder,
              live order tracking and WhatsApp to the studio — installed in 30 seconds, no app-store account,
              no cost, ever.
            </p>

            <div className="mt-8 max-w-md space-y-3">
              <InstallButton />
              <a href={APK_URL} className="btn-ghost w-full justify-center py-4 text-[12px]" download>
                🤖 Download Android APK (free)
              </a>
              <p className="text-center text-[12px] text-ink-soft">
                APK = the same app as a file for any Android phone · or use the instant install above (recommended)
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(BASE + "/download")}`}
                alt="QR code to download the Taj Gifts app"
                width={110}
                height={110}
                className="rounded-2xl border border-ink/10 bg-white p-2"
              />
              <p className="max-w-[220px] text-[13px] leading-relaxed text-ink-soft">
                <b className="text-ink">Share the app:</b> point any phone at this QR — it lands here and installs in two taps.
              </p>
            </div>
          </div>

          {/* phone mockup */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            <div className="rounded-[42px] border-[10px] border-ink bg-ink shadow-[0_50px_100px_-40px_rgba(62,54,44,0.6)]">
              <div className="overflow-hidden rounded-[32px] bg-cream">
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <p className="font-display text-[17px] font-semibold">Taj<span className="text-rose">.</span></p>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-ink-soft">Kashipur</span>
                </div>
                <div className="px-4">
                  <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-[10px] text-ink-soft/60">🔍 Search hampers…</div>
                </div>
                <div className="px-4 pt-3">
                  <div className="rounded-2xl bg-blush p-4">
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-rose-deep">hand-tied in kashipur</p>
                    <p className="font-display mt-1 text-[15px] font-medium leading-tight">Gifting, wrapped <span className="italic text-rose">in softness.</span></p>
                    <span className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-[8px] font-black uppercase tracking-widest text-cream">Shop hampers</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 pt-3">
                  {[ "bg-lav", "bg-mint", "bg-butter", "bg-peach" ].map((c, i) => (
                    <div key={i} className={`h-20 rounded-xl ${c}`} />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-5 border-t border-line bg-cream/95 py-2 text-center text-[7px] font-black uppercase tracking-widest text-ink-soft">
                  <span className="text-rose">Home</span><span>Shop</span><span>Search</span><span>Cart</span><span>You</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 top-16 rotate-6 rounded-2xl bg-butter px-4 py-2 shadow-lg">
              <p className="font-script text-lg text-ink">4 MB · installs in 30 s</p>
            </div>
          </div>
        </div>

        {/* features */}
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Native feel", d: "Bottom tab bar, swipe galleries, full-screen — indistinguishable from a store app.", bg: "bg-blush" },
            { t: "Your account", d: "Login once (Google or email), orders sync on every device.", bg: "bg-lav" },
            { t: "Live tracking", d: "Pending → tied → shipped → delivered, with the artist's sketch of your hamper.", bg: "bg-mint" },
            { t: "Works offline-ish", d: "Service-worker shell opens instantly even on patchy pahadi network.", bg: "bg-butter" },
          ].map((f) => (
            <div key={f.t} className={`rounded-[26px] ${f.bg} p-6`}>
              <p className="font-display text-xl font-semibold">{f.t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/70">{f.d}</p>
            </div>
          ))}
        </div>

        {/* iPhone note */}
        <div className="mt-10 rounded-[26px] border border-ink/10 bg-white/70 p-6 text-[14px] leading-relaxed">
          <p className="font-bold">🍏 iPhone owners:</p>
          <p className="mt-1 text-ink-soft">
            Safari → open <b className="text-ink">{BASE}/app</b> → Share ▢ → <b className="text-ink">Add to Home Screen</b>.
            That's the whole install — Apple charges developers $99/year for store apps; this route keeps the app free for everyone.
          </p>
        </div>

        <p className="mt-14 text-center">
          <Link href="/" className="btn-primary">Continue to the website →</Link>
        </p>
      </div>
    </section>
  );
}
