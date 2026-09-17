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

## 3) Free Android APK anyone can download (zero cost)

Google Play charges a one-time $25 — skip it. Distribute the APK yourself:

1. Go to **https://www.pwabuilder.com** → enter `https://tajgifts.netlify.app` → **Start**.
   (It reads your manifest + service worker; fix any warnings it shows.)
2. **Package for stores → Android** → download the generated package (ZIP).
   Inside: `app-release-signed.apk` (and an `.aab` for Play later). Free, built by Microsoft's cloud tooling.
3. Rename the APK to `tajgifts.apk` and host it free on **GitHub Releases**:
   - github.com → your `taj-gifts` repo → **Releases → Create a new release** → tag `app-v1`
   - attach `tajgifts.apk` as the release binary → publish.
   - The permanent download URL becomes:
     `https://github.com/salman3112ali-netizen/taj-gifts/releases/latest/download/tajgifts.apk`
     (the `/download` page already points there; override with env `NEXT_PUBLIC_APK_URL` if you ever move it.)
4. Tell users: "Download the APK → open it → allow 'install unknown apps' once → done."
   WhatsApp/Instagram bio link → `tajgifts.netlify.app/download` → they choose Install or APK.
5. **New app version?** Repeat 1–3 with tag `app-v2`; PWA users update silently, APK users re-download.

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
