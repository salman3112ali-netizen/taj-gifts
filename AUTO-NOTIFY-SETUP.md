# Zero-Touch Order Alerts — the studio gets briefed like a bot message

From now on, **the customer never sends anything**. The second an order is created,
the server fires `notifyOwners()` which delivers the full hamper work-order
(items, extras, name, phone, address, occasion, gift note, totals) **plus the AI
hamper sketch** to you automatically — from a bot, never from the customer's number.

The order page now shows a green "🤖 Studio already notified — automatically" card,
and the customer's old send-button is gone (they keep an *optional* "add a personal
note" link, which is nice-to-have, not required).

## The 4 channels (configure any; they run in parallel)

| # | Channel | What arrives on your phone | Cost | Setup time | Needs approval? |
|---|---|---|---|---|---|
| 1 | **Telegram bot** | 🖼 sketch photo + full brief message | free | 5 min | no |
| 2 | **CallMeBot → your WhatsApp** | full brief as a WhatsApp text | free | 2 min | no (text only, no image) |
| 3 | **WhatsApp Cloud API (official bot)** | template card with sketch as image header + 10 order fields; plus free-form image+caption when window open | free (Meta) | 45 min + template review | yes (Meta app + template) |
| 4 | **Webhook** | raw JSON to Make/Zapier/n8n/WATI/AiSensy | depends | 10 min | no |

Recommendation: **set up #1 tonight** (instant, image included), then **#3 this week**
for the true "official WhatsApp bot" experience. #2 is a nice redundant belt.

---

## Channel 1 — Telegram bot (do this tonight, 5 min)

1. On your phone open Telegram → search **@BotFather** → `/start` → send `/newbot`
2. Name: `Taj Gifts Studio Alerts` · username: `tajgifts_studio_bot` (must end in `bot`; pick another if taken)
3. BotFather replies with the **token** — copy it: `123456789:AAF…` → this is `TELEGRAM_BOT_TOKEN`
4. Get your **chat id**: search **@userinfobot** → `/start` → it replies `Id: 123456789` → that number is `TELEGRAM_CHAT_ID`
   (Alternative: message YOUR new bot once with "hi", then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `message.chat.id`.)
5. Netlify → Site → **Site configuration → Environment variables** → add:
   - `TELEGRAM_BOT_TOKEN` = the token
   - `TELEGRAM_CHAT_ID` = your id
6. Netlify redeploys automatically. **Test:** place a ₹699 COD test order on your site → within ~3 s your Telegram shows the sketch photo + the full brief. Cancel the test order in /admin afterwards.

## Channel 2 — CallMeBot WhatsApp text (2 min)

1. On the phone that owns +91 76688 19833, open **WhatsApp** → add contact **+34 644 44 44 44** (CallMeBot) → send it exactly:
   `I allow callmebot to send me messages`
2. It replies with your **apikey** → that's `CALLMEBOT_API_KEY`.
3. Netlify env: `CALLMEBOT_API_KEY` = key, `CALLMEBOT_PHONE` = `917668819833`.
4. Test order → WhatsApp text brief arrives (no image on this free channel).

## Channel 3 — official WhatsApp Cloud API bot (45 min + review)

Full app-creation walkthrough already lives in **WHATSAPP-AUTO-SETUP.md** — follow it,
with these two updates that match the new code:

1. **Template with image header.** In Meta Business Manager → WhatsApp → **Message templates → Create**:
   - Name `taj_order_alert`, category **UTILITY**, language EN
   - **Header: type IMAGE** (this is what puts the AI sketch on top of the alert)
   - Body with exactly 10 variables in this order:
     `🎀 New hamper order {{1}} — {{2}} ({{3}}). Total ₹{{4}} via {{5}}. Ship to {{6}} {{7}}. Deliver by {{8}}. Note: {{9}}. Status {{10}}.`
   - Submit → utility templates usually auto-approve in minutes.
2. Env vars on Netlify: `META_WA_TOKEN` (permanent token), `META_WA_PHONE_ID`,
   `META_WA_TO=917668819833`, `META_WA_TEMPLATE=taj_order_alert`.
3. Sender number: the Cloud API number **cannot be the same number currently inside
   your WhatsApp Business app**. Use a second SIM (₹100 Jio/Airtel prepaid works),
   or keep Meta's free test number for now (test numbers can message any verified recipient).
4. Test order → the template card (sketch on top) lands on your WhatsApp from the bot number.

## Channel 4 — webhook

`ORDER_NOTIFY_WEBHOOK=https://…` receives `POST {order, brief, artUrl}` JSON — plug into
Make.com / Zapier / n8n / WATI / AiSensy to fan out to email, Slack, Sheets, SMS, anything.

---

## Safety rails built in

- All channels are **fire-and-forget**: if Telegram/Meta/CallMeBot is down, checkout
  still succeeds; the order is always in Supabase + /admin anyway.
- Channels run **in parallel** — configure two for redundancy.
- Nothing secret ever reaches the customer's browser; tokens live only in Netlify env.
- Remove a channel any time by deleting its env var (deploy reloads them).

When alerts are flowing, the loop is closed: customer orders → bot briefs studio →
you tie & ship → status updates in /admin → customer tracks on the order page. 🎀
