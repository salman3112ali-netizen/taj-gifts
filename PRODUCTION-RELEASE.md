# Taj Gifts — Production Release Runbook

**Prepared:** 9 September 2026 (Asia/Kolkata)  
**Build status:** passed with Node **22.23.4**, `npm ci`, and `npm run build` (39 routes)  
**Dependency audit:** `npm audit --omit=dev` reports **0 vulnerabilities**

This is a full **Next.js application**, not a static website. Its account checkout, checkout repricing, native-app login, tracking, payment verification, owner operations and contact handling are server routes. Deploy the **source**, using a build-enabled Netlify deployment; do not drag-and-drop a prebuilt `.next` folder or a static export.

---

## 1. What has already been applied safely to the live Supabase project

The connected project `peuoaooegxffecnwrzuv` now has these applied database migrations:

- `account_only_atomic_checkout`
- `refund_before_cancel`
- `verified_reviews_only`
- `archive_placeholder_catalog_item`

They are also retained in `supabase/migrations/0003` through `0006` in this source bundle for auditability and future environment setup.

### Live hardening now enforced by the database

- **No new guest orders:** an order must have a customer account, and order items must belong to an account-owned order. The five historic ownerless orders were retained; a verified-email owner can claim a matching historic order through the account area.
- **Atomic checkout:** server-side prices, stock, coupon totals, delivery totals and account ownership are verified in one transaction. Checkout limits and idempotency protect against duplicate submission.
- **Cancellation is inventory-safe:** a cancellation/restock is a database transaction and is idempotent. A paid order must be marked refunded before it can be cancelled and restocked.
- **Razorpay IDs are unique** and default addresses are limited to one per customer.
- **Customer privilege escalation is blocked:** an authenticated customer cannot set `profiles.is_admin` through a crafted write.
- **Reviews are now trustworthy:** zero real review rows existed, so the seeded 314 displayed ratings/reviews were removed rather than represented as genuine customer feedback. Future customer reviews must match that customer’s delivered order and ordered product, are forced into moderation, and only moderated published reviews update visible product ratings or structured data.
- **Prototype merchandise removed safely:** the public ₹1 “Hassu” / “Nothing” placeholder (with no order history) is archived instead of deleted.

The latest database health check found zero invalid order totals, zero invalid order-item totals, zero duplicate default addresses, zero public placeholder products, and zero displayed unverified reviews.

> Do **not** paste these migrations manually into the live SQL editor again. They are already applied to the connected project.

---

## 2. Production deployment — required to activate the web/API fixes

The database is live, but the revised server routes are activated only after this source is built and deployed to the existing Taj Gifts Netlify site.

### A. Use Node 22

`netlify.toml` already declares Node 22 and `package.json` requires `>=22 <23`.

In Netlify’s build settings, confirm:

```text
Build command: npm run build
Publish directory: .next
Node version: 22
```

Do not override these with a static-site build or `--no-build` deployment.

### B. Configure production environment variables

In **Netlify → Site configuration → Environment variables**, preserve the real production values and ensure these are set for **Production**:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_SECRET
CUSTOMER_APP_TOKEN_SECRET
DELIVERY_OTP_SECRET
NEXT_PUBLIC_SITE_URL
```

Recommended production value:

```text
NEXT_PUBLIC_SITE_URL=https://tajgifts.netlify.app
```

Use the actual canonical HTTPS domain instead if the business has moved to a custom domain. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, `CUSTOMER_APP_TOKEN_SECRET`, and `DELIVERY_OTP_SECRET` are server secrets: never place them in source, an APK, browser JavaScript, screenshots or Git.

Generate distinct 32+ character secrets on a trusted machine if any are missing:

```bash
openssl rand -base64 48
```

For live Razorpay gateway payments, also set only on the server:

```text
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

The existing email/WhatsApp/Telegram values remain optional notification integrations, but should be checked before relying on owner alerts.

### C. Deploy from Git or Netlify CLI

**Recommended:** put this source in a private Git repository and connect it to the existing Netlify site. Netlify will run `npm ci` and `npm run build` from the source.

**CLI alternative:**

```bash
unzip tajgifts-production-source-2026-09-09.zip
cd hamper-site
npm install -g netlify-cli
netlify login
netlify link             # choose the existing Taj Gifts site
netlify deploy --build --prod
```

Do not deploy only the ZIP contents through a static/manual drag-and-drop path; it would omit the Next.js runtime APIs that the website and Android client require.

---

## 3. Supabase Auth configuration (web + native app)

In **Supabase → Authentication → URL Configuration**:

1. Set **Site URL** to the exact canonical website URL.
2. Add the matching web callback URL, for example:

   ```text
   https://tajgifts.netlify.app/auth/callback
   ```

3. Add the native return URL exactly:

   ```text
   tajgifts://auth/callback
   ```

4. If Google sign-in is enabled, use the normal Supabase callback URL in Google Cloud:

   ```text
   https://peuoaooegxffecnwrzuv.supabase.co/auth/v1/callback
   ```

   Do **not** put `tajgifts://...` into Google Cloud’s web OAuth callback field; Supabase performs the final safe handoff to Android.

Email/password authentication works without Google. Keep email confirmation enabled for normal customer-account verification.

---

## 4. Post-deploy acceptance checklist

Run these checks against the **production** domain, using a real owner/customer test account and test payment credentials where applicable.

### Server and account checks

- Open:

  ```text
  https://tajgifts.netlify.app/api/app/auth
  ```

  Expected success response:

  ```json
  {"ok":true,"service":"Taj Gifts native account API"}
  ```

  - `404` means the source was not deployed as a Next.js app.
  - `503` means the required Netlify environment variables are absent or invalid.

- As a logged-out browser visitor, browse products and add to basket. Checkout must redirect to sign-in/create-account; it must not create an order.
- Create/sign in to a customer account. After password, email confirmation or Google sign-in, the validated local `next` path must return the customer to checkout.
- Place a single low-risk test order as a signed-in test account. Verify the order is visible only in that account, the stock falls exactly once, and a repeat browser submission does not create a duplicate.
- Test an unpaid cancellation from the owner admin. Verify the stock restores exactly once. Test that a paid order cannot be cancelled until a refund record is entered.
- Verify the account’s address-default selector leaves exactly one default address.
- If applicable, use an existing historic checkout email to test the **Claim historic orders** action; it must not claim an unrelated order.

### Payment checks

- With Razorpay **test** keys, make a real test payment. Verify captured/authorized handling, wrong payment/order mismatch rejection, duplicate callback resistance, and the correct customer notification.
- Do not call the gateway path “production-ready” until this test succeeds on the deployed site.
- For direct UPI, verify staff manually confirms payment before fulfilment; the site intentionally does not claim automatic UPI verification.

### Native Android checks

The current Android source contains genuine native account handling; however, no replacement APK was built in this release. The old generated v2.5.1 APK has been removed from the public download path so customers are not given a build whose UI was rejected and whose current flow has not been re-tested. It is preserved only as a legacy workspace artifact, not for distribution. As requested, when you provide your own APK, that APK must be used instead of any generated customer APK.

After deploying the website first, test the provided APK on a real device:

1. Sign up with email/password.
2. Tap the confirmation email and confirm it returns through `tajgifts://auth/callback` to the native app rather than leaving the customer on the website.
3. Sign in, sign out, reopen the app, save an address, place a signed-in checkout order, and view the account order.
4. If Google is enabled, test app → Google consent → app return.

If the Android app still sees a 404 from `/api/app/auth`, the production site was not built/deployed from this source.

---

## 5. SEO and local-search work included in the source

The release adds or improves:

- focused, indexable landing pages for `/gift-hampers-kashipur` and `/gift-hampers-uttarakhand`;
- canonical URLs, sitemap coverage, crawlable internal links, useful title/description metadata, breadcrumb and collection structured data;
- business/website structured data and factual product structured data;
- a transparent `/policies` page and accurate delivery wording;
- removal of unsupported same-day-delivery, manufactured social-proof and fabricated review language;
- a live-data promo strip in the compact storefront so inactive/edited coupon copy does not become stale.

### Human actions that still require the business owner

No one can truthfully guarantee Google #1. Durable local visibility comes from correct identity, useful product pages, legitimate customer evidence and steady operations.

1. **Public studio address is confirmed** as **Pakiza Colony, Kashipur, Uttarakhand 244713, India** and is now set in the live settings and in the source fallback. Use exactly that wording (plus the same name, phone, URL and hours) on Google Business Profile, Instagram and every directory.
2. Claim/verify the Google Business Profile with that exact NAP data, correct primary category, real hours, current exterior/studio/product photographs, delivery/service areas, and the website URL. Do not invent a shopfront or service area.
3. Add the canonical site to Google Search Console, submit `/sitemap.xml`, inspect the Kashipur/Uttarakhand pages after deployment, and monitor indexing/crawl errors.
4. Add only accurate, maintained listings (for example, genuine local business directories/social profiles) after the NAP decision. Avoid mass directory submissions and paid/fake reviews.
5. Request genuine post-delivery reviews through a fair follow-up process; do not gate, buy or seed reviews. The database will now show ratings only when moderation-approved, order-linked review data exists.

---

## 6. Evidence from this release

- Node 22.23.4 production build: **passed**.
- Next.js version patched to **15.5.29**; Nodemailer/Tailwind/PostCSS/sharp/source-map dependency chain upgraded/overridden safely.
- Production dependency audit: **0 vulnerabilities**.
- Atomic checkout and cancellation routines were exercised in rollback-only database transactions: account guard, item creation, stock reservation, cancellation stock restoration, and paid-order refund guard all passed.
- Verified review workflow was tested in a rollback-only transaction: browser-originated review identity is forced from the account, publication is forced pending, and moderation publication updates product metrics.

A real deployment and real payment/device tests are still required before treating the release as fully live-verified.
