# Taj Gifts — hand-tied gift hampers, Kashipur (Uttarakhand)

A production-style eCommerce storefront + studio admin, built on **Next.js 15 (App Router) · Tailwind CSS 4 · Framer Motion · Supabase (Postgres + RLS-ready)**. Pastel editorial design system, custom photography, zero placeholder modules.

---

## 1 · Architecture

```
Browser (React 19 client components)
   │  anon Supabase key (read-only, RLS-enforced) for products/settings
   │  fetch() → our API routes for anything that writes
   ▼
Next.js server (Route Handlers — the ONLY place the service-role key lives)
   │  price re-computation, coupon validation, delivery rules, stock guards
   ▼
Supabase Postgres: products · orders · order_items · customers · coupons · settings · leads · subscribers
```

**Security rules honoured**
- `SUPABASE_SERVICE_ROLE_KEY` is read **only** inside `app/api/**` route handlers (server). Never shipped to the browser.
- Checkout **re-prices the cart server-side** from the DB — the browser can never set a price.
- Admin session = httpOnly, SameSite=Lax cookie holding an HMAC-signed expiry token (`lib/admin.ts`); password verified against a **bcrypt hash stored in `settings.data.adminPasswordHash`**.

## 2 · Folder structure

```
hamper-site/
├─ app/
│  ├─ layout.tsx            fonts, metadata, providers, header/footer/drawer/cursor
│  ├─ page.tsx              home (hero, occasions, featured, story, process, reviews, FAQ)
│  ├─ globals.css           pastel design tokens (Tailwind 4 @theme)
│  ├─ shop/                 catalog + filters + sorting
│  ├─ product/[slug]/       PDP: variants, add-ons, contents, gallery
│  ├─ checkout/             address → gift options → COD/UPI → order
│  ├─ order/[id]/           confirmation + live status tracker
│  ├─ about/ · contact/     brand story · lead form + FAQs
│  ├─ admin/                studio dashboard (orders, products, coupons, customers, enquiries, settings)
│  └─ api/
│     ├─ checkout/ · coupon/ · lead/ · subscribe/
│     └─ admin/ login · session · bootstrap · order · product · coupon · settings
├─ components/              header, footer, cart drawer, product card, marquee, reveal, cursor, toast…
├─ lib/                     supabase clients, cart context, admin session, types, store helpers
└─ public/img/              custom pastel product photography (served at /img/*.jpg)
```

## 3 · Environment variables (`.env`, already set in this workspace)

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | project URL (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | RLS-limited read key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only** full-access key |
| `ADMIN_SECRET` | HMAC secret for admin session cookies |
| `NEXT_PUBLIC_SITE_URL` | (optional) your domain, for OG tags |

## 4 · Run locally

```bash
cd hamper-site
npm install
npm run dev        # http://localhost:3000
```

**Admin:** visit `/admin` · password currently `tajadmin2026` → change it immediately in *Settings → Change admin password*.

## 5 · Deploy (Vercel, ~10 min)

1. Push this folder to a GitHub repo → Vercel → *Import Project* (framework auto-detected: Next.js).
2. Add the five env vars above in *Project → Settings → Environment Variables*.
3. Deploy. Point your domain (e.g. `tajgifts.in`) in Vercel *Domains*; SSL is automatic. Update `NEXT_PUBLIC_SITE_URL`.
4. In Supabase → *Authentication → URL Configuration* and *API settings*, add the domain to allowed origins.
5. Done — the site is serverless; Supabase is already cloud-hosted.

## 6 · Data model (existing tables, unchanged)

- **products** — slug, price, compare_at, image/gallery, badge, featured, stock, rating, contents[], variants[], addons[], published…
- **orders** — full customer block, gift block (note/occasion/date/sender/surprise), payment_method (COD/UPI), payment_status, status lifecycle `pending→confirmed→packed→shipped→delivered|cancelled`, JSON `timeline[]`.
- **order_items** — per-line snapshot (name, image, unit/base price, variant, addons, qty, line_total).
- **customers** — phone-keyed ledger (order_count, total_spend, first/last order).
- **coupons** — flat/percent, min_order, active, uses.
- **settings** — single `shop` row: branding, contact, UPI, delivery zones & charges, free-delivery threshold, COD toggle, admin hash.
- **leads / subscribers** — contact form + newsletter.

## 7 · Payments today / tomorrow

- **Live now:** Cash-on-Delivery (local zone) + UPI (ID shown at checkout & on the order page, WhatsApp confirmation flow).
- **Next step:** Razorpay (cards/UPI checkout widget). Needs your Razorpay `key_id`/`key_secret` + a webhook endpoint; the `razorpayEnabled` flag in settings is already reserved for it. Ask me and I'll wire it in.

## 7b · Accounts & authentication (real Supabase Auth)

- **Email + password** signup / login / forgot / reset-password flows (`/signup`, `/login`, `/forgot`, `/reset`) with confirmation-email handling.
- **Google OAuth** button built-in — enable it once via `GOOGLE-LOGIN-SETUP.md` (Google Cloud keys → Supabase provider; ~6 min).
- **Sessions** are httpOnly cookies via `@supabase/ssr`, refreshed by `middleware.ts` on every visit — logins survive restarts and work server-side.
- **Account dashboard `/account`**: order history (own orders only), saved address book (default address, used for one-tap checkout prefill), profile edit, password change.
- **Schema**: `supabase/migrations/0001_accounts.sql` — creates `profiles`, `addresses`, adds `orders.user_id`, signup trigger + RLS policies (users see only their own rows; the server API's service role bypasses RLS as before).
  - ⚠️ Run this SQL once in Supabase → SQL editor (or give the agent your DB password and it will apply it). Until then sign-in works and checkout gracefully stores orders without the account link; `/account` shows an install banner.
- Checkout attaches `user_id` server-side from the session — never from the browser.

## 8 · Owner's checklist

See **`PLAYBOOK.md`** — the complete "everything you need to do" guide: security rotations, legal (FSSAI/GST/Udyam), banking/UPI, packaging & courier setup, daily ops routine, 30-day launch marketing plan, pricing math and growth roadmap.
