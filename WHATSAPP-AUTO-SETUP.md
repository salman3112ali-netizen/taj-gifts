# 📲 Automatic WhatsApp order alerts — 3 levels, pick yours

Every order **already** produces a perfect "hamper work-order" brief (items, extras, note,
address, delivery date, totals, AI preview link). This doc explains the three ways it can
reach your studio phone, from zero-setup to fully-automatic.

---

## Level 1 — Zero setup (live right now) ✅
- **Customer side:** the order-success page shows *"Send hamper work-order to studio"* —
  one tap opens WhatsApp with the entire brief pre-typed; they press send. Most customers
  do it (it feels like part of the gifting ritual).
- **Owner side:** `/admin → Orders → expand a row → 📲 WA work-order to studio` — one click
  from your laptop files the brief into your own WhatsApp ("message yourself" chat),
  which pings your phone. Use it as your daily routine or backstop.
- Nothing can be missed anyway: orders live in `/admin` and (once the accounts SQL is run)
  in your database forever.

## Level 2 — Free webhook bridge (≈10 min, no code)
Any automation tool can turn the webhook into a WhatsApp/Telegram/SMS ping to you.
1. Set env var on Netlify: `ORDER_NOTIFY_WEBHOOK` = your bridge URL.
2. Example with **Make.com** (free plan): *Custom webhook* module → copy its URL into the
   env var → add a *WhatsApp Cloud API / Telegram / Gmail* module → map `brief` as the
   message text → turn the scenario on. Every order now buzzes your phone automatically.
   (Zapier/n8n identical idea.)
Payload you receive: `{ "order": {…full order row…}, "brief": "🎀 NEW HAMPER ORDER …" }`

## Level 3 — Official WhatsApp Cloud API, fully automatic (≈25 min, free tier)
Meta's own API, no third party. Sends a template message straight to your phone the
second an order lands.
1. developers.facebook.com → **Create App** → type *Business* → add product **WhatsApp**.
2. In the WhatsApp → **API setup** panel you get a **free test business number**,
   a **Temporary token** (make it permanent later) and a **Phone number ID**.
3. WhatsApp → **Config → Test numbers**: add your own mobile as a test recipient
   (with a test number, messages go to verified recipients — you only need yourself).
4. WhatsApp → **Message templates → Create**: category **UTILITY**, name `taj_order_alert`, body:
   ```
   New hamper order {{1}} for {{2}} ({{3}}). Total ₹{{4}} via {{5}}.
   Ship: {{6}} {{7}}. Deliver: {{8}}. Note: {{9}}. Status {{10}}.
   Open /admin for the full tying brief.
   ```
   Submit — utility templates are usually auto-approved in minutes.
5. Netlify env vars:
   ```
   META_WA_TOKEN=EAAG…(your token)
   META_WA_PHONE_ID=123456789012345
   META_WA_TO=919876543210   (your phone, country code, digits only)
   META_WA_TEMPLATE=taj_order_alert
   ```
6. Redeploy. Place a test order → your phone dings with the template filled in.
   (Variable order matches `lib/notify.ts`: code, name, phone, total, payment, city, pincode, date, note, status.)

> When you later connect your **real** WhatsApp Business number to Cloud API (number
> migration in the same dashboard), alerts keep working for any phone, templates and all.

---

### The AI preview, briefly
`lib/hamper-art.ts` paints a deterministic "artist's sketch" of each hamper from its real
contents list via the free Pollinations API (same order = same picture, no key, no cost).
It appears on the order page, in `/admin`, and its link rides along inside the WhatsApp
brief so you can see the hamper on your phone before tying it. If the free API is ever
slow/offline, the page quietly falls back to the product photo — nothing breaks.
