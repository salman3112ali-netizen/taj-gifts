# Taj Gifts — Full Security & Business Audit

Plain-English record of what was inspected, what was broken, what is now fixed,
and the short list of things only the owner can do.

Everything below was checked against the **live** Supabase project and the
actual production code in this repository — not against a mock.

---

## 1. What was actually broken, and what changed

### 1.1 The admin surface was reachable by anyone (SEVERE — fixed)

PostgreSQL gives every new function an `EXECUTE` grant to `PUBLIC`, which in
Supabase means the public `anon` key. Because of that, **37 database functions**
— including `admin_orders`, `admin_customers`, `admin_save_settings`,
`admin_set_passcode`, `admin_delete_product`, `admin_set_payment` — could be
called by any anonymous visitor at `/rest/v1/rpc/…`. The only barriers were a
session-token argument and a login rate limit held in server memory.

Migration `0009_revoke_public_rpc_execute.sql` now:

| Function group | Before | After |
|---|---|---|
| `admin_*` (30 functions) | anon + authenticated | **service_role only** |
| `claim_order`, `claim_my_orders`, `request_account_deletion` | anon | authenticated customers only |
| `handle_new_user`, `link_order_to_account`, `touch_updated_at` | anon | nobody (trigger-only) |
| `taj_create_account_order`, `taj_cancel_order`, `taj_customer_cancel_order`, `taj_rate_limit`, review/ledger helpers | anon | **service_role only** |
| Future functions in `public` | world-executable | closed by default |

Verified after applying: every one of the 37 rows reports
`anon_exec = false, auth_exec = false, svc_exec = true` (customers keep the
three claim/deletion functions).

### 1.2 Every gift code was public (HIGH — fixed)

`coupons_public_read` exposed the whole table to `anon`. Anyone could list every
live discount code, including codes created for a specific customer. The policy
and the table grant were removed; the storefront now resolves codes only through
`POST /api/coupon`, which is rate-limited (40 checks / 10 min / connection) and
re-validated again at checkout.

### 1.3 Coupon, newsletter and checkout endpoints had no durable limits (MEDIUM — fixed)

The old limits lived in a JavaScript `Map`, which is wiped every time a
serverless instance restarts. All three now also use the database-backed
`taj_rate_limit` counter:

- coupon preview — 40 / 10 min per connection
- newsletter — 5 / hour per connection, plus a honeypot field
- checkout — 15 / hour **per account**
- native app sign-in — 20 / 15 min per connection

### 1.4 Admin password guessing (HIGH — fixed)

- 8 wrong passwords / 15 minutes per IP, plus a global ceiling of 100 / 15 min,
  now stored in Postgres so it survives restarts.
- bcrypt cost raised from 10 to 12 when the owner sets a password.
- New owner passwords must be **10+ characters** (was 8, with no check at all
  when a raw hash was posted to the settings endpoint — that bypass is closed).

### 1.5 Customer passwords were too weak elsewhere (MEDIUM — fixed in code)

Signup, reset, admin settings and the native app now all require 10+ characters.
The Supabase project setting is still 6 (see §3 — it needs the dashboard).

### 1.6 No Content-Security-Policy (MEDIUM — fixed)

`netlify.toml` now sends a CSP that blocks third-party script injection, framing
of the shop by other sites, and form posts to foreign domains. The only allowed
third parties are Supabase, Razorpay and Meta Pixel — the ones the site already
uses. Also added: `Cross-Origin-Opener-Policy` and `X-DNS-Prefetch-Control`.

### 1.7 Browser bundles were importing the server store module (LOW — fixed)

`inr`, `orderCode`, `dateTimeFmt` and `waLink` used to live in `lib/store.ts`,
which also holds the service-role client. Client components imported that module
only for formatting. The helpers now live in `lib/format.ts`; no `"use client"`
file imports `lib/store.ts`. No key had leaked (Next.js blanks non-public env
vars in the browser), but the boundary is now explicit.

### 1.8 Admin image upload trusted the browser's file type (LOW — fixed)

`file.type` is attacker-controlled. The upload route now also checks the real
file signature (JPEG / PNG / GIF / WebP / AVIF magic bytes) so the public bucket
cannot be used to host an HTML page.

### 1.9 Customers could not cancel their own order (BUSINESS GAP — fixed)

`taj_customer_cancel_order` existed but nothing called it. Added
`POST /api/account/cancel-order` and a **“Cancel this order”** action on the
account page. It only appears for orders that are `pending` or `confirmed` and
unpaid; the database function locks the row, proves ownership, restocks each
hamper exactly once and writes an audit event.

### 1.10 The shop was advertising a delivery promise it cannot keep (BUSINESS — fixed)

Live product data said **“Same-day”** and *“Order before 2pm for same-day
dispatch”*. The studio is a home operation; that promise creates refund
disputes and breaks Indian consumer-protection rules on misleading claims.
Corrected in the database to “Hand-tied” / “Made to order · dispatch in 1–2
days”, and “Hassu” had a broken lead time of `"2"` (now “Dispatch in 2 days”).

### 1.11 Local SEO structured data was incomplete (SEO — fixed)

The homepage already had `GiftShop` + `LocalBusiness` + `PostalAddress`, but no
coordinates and only one social profile. Added `GeoCoordinates` (Kashipur) and
the Instagram profile to `sameAs`, alongside the existing YouTube channel.

---

## 2. Checked and found genuinely sound (no change needed)

- **Row-level security**: all 16 public tables have RLS enabled. Orders, items,
  events, addresses, wishlist and profiles are scoped to `auth.uid()`.
- **Reviews**: a review can only be inserted by the buyer of a *delivered*
  order containing that product; body length and rating are constrained.
- **Order ownership**: tracking needs either the private tracking token or the
  account that owns the order; both are verified server-side.
- **Payments**: the Razorpay verifier re-computes the HMAC signature, checks the
  Razorpay order id, the exact amount (`total × 100`), INR currency and the
  captured/authorised status, and re-checks order ownership before marking paid.
- **Stock**: decrement and restock happen inside serialisable database functions
  with row locks. Over-selling returns a friendly “only N pieces left” error.
- **Idempotency**: `client_request_id` prevents a double-submitted checkout from
  creating two orders.
- **Secrets**: no service-role key, SMTP password, admin hash or Telegram token
  appears in any rendered page, in `/api/products`, or in the Android sources.
- **Android**: no hardcoded credentials, cleartext traffic disabled, and the
  exported components are only the launcher, the auth callback, the sync job and
  the boot receiver. The admin app is not linked from the public site.
- **Function hardening**: all 42 `SECURITY DEFINER` functions already pin their
  `search_path`.
- **Order state machine**: status changes are action-based (confirm → pack →
  dispatch → deliver) with a delivery OTP; paid orders cannot be cancelled
  before a refund is recorded.

---

## 3. Only the owner can do these — please do them today

1. **Rotate the Gmail app password** for `tajgifts.orders@gmail.com` and the
   **Telegram bot token**. They were readable through the old settings leak for
   weeks; closing the leak does not un-leak them.
2. **Confirm `tajgifts@upi` is a real, active UPI ID.** It is printed at
   checkout. If it is wrong, every non-COD customer hits an error.
3. ~~Decide the public contact email.~~ **Done** — every page now shows
   `tajgifts.orders@gmail.com`. The old `hello@tajgifts.in` address was never
   registered by the owner (the domain belongs to someone else), so it was a
   dead address that customers could not reach.
4. **Supabase dashboard → Authentication → Passwords**: set minimum length to
   10, enable “Check against breached passwords”, and enable CAPTCHA (the app now
   also enforces 10 characters, but these project settings cover every client).
5. **Netlify environment variables**: `ADMIN_SECRET` (32+ random characters) and
   `NEXT_PUBLIC_SITE_URL=https://tajgifts.netlify.app` (or the custom domain).
6. **Deploy.** The live site is still the old build — it still shows the fake
   “4.9 out of 5” rating and “Same-day”. Until you push, none of this is live.

---

## 4. Deploy (GitHub → Netlify)

```bash
cd hamper-site
git add -A
git commit -m "Security: lock admin RPCs, coupons and rate limits; add customer cancellation"
git push origin main
```

Netlify rebuilds automatically. Then check:

```bash
curl https://tajgifts.netlify.app/api/app/auth
# {"ok":true,"service":"Taj Gifts native account API"}
```

A 404 means the new build has not reached production yet.

---

## 5. How the money path works now, in one paragraph

A visitor must sign in — guest checkout returns HTTP 401. The server recomputes
every price, variant, add-on and coupon from the database, decrements stock
inside a locked transaction, and stores the order against the account’s verified
email. Cash on delivery is offered only inside the local pincode zone; everywhere
else the customer pays by UPI or Razorpay, and the order is marked paid only
after a server-side signature + amount + status check. Only the studio can move
an order forward, and each step writes a timeline event the customer can see
through their private tracking link.

---

## 6. Owner-supplied Android app (v1.1.0)

The APK supplied by the owner was inspected before publishing it on `/download`.

**Identity of the build**

| Property | Value |
|---|---|
| Package | `com.tajgifts.app` |
| Version | 1.1.0 (versionCode 2) |
| Min / target SDK | 24 (Android 7.0) / 35 |
| Signing certificate | Self-signed, `O=Taj Gifts, L=Kashipur, ST=Uttarakhand, C=IN`, valid 9 Nov 2026 → 1 Nov 2056 |
| Certificate SHA-256 | `8F:AE:0D:80:72:AB:A4:B3:16:5D:83:EF:B8:D1:3A:89:AC:A6:A5:93:A5:39:D6:8F:1C:1F:C1:8D:C1:17:44:C2` |
| APK SHA-256 | `04909abf8a0df44e1b547a5a22a41108df0fa8c170c3f162d2d1bc986f72ceb4` |

**What was checked**

- Signed with APK Signature Scheme v2/v3 — tamper-evident, installs normally.
- Permissions requested: `INTERNET`, `ACCESS_NETWORK_STATE`, `VIBRATE` only.
  No contacts, SMS, location, camera or storage access.
- Exported components: the launcher activity and a `tajgifts://auth/callback`
  deep link. Nothing else is exposed.
- No service-role key, SMTP password or bot token inside the package. The only
  embedded credential is the Supabase **anon** key, which is public by design
  and protected by row-level security.
- Data access: the app reads only `orders`, `order_items`, `addresses`,
  `profiles`, `wishlist` and `reviews` — all scoped to the signed-in user by
  RLS. It never touches `settings`, `coupons`, `customers` or `leads`, so the
  lockdown in `0009` does not affect it.
- It calls our server for `/api/checkout`, `/api/coupon`, `/api/order/{id}`,
  `/api/products`, `/api/lead` and `/api/subscribe`.

**One real defect this exposed, now fixed**

The app signs in through Supabase Auth and sends a Supabase access token as
`Authorization: Bearer <token>`. Our API routes only accepted the browser's
session cookie, so **every checkout from the app would have been refused** with
"please sign in" — a genuine block on app orders once guest checkout closed.

`getUserFromRequest()` in `lib/supabase/server.ts` now accepts either the cookie
or a bearer token, and the token is verified by Supabase on the server
(`auth.getUser(token)`) — never decoded and trusted locally. Applied to
checkout, order tracking, account cancellation and legacy-order claiming.

**Also fixed while wiring it up:** `claim-legacy-orders` had regressed to
`.ilike("customer_email", …)`, where an email containing `_` or `%` acts as a
SQL wildcard and could pull in another customer's order. It now compares
case-insensitively in code, exactly.

**Publishing**

The APK is served from `/app/tajgifts-1.1.0.apk` with the correct Android MIME
type, and the download page shows version, size and SHA-256 so anyone can verify
what they installed.
