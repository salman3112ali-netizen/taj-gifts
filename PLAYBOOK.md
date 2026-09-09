# 🎀 The Taj Gifts Playbook — everything you need to do
*Your complete checklist for running a home-based gift-hamper business in Uttarakhand on top of this website. Work top to bottom; §1 is urgent, the rest is in order of importance.*

---

## §1 · Security — do these TODAY (30 minutes)

Your Supabase **service-role key and database password were pasted into a chat**. Treat them as leaked.

1. **Rotate the service-role key** — Supabase Dashboard → *Project Settings → API → Reset service_role key*. Then update `SUPABASE_SERVICE_ROLE_KEY` in `.env` (and in Vercel once deployed). The site keeps working because the key only lives server-side.
2. **Change the database password** — *Project Settings → Database → Reset database password*. (You don't need it day-to-day; the site talks to Supabase over HTTPS keys, not this password.)
3. **Change the admin password** — open `/admin` on your site (current password `tajadmin2026`) → *Settings → Change admin password*. Pick 12+ characters.
4. **Never put the service key or DB password** in frontend code, GitHub public repos, screenshots, or WhatsApp forwards. The browser only ever receives the *anon* key, which is safe by design (read-only).
5. Bookmark: Supabase dashboard login should use your own email with 2-factor enabled (*Account → Security*).

---

## §2 · Make the shop actually yours (1 hour)

The database was seeded with placeholder contact details. In **/admin → Settings**, replace:

- [ ] `phone` and `whatsapp` (format `91XXXXXXXXXX`) — your real number; every WhatsApp button on the site uses it
- [ ] `email` — create a proper one (below)
- [ ] `upiId` + `payeeName` — your real business UPI (see §4)
- [ ] `address`, `city`, `pincode` — your home studio address (appears in footer + delivery logic)
- [ ] `localPincodes` — the pincodes **you yourself can hand-deliver** (same-day zone)
- [ ] `deliveryCharge` (courier, outside zone), `localDeliveryCharge`, `freeDeliveryAbove`
- [ ] `shopName`, `tagline`, `announcement` — the announcement bar is your best free billboard ("Diwali pre-orders open · slots till 15 Oct")
- [ ] Product photos/copy: in */admin → Products* edit names, prices, contents, stock. Photos currently live in `public/img/` — to add your own real photos later, upload to Supabase *Storage* (public bucket) and paste the URL, or drop files in `public/img`.

**Also:** buy a domain (~₹700/yr on Hostinger/GoDaddy: `tajgifts.in` or similar), connect it in Vercel, then set `NEXT_PUBLIC_SITE_URL`. A custom domain is the single biggest trust signal for Indian shoppers.

**Professional email:** Zoho Mail free tier or Google Workspace → `hello@yourdomain.in`. Stop using personal Gmail for business within the month.

---

## §3 · Legal & registrations for a home food-adjacent business in Uttarakhand

Gift hampers that contain **eatables (mithai, honey, jam, bakes)** touch food law. Do these in order:

1. **FSSAI Registration (Basic)** — mandatory if you *make or re-pack* any food item yourself; turnover ≤ ₹12 lakh/yr qualifies for the cheap Basic registration (₹100/yr) at *foscos.fssai.gov.in*.
   - Smart shortcut most home hamper sellers use: **source eatables only from licensed makers** (halwai, bakery, honey co-op) and keep their FSSAI licence numbers on your contents cards + purchase bills. You're then a retailer/assembler; still register (Basic) to be safe — it also lets you print "FSSAI Reg. no." on labels, which corporate buyers love.
   - Every pre-packed item you place must show label basics: product name, maker, veg mark, batch/MFD, best-before, FSSAI no. of the maker.
2. **Udyam (MSME) registration** — free, 10 minutes at *udyamregistration.gov.in*. Gets you priority-sector lending, subsidy schemes, and is often required for current accounts & Razorpay KYC.
3. **GST** —
   - Turnover **under ₹40 lakh/yr (goods)**: registration *not* mandatory for in-state sales.
   - But: **corporate gifting clients will demand GST invoices**, and inter-state e-commerce sales push you toward registration. Practically: register once you land your first 2–3 corporate bulk orders (or earlier if a CA advises); until then issue simple bills/receipts and keep clean books.
   - Get a CA on a ₹500–1,500/month retainer for filing once registered. Keep all purchase bills from day one — input credit matters on hampers (your margins hide there).
4. **Local permits** — Kashipur/Nagar Palika trade licence or home-based business acknowledgement (usually trivial for non-polluting home work); confirm at the municipal office. If you later hire help, Shops & Establishments registration.
5. **Privacy & policies pages** — add simple *Terms, Refund/Return, Privacy* pages before running ads (I can generate them; the FAQ already states your damage-replacement promise, mirror it legally).
6. **Keep records** — a Google Sheet or the admin's *Customers/Orders* tabs + monthly CSV export from Supabase (*Table Editor → Export*) is your audit trail. Back up weekly; 2 minutes.

---

## §4 · Money rails (half a day)

1. **Current account** in the business name (Udyam cert suffices for most banks) — keeps personal/business clean for GST & loans.
2. **Business UPI ID** on that current account (your bank's app, or Paytm/PhonePe Business). Put this ID in admin settings — checkout shows it for UPI orders.
3. **UPI confirmation routine:** order page tells the customer to WhatsApp you the payment screenshot → you mark *payment_status = paid* in */admin → Orders*.
4. **COD discipline:** local-zone COD only (as configured). For courier COD, use Shiprocket (below) — they collect and remit, so you never chase strangers.
5. **Razorpay (cards / UPI checkout widget)** — when you're ready for fully-online payment:
   - Create account at razorpay.com → KYC (PAN, Aadhaar, bank, business proof/Udyam) → get `key_id`/`key_secret`.
   - Tell me and I'll add the checkout widget + server-side signature verification + webhook; the `razorpayEnabled` setting and order columns (`razorpay_order_id`, `razorpay_payment_id`) are already reserved for it. Fees ~2% per transaction, T+2 settlement.

---

## §5 · Sourcing, packaging & delivery (week 1)

**Sourcing (keep 2 vendors per category):**
- Wicker/rattan trays & rigid gift boxes: IndiaMART (Moradabad/Jodhpur suppliers) or Haldwani/Dehradun wholesalers.
- Organza, silk ribbon, shredded fill, dried petals: local fabric market + IndiaMART.
- Mithai/bakes: 1–2 licensed halwais/bakeries in Kashipur who will do small-batch against your order volume (negotiate weekly rates).
- Pahadi specials (honey, jam, herbs): village co-ops / self-help groups (UMCUL-style federations) — great story *and* subsidised prices.
- Candles/soaps: women's SHG collectives in Ramnagar/Nainital district.

**Packaging standard (your brand is the unboxing):**
double-box → petal-safe fill → contents card + hand-lettered tag → "fragile + this side up" tape → outer with your sticker. Order 500 custom stickers (~₹800) with logo + WhatsApp number; every parcel becomes an ad.

**Delivery:**
- *Local zone (your pincodes):* you/family/one part-time rider; free or ₹0 as configured; same-day before 2 pm is your superpower — protect it.
- *Rest of India:* **Shiprocket** (pickup from home, tracking link auto-shared, COD remittance, ~₹35–60 per kg slab) or India Post for remote hills. Create account, verify pickup address, recharge wallet.
- Set realistic `lead_time` per product (admin → Products) — wedding trays 7–10 days, stock hampers 1–2 days.

---

## §6 · Daily operating routine (20 min/day)

Morning, with chai:
1. `/admin → Orders` — new orders: WhatsApp-confirm each (template: "Namaste {name}! Your {hamper} is in today's tying queue 🎀 — dispatch by 2 pm, tracking to follow.").
2. UPI orders: check for screenshot → mark **paid**.
3. Move statuses along: confirmed → packed → shipped (paste tracking in the WhatsApp message) → delivered. Customers see the tracker on their order page.
4. `/admin → Enquiries` — reply to custom-hamper leads within the hour (conversion dies after 3 hours).
5. Stock check: anything below 5 → reorder components or hide (`published` toggle) before it sells out mid-festival.
Weekly: export orders CSV; compute margin per hamper; post 2 reels; message 5 past customers (the *Customers* tab shows spend & recency — your gold mine for repeat gifting).

---

## §7 · Launch marketing — first 30 days

**Positioning line:** *"Hand-tied in the hills of Uttarakhand — hampers that feel like someone cared, because someone did."*

- **Days 1–3 · Warm circle:** WhatsApp status + personal messages to 50 friends/family with code `FIRSTGIFT` (already live: ₹200 off ≥ ₹1,499). Ask each for one Instagram tag.
- **Days 4–10 · Instagram foundation:** business account, 9-grid before launch (packing close-ups, ribbon macros, pahadi honey jars, the kitchen-table story). Reels formula that works for hampers: *packing an order start-to-finish with the customer's note read aloud* — 15–30s, subtitles, soft music. 3×/week.
- **Days 11–20 · Local discovery:** Google Business Profile ("Gift shop · Kashipur") with photos + WhatsApp link; join Kashipur/Haldwani/Ramnagar Facebook & WhatsApp community groups; offer 5 local cafés/boutiques a consignment corner tray.
- **Days 21–30 · Corporate pipeline (the real money):** Diwali/corporate gifting budgets are planned Sep–Oct. Message 30 HR/admin heads (Noida, Gurgaon, Dehradun IT parks) with a 1-page PDF: 3 hamper tiers, GST invoice, name tags, BULK25 code (live: 8% off ≥ ₹20k). One 40-box order = ~₹1 lakh revenue.
- **Always-on:** festival calendar drives everything — Rakhi, Teacher's Day, Diwali (peak), Christmas, wedding season (Nov–Feb), Valentine's, Women's Day. Open pre-orders 4–6 weeks early via the newsletter (footer signup feeds `/admin → Enquiries` subscribers list).
- **Referral loop:** every box gets a card — *"Re-gift the love: your friend gets ₹200 off (FIRSTGIFT), and when they order, we WhatsApp you a surprise thank-you."*

---

## §8 · Pricing math that keeps you alive

Rule of thumb: **price = (contents cost + box/ribbon/tag + packaging labour) × 2.3–2.6**, then round to ₹x99.
Example — *Noor-e-Diwali @ ₹2,499:* mithai boxes ₹620 + diyas/candle ₹310 + box+organza+fill ₹260 + tag/ribbon/card ₹60 + labour 40 min ₹120 ≈ **cost ₹1,370 → margin ~₹1,130 (45%)** before delivery. Corporate bulk: allow 30–35% margin but 40× volume.
Keep `compare_at` (strike-through) honest — anchor to your real festive MRP, never fake inflation; Indian consumers screenshot.

---

## §9 · Growth roadmap (ask me for any of these)

0. **Customer accounts are live** — signup/login, Google button (enable via `GOOGLE-LOGIN-SETUP.md`), order history, saved addresses, one-tap checkout. Run `supabase/migrations/0001_accounts.sql` once in the Supabase SQL editor to switch on history + address book (or reset your DB password and hand it to the agent — it will apply it and verify).
1. **Razorpay online payments** (see §4.5).
2. **Customer accounts** — login, order history, saved addresses (Supabase Auth is ready).
3. **Order tracking by phone number** — public "where's my hamper?" widget.
4. **Hindi / Hinglish toggle** for local reach.
5. **Custom hamper builder** — pick-items-yourself flow (big for weddings).
6. **SEO/blog** — "Diwali gifting ideas for Uttarakhand families" style posts; gift guides rank beautifully.
7. **Storage-based photo uploads** in admin (paste-free product photos from your phone).
8. **Automations** — order-confirmation + shipping WhatsApp/SMS via Interakt or Gupshup APIs.

---

### Quick reference
| Thing | Where |
|---|---|
| Storefront | `/` · `/shop` · `/product/…` |
| Admin | `/admin` (password → change in Settings) |
| Coupons | `/admin → Coupons` (FIRSTGIFT, TAJ10, BULK25 seeded) |
| Delivery zones & fees | `/admin → Settings` |
| Leads & newsletter | `/admin → Enquiries` |
| Backup | Supabase → Table Editor → Export CSV (weekly) |
| Tech docs | `README.md` in `hamper-site/` |

*You now own a storefront, a studio admin, a database, and a plan. Go tie something beautiful.* 🎀
