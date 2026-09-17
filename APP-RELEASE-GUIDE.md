# Taj Gifts App — Release & Free Distribution Guide

Your "app" is a **PWA** (progressive web app): the `/app` section of the site behaves as a
native app (bottom tab bar, full-screen standalone window, home-screen icon, offline
shell via service worker) and installs on any phone **for free, forever, with no store
account and no fees**. This guide covers testing, the free Android APK for direct
download, iPhone installs, and the optional paid Play Store route later.

---

## 1) What shipped

| Piece | Where |
|---|---|
| App screens (Home, Shop, Search, Cart, You, Product, Checkout, Order tracking) | `/app/*` |
| App shell: bottom tab bar, safe-area, standalone display | `app/app/layout.tsx`, `components/app/tabbar.tsx` |
| Install prompt button + manual steps | `components/app/install.tsx` |
| Service worker (offline shell, cache) | `public/sw.js` + `components/sw-register.tsx` (prod only) |
| Manifest (icon, splash color, shortcuts, start_url `/app`) | `app/manifest.ts` |
| Download landing (install + APK + QR + "continue to website") | `/download` |
| Smart app banner on the website (phones, dismissible) | `components/app-banner.tsx` |

SEO safety: `/app` is robots-disallowed (no duplicate content); `/download` IS indexed.

## 2) Test the install (after you push)

- **Android/Chrome:** open `https://tajgifts.netlify.app/app` → menu ⋮ → **Install app** →
  it lands on the home screen with the Taj icon, opens full-screen.
- **iPhone/Safari:** open `/app` → Share ▢ → **Add to Home Screen**.
- The smart banner on the main site + the `/download` page drive users there.
- Updates: users get them automatically next launch (service worker refreshes cache).

## 3) Your ready-made APK (already built & signed ✅)

`public/tajgifts.apk` (681 KB) is a real signed Android package — package
`in.tajgifts.app`, icon = your Taj emblem, opens the `/app` experience in a
hardware-accelerated WebView with back-button navigation. It is served free by
Netlify at **`https://tajgifts.netlify.app/tajgifts.apk`** the moment you push,
and the `/download` page's APK button points straight at it.

Install on any Android: download → tap → allow "install unknown apps" once → done.
(No OBB file exists or is needed — OBBs are only giant game data packs.)

**Rebuild it any time** (source + toolchain recipe): `app/` sources live in the
agent workspace `apk-build/app` (AndroidManifest.xml + MainActivity.java); the chain is
`aapt2 compile → aapt2 link → javac → d8 → zipalign → apksigner` with build-tools 34.
Keystore alias `tajgifts` (password in your vault — ask the agent if lost). Bump
`versionCode` in the manifest for each release so Android offers updates.

**Extra free mirrors (optional):**
- **GitHub Releases**: repo → Releases → New release → attach `tajgifts.apk` → permanent URL
  `…/releases/latest/download/tajgifts.apk` (override on the site with env `NEXT_PUBLIC_APK_URL`).
- **Uptodown** (huge in India): free developer upload, no fee, real store listing.
- **Amazon Appstore** & **Huawei AppGallery**: free registration, free listing.

## 3b) Google Play Store — the honest truth

Play is **NOT free**: Google charges a **one-time $25** developer registration. There is
no legal free route onto Play. If you ever pay it, the path is:
1. play.google.com/console → create account ($25 once).
2. Play requires **AAB** (not APK) since 2021 → generate it free at **PWABuilder.com**
   (paste your URL → Android package → `.aab`) or via Bubblewrap CLI.
3. New *personal* accounts must run a **14-day closed test with 12+ opted-in testers**
   before production release (Google's anti-spam rule) — plan for it.
4. Target-API rules: PWABuilder's output always meets them.
Until then, your APK + PWA + free stores above reach every customer you have, for ₹0.

## 4) iPhone reality (honest note)

Apple does not allow free sideloading of apps; the PWA route (Safari → Add to Home
Screen) is what every budget-conscious brand uses, and it's what the `/download` page
teaches. If one day you want App Store presence: Apple Developer = $99/year — optional,
never required for this ecosystem to work.

## 5) Growth loop (free)

- WhatsApp order confirmations end with: *"Track it in our app: tajgifts.netlify.app/download"*
  (edit the line in `lib/workorder.ts` whenever you like).
- Print the QR from `/download` on the thank-you card inside every hamper.
- Instagram bio link → `/download`.

That's the complete ecosystem: website (SEO) + app (retention) + landing (distribution)
+ bot alerts (operations), all on free tiers. 🎀
