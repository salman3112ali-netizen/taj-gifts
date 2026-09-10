# Meta Store & Ads — Ultra-Detailed Setup Guide (Taj Gifts)

> Goal: Facebook Page + Instagram Business + (WhatsApp Business) + Meta catalog + ad account,
> all linked into ONE Meta Business Portfolio, then launch your first ads.
> Total time: ~2 hours spread over 2–3 days (some steps have review waits).
> Do the parts IN ORDER — later steps depend on earlier ones.
> Everything you paste below is pre-written for Taj Gifts. Copy verbatim.

---

## PART 0 — Gather these before you start (15 min)

Have these open/ready on your phone + laptop:

| Asset | Exact spec | Where it lives |
|---|---|---|
| Profile photo (FB + IG + WhatsApp) | `logo-emblem.png` (white Taj on blush), min 320×320 | your site: `https://tajgifts.netlify.app/logo-emblem.png` (download it) |
| FB cover photo | 1640×856 px — use `public/img/hero.jpg` (or any wide hamper photo) | repo `public/img/` |
| IG first 9 posts | not now — that's the 30-day content plan (ask me later) | — |
| Website | `https://tajgifts.netlify.app` | live ✅ |
| Phone | +91 76688 19833 | — |
| Email for business | `hello@tajgifts.in` (or your gmail if that's not receiving mail yet) | — |
| Your personal Facebook account | must be real-name, aged > a few weeks, with 2FA ON (Settings → Password & security → Two-factor authentication). **Ads require 2FA.** | — |
| PAN (and GSTIN if you have one) | for Meta's India tax invoice on ad spend | — |

**Paste-ready texts (keep handy):**

- **Page/IG bio (short):**
  `Hand-tied gift hampers made at home in Kashipur, Uttarakhand — Diwali boxes, wedding trays, baby & corporate gifting. Same-day local delivery, COD & UPI.`
- **IG Name field (searchable):** `Taj Gifts · Gift Hampers & Wedding Trays`
- **IG Bio (150 chars, with line breaks):**
  ```
  Hand-tied gift hampers from our home in Kashipur 🎀
  Diwali · Weddings · Birthdays · Corporate
  Same-day local delivery · COD & UPI
  Order 👇
  ```
- **WhatsApp pre-filled ad message link:**
  `https://wa.me/917668819833?text=Hi%20Taj%20Gifts!%20I%20saw%20your%20ad%20%E2%80%94%20I%20need%20a%20hamper%20for%20____%20(occasion)%2C%20budget%20%E2%82%B9____.`
- **About/long description (FB About section, GBP, Justdial — reuse everywhere):**
  `Taj Gifts is a home-based gifting studio in Kashipur, Uttarakhand, hand-tying premium gift hampers for Diwali, Rakhi, weddings, birthdays, baby showers, anniversaries and corporate gifting. Every hamper is made to order with pahadi honey & jams, licensed local mithai, small-batch candles and dried flowers, then double-boxed with a handwritten tag. Same-day hand delivery in Kashipur & nearby pincodes, tracked pan-India shipping, COD & UPI. Custom hampers and bulk wedding/corporate orders (20–2,500 pcs, GST invoice) on WhatsApp.`

---

## PART 1 — WhatsApp Business app (prerequisite for WA buttons & WA ads) — 15 min

Your number currently runs normal WhatsApp; Meta's page/ads integration wants **WhatsApp Business**.

1. Install **WhatsApp Business** (Play Store) on the phone that holds +91 76688 19833.
2. Open it → agree → it detects your existing WhatsApp → tap **Move from WhatsApp** (chat history carries over; nothing is lost).
3. Verify the OTP for +91 76688 19833.
4. **Business profile**: tap your profile photo → Business profile → edit:
   - Business name: `Taj Gifts`
   - Category: `Gift Shop` (search "gift")
   - Description: paste the **About/long description**
   - Email: `hello@tajgifts.in` · Website: `https://tajgifts.netlify.app`
   - Address: choose **hide exact address**, show city `Kashipur, Uttarakhand`
   - Hours: e.g. `Mon–Sun 10:00–20:00`
5. **Business tools → Greeting message**: ON → text:
   `Namaste 🎀 Welcome to Taj Gifts! Tell us the occasion + your budget and we'll suggest 3 hampers within minutes. (Orders before 2 pm dispatch same day in Kashipur.)`
6. **Business tools → Away message**: ON (outside hours):
   `We're away from the table right now 🌙 Leave your occasion + budget and we'll reply by 10 am. For urgent orders call +91 76688 19833.`
7. **Business tools → Quick replies** (save typing forever):
   - `/price` → `Our hampers run ₹699–₹4,999; custom budgets welcome. Which occasion are we gifting for?`
   - `/deliver` → `Same-day hand delivery in Kashipur (244713/244715) & nearby pincodes; pan-India tracked shipping in 3–6 days. Free delivery above ₹2,499.`
   - `/custom` → `Yes — fully custom! Share: occasion, budget per hamper, quantity, and any colours/items you love. We'll sketch a proposal with photo.`
8. Skip the WA catalog for now (your website is the catalog; Meta catalog comes in Part 5).

---

## PART 2 — Facebook Page (new Pages experience) — 20 min

Do this on a **laptop** (easier), logged into your personal FB.

1. Go to `facebook.com` → left menu → **Pages** → **Create new Page** (or direct: `facebook.com/pages/create`).
2. Fill the creation form:
   - Page name: `Taj Gifts`  ← must match GBP + Instagram exactly (brand consistency = trust + SEO)
   - Category: type `Gift shop` → pick **Gift Shop**; add second category `Shopping & retail`
   - Bio: paste the **Page/IG bio (short)**
   - → **Create Page**
3. You land on the setup wizard. Do these IN ORDER (skip nothing):
   - **Profile picture** → upload `logo-emblem.png`
   - **Cover photo** → upload your 1640×856 hamper image
   - **Action button**: choose **WhatsApp** → enter +91 76688 19833 → send test → confirm. (Second-best choice: "Shop now" → `https://tajgifts.netlify.app/shop`.)
   - **Username (vanity URL)**: try `@tajgifts` → if taken: `@tajgifts.in` → then `@tajgifts.kashipur`. This becomes `facebook.com/tajgifts.in`.
   - **Contact info**: phone `+91 76688 19833`, email `hello@tajgifts.in`, website `https://tajgifts.netlify.app`
   - **Location**: city `Kashipur, Uttar Pradesh? NO — Uttarakhand`, hide street address (home-based)
   - **Hours**: `Mon–Sun 10:00–20:00`
   - **Price range**: `₹₹`
4. **Link WhatsApp Business properly** (so chats land in the WA Business app, not SMS):
   Page → **Settings (gear) → Linked accounts → WhatsApp** → enter number → receive code in WA Business app → confirm.
5. **Settings → Page roles / Page access**: you = admin with full control. (Add a trusted backup admin later, never share passwords.)
6. **Settings → Recommendations (Reviews)**: turn ON. Reviews here feed ad social proof.
7. **Settings → Privacy → Country restrictions**: leave unrestricted (you ship pan-India).
8. First actions on the page (do today, ads trust an alive page):
   - **Pin a first post**: photo of your best hamper + text:
     `Our little home studio in Kashipur is now officially on Facebook 🎀 Hand-tied hampers for Diwali, weddings, babies & teams — same-day local delivery, COD & UPI. Say hello in the comments or WhatsApp us: +91 76688 19833`
   - Invite 10–20 friends/family to like the page (warm start; don't buy likes — ever).
9. Mobile: install **Meta Business Suite** app → log in → your page appears (inbox for FB+IG+WA in one place). Live here daily.

---

## PART 3 — Instagram Business account — 20 min

On your phone:

1. **Create a NEW Instagram account** (don't convert your personal one):
   - Instagram app → log out / add account → **Create new account**
   - Email: use `hello@tajgifts.in` (keeps brand login separate from personal)
   - Username, in order of preference: `tajgifts.in` → `tajgifts.kashipur` → `tajgifts.hampers` → `tajgiftsofficial.in`
   - Password: new, strong, save in your password manager
2. Immediately set the profile (before switching type):
   - **Edit profile → Name**: `Taj Gifts · Gift Hampers & Wedding Trays`  ← this field is SEARCHABLE; keywords matter more than beauty
   - **Bio**: paste the 4-line IG bio
   - **Profile photo**: `logo-emblem.png`
   - **Link**: add `https://tajgifts.netlify.app` (label "Shop hampers"). You can add a 2nd link `https://wa.me/917668819833` labelled "WhatsApp us"
3. **Switch to Professional**:
   Settings (☰) → **Account type and tools** → **Switch to professional account** → Continue → choose **Business** (not Creator) → category `Gift Shop` → **Display on profile: ON** → contact: business email + phone → finish.
4. **Link the Facebook Page**:
   Settings → **Account type and tools** (or Business tools) → **Share across profiles / Linked accounts** → connect the **Taj Gifts** Facebook page → allow cross-posting.
   (If prompted from FB side instead: Page Settings → Linked accounts → Instagram → connect.)
5. **Action button on profile**: Edit profile → **Action button** → choose **WhatsApp** (or "Order food/goods" → website). WhatsApp wins for COD business.
6. **Story highlights** (create empty now, fill during content month): `Diwali 🪔`, `Weddings`, `Under ₹999`, `Reviews ♥`, `How we tie`.
7. Turn ON **Settings → Notifications** for comments/DMs/mentions. Reply speed = algorithm fuel.
8. **Do NOT buy followers, do NOT join follow-trains.** Both poison your reach permanently.

---

## PART 4 — Meta Business Portfolio + Pixel + domain — 25 min

Laptop, logged into the same personal FB.

1. `business.facebook.com` → **Create business portfolio** (if not auto-created):
   - Business name: `Taj Gifts` · your name · email `hello@tajgifts.in` → submit
2. **Business settings (gear) → Accounts**:
   - **Pages → Add → your Taj Gifts page** (full control)
   - **Instagram accounts → Add → @tajgifts…** (full control)
   - **WhatsApp accounts → Add → +91 76688 19833**
3. **Security first** (ad accounts get hacked for credit; don't be a story):
   - Business settings → **Business portfolio security**: require 2FA for everyone (you).
   - Add a backup admin later from **Users → People**.
4. **Verify your domain** (lets Meta attribute clicks + unlocks catalog checkout):
   - Business settings → **Brand safety → Domains → Add** → type `tajgifts.netlify.app`
   - Choose **HTML file upload** verification (you can't touch netlify.app DNS, and file upload works):
     Meta gives you a file like `meta-verify-abc123.html` → drop it into your repo's `public/` folder → commit + push → wait for Netlify deploy → confirm you can open `https://tajgifts.netlify.app/meta-verify-abc123.html` → back in Meta click **Verify**.
     (Same trick you used for Google Search Console.)
5. **Create the Meta Pixel** (tracks who buys after seeing ads):
   - `business.facebook.com/events-manager` (Events Manager) → **Connect data sources → Web → Meta Pixel** → name: `Taj Gifts Website Pixel` → create.
   - Copy the **Pixel ID** (16-digit number).
   - Put it live on your site: add to Netlify env vars: `NEXT_PUBLIC_META_PIXEL_ID=<that id>` (the site code already supports it — I wired it) → Netlify redeploys → Pixel starts firing PageView.
   - Back in Events Manager → **Test events**: open your site in a normal browser tab → you should see `PageView` appear within a minute. ✅
   - (Purchase-event tracking: until the pixel matures, run WhatsApp-message campaigns — they don't need pixel events. Sales campaigns come later.)

---

## PART 5 — Commerce catalog (the "store" behind FB Shop + IG tagging) — 30 min + review wait

1. `business.facebook.com/commerce` (Commerce Manager) → **Add catalog** → choose **Create new catalog** → type **E-commerce** → name `Taj Gifts Catalog` → create.
2. **Add items manually** (fastest for 12 hampers; no feed needed):
   Catalog → **Add items → Manually** for each hamper fill:
   - Title: product name (e.g. `Noor-e-Diwali — festive light hamper`)
   - Description: 1–2 sentences from your product page
   - Price: `₹ value` e.g. `1499 INR` (set currency INR once at catalog level)
   - Image: upload the product jpg (or paste `https://tajgifts.netlify.app/img/...` URL)
   - Website link: `https://tajgifts.netlify.app/product/<slug>`
   - Availability: In stock · Condition: New
   Do all 12 (copy from your `/shop` page — 2 min each).
3. **Connect catalog to surfaces**:
   - Catalog settings → **Assign to Page** (Taj Gifts) and **Instagram account**.
   - Commerce Manager → your catalog → **Shops / View shop builder** → build a simple shop: cover = hero image, collections: `Diwali`, `Wedding`, `Under ₹999`, `Corporate`. Publish.
     → This gives your **Facebook Page a Shop tab** with checkout = "Message on WhatsApp / website" (India has no in-app checkout; that's normal).
4. **Instagram product tagging**: after catalog is linked + account reviewed (Settings → **Business → Shopping** on IG → submit catalog for review; approval 1–5 days), you get the **bag icon** → tag products in posts/stories. Until approved, use **link stickers in stories** and the bio link — identical sales, zero waiting.

---

## PART 6 — Ad account, payments, India tax — 15 min

1. Business settings → **Accounts → Ad accounts → Add → Create new ad account**:
   - Name: `Taj Gifts Ads`
   - **Time zone: (GMT+05:30) Asia/Kolkata** ⚠️ and **Currency: INR** ⚠️ — BOTH are permanent. Wrong timezone = reports at weird hours forever.
2. **Payments** (Business settings → **Payments**):
   - Add payment method: **credit/debit card** (Meta India also shows net-banking/UPI options for some accounts; card is the reliable one).
   - Meta India runs **prepaid (manual)** or postpaid automatic depending on account; add ₹1,000 first manually to unlock spending and avoid mid-campaign payment failures.
   - **Tax info**: add **PAN** (mandatory) + **GSTIN** if registered → Meta's invoice shows GST properly; without GSTIN you pay GST on ad spend with no input credit (fine at small budgets).
3. Assign yourself as **ad account admin** (Users → People → you → full control on the ad account).
4. **Ad-account warm-up rules (obey for 2 weeks or risk disabled account):**
   - Week 1: spend ≤ ₹500/day total, one campaign only.
   - Never create 5 campaigns on day 1; never jump budget 10× overnight (raise ≤ 20–30% every 2–3 days).
   - Keep the page alive (2–3 organic posts/week) — Meta trusts pages that look like real businesses.
   - No prohibited claims in ads (no "guaranteed", no medical claims, no before/after, no tagging personal attributes like "planning a wedding?" → phrase as "wedding season is here" instead).

---

## PART 7 — Launch your first ads (the two that work for a COD hamper shop)

Everything happens in **Ads Manager** (`adsmanager.facebook.com`) — one place publishes to FB *and* IG.
("Boost post" button = toy version; use Ads Manager.)

### Campaign A — WhatsApp conversations (start here; best for COD + custom orders)

1. Ads Manager → green **+ Create** → objective **Engagement** → Continue.
2. Campaign name: `WA-conversations-festive` → **Advantage campaign budget: OFF** (budget at ad-set level) → Next.
3. **Ad set**:
   - Conversion location: **Messaging apps** → tick **WhatsApp** → select page Taj Gifts + WA number.
   - Name: `Kashipur-25km-24to55`
   - **Audience**:
     - Location: **Drop a pin on Kashipur + radius 25 km**; then ADD cities: Rudrapur, Haldwani, Ramnagar, Nainital, Moradabad (each pin 10–15 km)
     - Age 24–55 · All genders
     - Detailed targeting (optional, leave broad if unsure): `Gifts`, `Festivals`, `Wedding planning`, `Online shopping`
   - Placements: **Advantage+ placements** (auto FB+IG+Stories+Reels) — correct choice at this budget.
   - Budget: **₹300/day** · schedule: start today, no end (you'll pause manually).
4. **Ad**:
   - Identity: FB page Taj Gifts + IG @tajgifts… (both ticked = one ad, both surfaces)
   - Format: **Single image** 1080×1080 (your best hamper photo, bright pastel) or 1080×1350
   - Primary text:
     `Looking for a gift that actually feels handmade? 🎀 Taj Gifts hampers are tied by hand in Kashipur — pahadi honey, festive mithai, small-batch candles, dried flowers — double-boxed with a handwritten tag. Same-day delivery in Kashipur & nearby. COD & UPI. Tap WhatsApp and tell us the occasion — we'll suggest 3 hampers in your budget.`
   - Headline: `Hand-tied hampers · Kashipur`
   - Description: `COD & UPI · Free delivery above ₹2,499`
   - Call to action: **Send WhatsApp message**
   - Destination: your pre-filled link:
     `https://wa.me/917668819833?text=Hi%20Taj%20Gifts!%20I%20saw%20your%20ad%20%E2%80%94%20I%20need%20a%20hamper%20for%20____%20(occasion)%2C%20budget%20%E2%82%B9____.`
   - **Publish.**
5. Review takes minutes–24 h. Then judge at **day 4**: metric = **Cost per messaging conversation started** (India benchmark ₹15–45). Under ₹45 → scale +30%. Over ₹80 → swap the image, keep the text.

### Campaign B — Website sales / traffic (run once pixel has ~1 week of PageViews)

1. **+ Create** → objective **Sales** (or **Traffic** while pixel is young) → Continue.
2. Ad set: conversion location **Website** → pixel event `Purchase` (Sales) or `Landing page views` (Traffic).
   - Audience: **Delhi NCR + Dehradun + Chandigarh + Lucknow** (pan-India gifting buyers who ship gifts home), age 25–55, interests `Gifts`, `Diwali`, `Corporate gifts`, `Wedding planning`.
   - Budget ₹500/day festive weeks, else ₹300.
3. Ad: carousel of 3 hampers (images + each product-page link) OR single image;
   - Primary text:
     `A Diwali box they'll photograph before they open 🪔 Mithai + diyas + pahadi honey, hand-tied in blush & gold, delivered anywhere in India with a handwritten tag. Limited tying slots each week — pre-book now, pay on delivery or UPI.`
   - Headline: `Diwali hampers · ships pan-India` · CTA **Shop now** → `https://tajgifts.netlify.app/shop`
4. Judge at day 4–7: **cost per add-to-cart / per purchase**; kill ads with CTR < 0.8%.

### Boosting (the lazy cousin) — acceptable ONLY for:
your best organic post/reel, objective "more messages", ₹200–300/day, 4 days. Everything else: Ads Manager.

---

## PART 8 — First-7-days operating rhythm (10 min/day)

- **Meta Business Suite app inbox**: reply to every comment/DM/WA within 1 hour (response badge = conversion).
- Ads Manager → check **frequency** (< 3), **CPC** (₹5–15 healthy), **cost/conversation**.
- Page + IG: 1 story daily (behind-the-table tying videos), 3 feed posts/week (your 30-day plan comes next — ask me).
- Every delivered order: ask for a **Google review** (your checklist card) + an **IG story mention** (repost it → social proof loop).
- Weekly: screenshot ad results into a notes file; scale winners +30%, pause losers. No emotional attachments.

---

## Master checklist (tick as you go)

- [ ] WA Business installed, profile + greeting + 3 quick replies
- [ ] FB Page created, logo + cover + WhatsApp button + username
- [ ] Page linked to WA Business + reviews ON + first pinned post
- [ ] IG business account created, keyword Name field, bio, logo, links
- [ ] IG ↔ FB page linked; WA action button set
- [ ] Business Portfolio holds Page + IG + WA; 2FA enforced
- [ ] Domain `tajgifts.netlify.app` verified via HTML file in `public/`
- [ ] Pixel created; `NEXT_PUBLIC_META_PIXEL_ID` set in Netlify; PageView seen in Test Events
- [ ] Catalog with 12 hampers; Shop tab published; IG Shopping submitted
- [ ] Ad account (IST + INR!), card added, ₹1,000 prepaid, PAN/GST saved
- [ ] Campaign A (WhatsApp) live at ₹300/day; judged at day 4
- [ ] Campaign B (Sales/Traffic) live after pixel warm-up
- [ ] Daily inbox rhythm + weekly scale/pause review

When everything above is ticked, say **"build the 30-day content plan"** and I'll write the day-by-day posts/reels/stories calendar (with captions, hooks and shot lists) matched to your festival calendar. 🎀
