# How the Taj Gifts website works

Plain-English guide to every part of the live store. No jargon where it can be avoided.

---

## 1. The 60-second summary

| Piece | What it is |
|---|---|
| **Website** | Next.js app, hosted on Netlify, deployed from `github.com/salman3112ali-netizen/taj-gifts` |
| **Database** | Supabase (Postgres) — products, orders, customers, coupons, reviews |
| **Login** | Supabase Auth (email + password, optional Google) |
| **Payments** | Cash on delivery (local only) · UPI transfer · Razorpay gateway when you add keys |
| **Owner console** | `https://tajgifts.netlify.app/admin` (password protected) |
| **Money math** | Always calculated on the server — a customer cannot edit a price in their browser |

---

## 2. What a customer actually experiences

### Browsing (no account needed)

1. Opens `/` — sees the hero, occasion rail and featured hampers, all pulled live from the database.
2. Opens `/shop` — every published hamper, with **search**, occasion filters and sorting.
3. Search matches the hamper name, occasion, tagline, description, tags and listed contents. `wedding`, `diwali`, `pahadi`, `self-care` all work.
4. Opens a product page — photos, contents, variants, add-ons, live stock, delivery rules.
5. Adds to basket. The basket is stored in the browser (`localStorage`), so it survives a refresh.

> Adding to the basket does **not** require an account. Only *ordering* does.

### Before ordering — the account gate

The moment they press checkout, if they are not signed in they get a card saying:

> **Save your order to a real Taj Gifts account** — Sign in / Create an account. *Guest orders are not available.*

This is enforced in **two independent places**:

- **In the app code:** `/api/checkout` returns `401` without a signed-in user (verified by test: *"Please sign in or create an account before placing an order."*).
- **In the database:** a trigger rejects any order row that has no customer account, even if someone bypassed the website entirely.

Basket contents survive the sign-in round trip.

### Checkout

The customer fills:

- Name and mobile (validated: 10-digit Indian mobile)
- Delivery address, landmark, city, pincode (validated: 6 digits)
- Optional: occasion, preferred date, gift note, sender name, "keep it a surprise"

Then picks a payment method:

| Method | When it appears | What happens |
|---|---|---|
| **Cash on delivery** | Only for a local pincode, and only if COD is switched on | Pay the delivery partner at the door |
| **UPI transfer** | Always | Order is created as *payment pending*; the order page shows a pre-filled UPI link plus (if configured) a secure card/UPI gateway |

**Delivery charge** is computed from your live settings:

- Free when the discounted subtotal reaches **₹2,499**
- Otherwise ₹99 general delivery
- **₹0** in your five local pincodes: 244713, 244715, 244001, 263139, 263153

A customer who enters a non-local pincode is automatically switched off COD and onto UPI, so they never reach a payment method you cannot serve.

### Placing the order

When they submit, `/api/checkout` does all of this **inside one database transaction**:

1. Re-reads every product from the database (never trusts browser prices)
2. Re-checks stock and decrements it
3. Re-validates the coupon and recalculates the discount
4. Recalculates delivery from the pincode and subtotal
5. Creates the order and its line items, tied to the account
6. Generates a private tracking token
7. Returns the order id

If two customers buy the last hamper at the same moment, one transaction wins and the other is told stock changed. **Stock cannot go negative.**

**Duplicate protection:** each checkout carries a one-time request id. If the customer's network drops and they press the button again, they get the *same* order back instead of being charged twice.

### After ordering

They land on `/order/<id>` which shows:

- Order code (e.g. `TG-1A2B3C`), status progress bar, itemised totals
- The delivery address and gift note
- A **private tracking link** — this URL is the only way to see the order without signing in
- For UPI: the payment box with the amount, your UPI ID and (if configured) the gateway button
- A six-digit **doorstep code** once the order is out for delivery

---

## 3. Orders and their lifecycle

```
pending → confirmed → packed → out_for_delivery → delivered
                                                    ↑
                                        (requires the correct
                                         six-digit door code)
   ↘ cancelled (any time before delivery)
```

- **Cancelling** returns the stock to your catalogue automatically.
- **A paid order cannot be cancelled** until you record a refund. The database itself refuses, not just the buttons.
- **Cancelled or refunded orders cannot be marked paid.** The audit trail only moves forwards: unpaid → paid → refunded.
- Every status change is stamped into the order timeline.

### The doorstep code

For local hand delivery:

1. You press **Start delivery** in `/admin`.
2. The system creates a random six-digit code, valid **30 minutes**.
3. It is stored hashed on the server. You cannot see it, and it is not in any email or timeline.
4. The customer sees it in their tracking page / app.
5. At the door they read it to you; you enter it in admin.
6. Only a correct, unexpired code marks the order **delivered**. COD orders auto-mark as paid at that point.

Wrong attempts are capped at five. You can issue a fresh code up to three times, which instantly kills the old one.

---

## 4. Payments — the honest version

| Method | Verified automatically? | What you must do |
|---|---|---|
| COD | N/A | Collect cash at the door; order auto-marks paid on delivery |
| UPI transfer | **No** | Check your bank/UPI app, then press **Mark payment received** in admin |
| Razorpay | **Yes** | Add your keys once; payments verify themselves server-side |

The site never pretends a UPI transfer is confirmed when it isn't. Orders stay `payment pending` until you confirm or the gateway verifies.

**Razorpay is currently off.** `razorpayEnabled` is `false` and no keys are stored. To turn it on: Admin → Keys → enter Key ID and Key Secret. The secure gateway button then appears on the order page automatically, with signature verification and an amount check against your database.

---

## 5. Customers and accounts

- Sign up at `/signup`, sign in at `/login` (email + password; Google optional).
- Each customer gets `/account` with order history, saved addresses and profile.
- **One default address** is enforced — a second save demotes the first.
- A customer **cannot** make themselves an admin. A database trigger blocks any attempt to change `is_admin` through a crafted request.
- Historic orders placed before accounts existed can be claimed **only by an exact match on the customer's verified email**, and only while the order has no owner. Phone numbers are never used to link orders.

---

## 6. Reviews — now real

- There are currently **zero customer reviews**, and the site shows **no star rating and no review count**.
- A review can only be written by the account that ordered that hamper **and** only after the order is marked **delivered**.
- The customer's display name is taken from their account; they cannot type a fake name.
- Every submitted review goes into moderation. Nothing appears publicly until you approve it.
- When you approve one, the product's rating and count update automatically from real data only.
- Product structured data (what Google reads) emits **no `aggregateRating`** unless genuine approved reviews exist.

---

## 7. Inventory

- Stock is a live number per product. The product page shows "N ready to tie".
- Stock falls the moment an order is committed, inside the same transaction — no overselling.
- Cancelling restores it exactly once (the cancel function is idempotent).
- At zero the product shows **Sold out** and cannot be bought.
- One prototype item was archived rather than deleted, so no catalogue junk is public.

---

## 8. Coupons

Three live codes: **FIRSTGIFT**, **BULK25**, **TAJ10**.

- Validated on the server, including the minimum-order threshold.
- Tested behaviour: `TAJ10` on ₹2,500 → ₹250 off (200); on ₹100 → "Needs a subtotal of ₹1,999 or more" (400); unknown code → "That code isn't active right now" (404).
- The promo strip in the app shell reads the **live coupon table**, so if you deactivate a code the banner disappears instead of advertising a dead offer.
- Manage them in Admin → Coupons.

---

## 9. The owner console (`/admin`)

Password protected. It asks for the password on each new browser tab and keeps a per-tab token — there is no long-lived web cookie.

Tabs:

- **Orders** — confirm, pack, start delivery, verify the door code, record payment, record refund, cancel, WhatsApp/call the customer, print a work order
- **Products** — add/edit, price, stock, photos (device upload or URL), publish/hide, variants, add-ons
- **Coupons** — codes, type, value, minimum order, active
- **Customers / Enquiries / Subscribers** — your CRM
- **Keys** — email (Resend or Gmail SMTP), Meta WhatsApp, Telegram, webhook, Razorpay
- **Settings** — shop name, announcement bar, phone, email, address, UPI ID, COD switch, delivery charges, local pincodes

Order alerts also fire automatically by email/WhatsApp/Telegram when configured. **Email is currently configured** (Gmail SMTP into `tajgifts.orders@gmail.com`, alerts to `salman3112ali@gmail.com`).

---

## 10. What protects the site

| Risk | Protection |
|---|---|
| Fake orders | Account required (app + database trigger) |
| Price tampering | Server recalculates everything |
| Overselling | Atomic stock decrement |
| Double charging | One-time checkout request id |
| Reading someone else's order | Private tracking token or owning account only |
| Privilege escalation | Database trigger on profiles |
| Card/data theft | No card data ever touches the site; no secrets in browser payloads |
| Secret leakage | Integration keys, password hashes and broadcast drafts are stripped from every public response (verified across 16 pages) |
| Admin brute force | Login lockout after repeated failures |
| Cross-user page caching | Service worker refuses to cache account/checkout/order/admin pages |

---

## 11. SEO

- Canonical URLs, sitemap (20 URLs), robots.txt
- Two local landing pages: `/gift-hampers-kashipur` and `/gift-hampers-uttarakhand`
- Structured data: business, website, breadcrumbs, FAQ, collection, product offers — with **no invented ratings**
- Titles/descriptions written for real searches; no "same-day" or "#1" claims anywhere
- Monthly checklist in `SEO-OPERATIONS.md`

---

## 12. Deploying

Push to GitHub; Netlify rebuilds automatically.

```bash
cd hamper-site
git add -A
git commit -m "Production hardening + search, error pages, security fixes"
git push origin main
```

Check after the build finishes:

```bash
curl https://tajgifts.netlify.app/api/app/auth
```

---

## 13. Things only you can decide

1. **UPI ID.** The live setting is `tajgifts@upi`. Confirm that this is the real, registered UPI handle that receives money — if it isn't, every UPI order would be unpayable.
2. **Rotate two credentials.** The integration vault held a Gmail app password and a Telegram bot token that an earlier version of the code serialised into public page HTML. The leak is fixed in this release, but anything that was exposed should be regenerated: create a fresh Gmail App Password and a new Telegram bot token, then update Admin → Keys.
3. **The public contact email** is currently `salman3112ali@gmail.com`. That is fine functionally; switch it to a business address when you have one, in Admin → Settings.
4. **Your APK.** The old generated build has been removed from the site. Send yours and it will be published and wired to `/download`.
5. **Google Business Profile.** Now that Pakiza Colony is confirmed, the address can be used consistently across Google, Instagram and directories.
