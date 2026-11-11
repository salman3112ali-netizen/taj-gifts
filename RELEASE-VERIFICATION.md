# Release verification — 9 September 2026

## Build

| Check | Result |
|---|---|
| Runtime | Node **22.23.4** (matches `>=22 <23` and `netlify.toml`) |
| Install | `npm ci` — clean |
| Production build | `npm run build` — **passed** (39 routes) |
| Production dependency audit | `npm audit --omit=dev` — **0 vulnerabilities** |
| Production server smoke test | `next start` — all routes 200, 404 route returns 404 |

## Fixes in this release

| Area | Change | Verified |
|---|---|---|
| **Credential leak (critical)** | `getSettings()` serialised the whole settings row into every page, including the integration vault (Gmail app password, Telegram bot token) and admin password hash. Now strips `apis`, `adminPasswordHashes`/`adminPasswordHash` and `appAnnouncements`. | Swept 16 public pages plus `/api/products` and a product page: **0 leaks** |
| **Order-claim wildcard bug** | `/account` linked historic orders using SQL `ILIKE` on the raw email, so `_` and `%` inside an email acted as wildcards and could attach another customer's order. Now exact, case-insensitive, code-side matching, unowned orders only. | Code review; build passes |
| **Address** | Live setting and fallback source set to **Pakiza Colony, Kashipur, Uttarakhand 244713, India** (owner-confirmed). Footer no longer prints the city twice. | `/api/products` returns the new address |
| **Unsupported claim** | Announcement bar "Dispatch before 2 pm, same day" replaced with an accurate line. | Live settings query |
| **Search** | Added storefront search (name, occasion, tagline, description, tags, contents), search icon in header, empty-state recovery. | `?q=diwali` renders the input with the query set; header link `/shop#search` present |
| **Error handling** | Added `app/error.tsx` (safe recovery panel, no stack traces) and `/shop` loading state. Refused a root-level loading file because it converted auth redirects from 307 into a streamed 200. | `/account` returns **307 → /login** |
| **Copy** | "Most loved" sort renamed "Recommended" (no popularity claim without data). | Build |

## Live database migrations applied

- `account_only_atomic_checkout`
- `refund_before_cancel`
- `verified_reviews_only`
- `archive_placeholder_catalog_item`
- `remove_unused_image_ai_secrets`

## Rollback-scoped database tests (no production data persisted)

| Test | Result |
|---|---|
| Paid order cancellation rejected until refund recorded | Passed |
| Guest order insert as `anon` | Rejected, no row written |
| Customer review forced to moderation | Passed |
| Client-supplied review author ignored | Passed |
| Unpublished review leaves product metrics at 0 | Passed |
| Moderator publication updates metrics exactly once | Passed |

## Live data health

| Check | Result |
|---|---|
| Published products | 12 (₹1,299–₹3,299) |
| Products out of stock | 0 |
| Public placeholder items | 0 |
| Displayed ratings / review counts | 0 / 0 (was 314 fabricated) |
| Orders | 15 total, 2 placed, 0 paid |
| Invalid order or item totals | 0 |
| Duplicate default addresses | 0 |
| Guest-owned orders | 0 new (5 historic retained, claim by verified email) |
| Admin password | Set (bcrypt hash present) |
| Email notifications | Gmail SMTP configured |
| Razorpay | Off — no keys, gateway path dormant |

## Runtime checks against live Supabase

| Check | Result |
|---|---|
| `POST /api/checkout` without an account | **401** "Please sign in or create an account before placing an order." |
| `POST /api/coupon` `TAJ10` / ₹2,500 | 200, ₹250 discount |
| `POST /api/coupon` `TAJ10` / ₹100 | 400, minimum not met |
| `POST /api/coupon` unknown code | 404 |
| `POST /api/lead` invalid payload | 400 |
| `GET /api/pay/rzp` | `{"enabled":false,"key":null}` |
| `/account` when signed out | 307 → `/login?next=/account` |
| `/sitemap.xml` | 20 URLs (8 static + 12 products) |
| Product structured data | `Offer` present, **no** `aggregateRating` |
| Unknown route | 404 branded page |

## Open items for the owner

1. Confirm `tajgifts@upi` is the real UPI handle that receives money.
2. Rotate the Gmail app password and Telegram bot token (they existed in the settings row that an earlier build exposed).
3. Supply the APK to publish at `/download`.
4. Deploy this source (GitHub → Netlify rebuild).
