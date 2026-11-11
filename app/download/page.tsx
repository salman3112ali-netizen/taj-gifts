import Link from "next/link";
import type { Metadata } from "next";
import InstallButton from "@/components/app/install";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";

const APK = {
  version: "1.1.0",
  build: "2",
  size: "13.0 MB",
  file: "/app/tajgifts-1.1.0.apk",
  sha256: "04909abf8a0df44e1b547a5a22a41108df0fa8c170c3f162d2d1bc986f72ceb4",
};

export const metadata: Metadata = {
  title: "Taj Gifts on your phone",
  description:
    "Download the Taj Gifts Android app to browse hampers, manage your account and follow private order tracking. iPhone owners can add the site to the home screen.",
  alternates: { canonical: BASE + "/download" },
  openGraph: { title: "Taj Gifts on your phone", url: BASE + "/download" },
};

export default function DownloadPage() {
  return (
    <section className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute -left-32 top-0 h-[380px] w-[380px] rounded-full bg-blush/70 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 top-40 h-[320px] w-[320px] rounded-full bg-lav/70 blur-[100px]" />

      <div className="wrap relative pt-8">
        <div className="flex items-center justify-between">
          <p className="font-display text-[26px] font-medium leading-none">
            Taj<span className="text-rose">.</span>
            <span className="ml-2 font-script text-lg text-ink-soft">gifts</span>
          </p>
          <Link href="/" className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft hover:text-rose">
            Continue to website →
          </Link>
        </div>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow">mobile access</p>
            <h1 className="font-display mt-4 text-[40px] font-medium leading-[1.03] md:text-[56px]">
              Taj Gifts, <span className="italic text-rose">on your phone.</span>
            </h1>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-ink-soft">
              Browse hampers, keep your address book, follow private order tracking and manage your account — in the Taj Gifts Android app, hand-built for this studio.
            </p>

            <div className="mt-8 max-w-md space-y-3">
              <a
                href={APK.file}
                download
                className="btn-primary flex w-full items-center justify-center gap-2"
              >
                Download the Android app
              </a>
              <p className="text-center text-[12px] text-ink-soft">
                Version {APK.version} · {APK.size} · Android 7.0+
              </p>
              <InstallButton />
              <div className="rounded-2xl border border-ink/12 bg-white/70 px-4 py-3 text-[12px] leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">Before you install:</span> Android may warn that this app
                comes from outside the Play Store. That is expected for a direct download — tap
                <b className="text-ink"> More details → Install anyway</b>.
                Every order still needs a Taj Gifts account, and payment is only confirmed on our server.
              </div>
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
                <b className="text-ink">Share Taj Gifts:</b> point any phone at this QR to open this mobile-access page.
              </p>
            </div>
          </div>

          {/* phone mockup */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            <div className="rounded-[42px] border-[10px] border-ink bg-ink shadow-[0_50px_100px_-40px_rgba(62,54,44,0.6)]">
              <div className="overflow-hidden rounded-[32px] bg-cream">
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <p className="font-display text-[17px] font-medium">Taj<span className="text-rose">.</span></p>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[8px] font-medium uppercase tracking-widest text-ink-soft">Kashipur</span>
                </div>
                <div className="px-4">
                  <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-3 py-2 text-[10px] text-ink-soft/60">🔍 Search hampers…</div>
                </div>
                <div className="px-4 pt-3">
                  <div className="rounded-2xl bg-blush p-4">
                    <p className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose-deep">hand-tied in kashipur</p>
                    <p className="font-display mt-1 text-[15px] font-medium leading-tight">Gifting, wrapped <span className="italic text-rose">in softness.</span></p>
                    <span className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-[8px] font-medium uppercase tracking-widest text-cream">Shop hampers</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 pt-3">
                  {[ "bg-lav", "bg-mint", "bg-butter", "bg-peach" ].map((c, i) => (
                    <div key={i} className={`h-20 rounded-xl ${c}`} />
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-5 border-t border-line bg-cream/95 py-2 text-center text-[7px] font-medium uppercase tracking-widest text-ink-soft">
                  <span className="text-rose">Home</span><span>Shop</span><span>Search</span><span>Cart</span><span>You</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 top-16 rotate-6 rounded-2xl bg-butter px-4 py-2 shadow-lg">
              <p className="font-script text-lg text-ink">add to home screen</p>
            </div>
          </div>
        </div>

        {/* features */}
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Home-screen access", d: "Open Taj Gifts from your phone’s home screen in a focused browser experience.", bg: "bg-blush" },
            { t: "Your account", d: "Sign in to keep your address and eligible order history in one place.", bg: "bg-lav" },
            { t: "Private tracking", d: "Signed-in customers can view their order status and tracking information.", bg: "bg-mint" },
            { t: "Browser updates", d: "The home-screen web app loads the current deployed Taj Gifts experience.", bg: "bg-butter" },
          ].map((f) => (
            <div key={f.t} className={`rounded-[26px] ${f.bg} p-6`}>
              <p className="font-display text-xl font-medium">{f.t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink/70">{f.d}</p>
            </div>
          ))}
        </div>

        {/* install steps */}
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { n: "1", t: "Download the file", d: "Tap the download button above. The APK is about 13 MB." },
            { n: "2", t: "Allow this one install", d: "Android asks once for permission to install from your browser. After installing you can switch it back off." },
            { n: "3", t: "Sign in to your account", d: "Use the same email and password as the website — your orders, addresses and wishlist appear in the app." },
          ].map((step) => (
            <div key={step.n} className="rounded-[26px] border border-ink/10 bg-white/70 p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-cream">{step.n}</span>
              <p className="mt-3 font-display text-lg font-medium">{step.t}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink/70">{step.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[26px] border border-ink/10 bg-white/50 p-5 text-[12px] leading-relaxed text-ink-soft">
          <span className="font-medium text-ink">Checking the download?</span> SHA-256 of this build is{" "}
          <code className="break-all font-mono text-[11px]">{APK.sha256}</code>
        </div>

        {/* iPhone note */}
        <div className="mt-10 rounded-[26px] border border-ink/10 bg-white/70 p-6 text-[14px] leading-relaxed">
          <p className="font-medium">🍏 iPhone owners:</p>
          <p className="mt-1 text-ink-soft">
            Safari → open <b className="text-ink">{BASE}/app</b> → Share ▢ → <b className="text-ink">Add to Home Screen</b>.
            This creates a convenient shortcut to the Taj Gifts web app.
          </p>
        </div>

        <p className="mt-14 text-center">
          <Link href="/" className="btn-primary">Continue to the website →</Link>
        </p>
      </div>
    </section>
  );
}
