/**
 * ZERO-TOUCH owner notification router — fires server-side the instant an order is created.
 * The customer never has to press anything; the studio gets briefed like a bot message.
 *
 * Channels (all optional, all parallel, all fire-and-forget — a failure never blocks checkout):
 *  1) META_WA_TOKEN + META_WA_PHONE_ID + META_WA_TO  → official WhatsApp Cloud API bot:
 *     template message with the AI hamper sketch as IMAGE HEADER + 10 body variables,
 *     then a best-effort free-form image message with the full brief as caption.
 *  2) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID          → Telegram bot: photo (sketch + caption) + full brief message. Free, instant, no approvals.
 *  3) CALLMEBOT_API_KEY (+ CALLMEBOT_PHONE)          → CallMeBot WhatsApp gateway: text brief to your own WA. Free, 2-min setup, text only.
 *  4) ORDER_NOTIFY_WEBHOOK                           → raw JSON POST {order, brief, artUrl} for Make/Zapier/n8n/WATI/AiSensy.
 *
 * Setup guide: AUTO-NOTIFY-SETUP.md
 */
type NotifyPayload = {
  order: Record<string, unknown>;
  brief: string;
  artUrl?: string;
};

export async function notifyOwners(payload: NotifyPayload): Promise<void> {
  const jobs: Promise<unknown>[] = [
    metaWhatsApp(payload),
    telegram(payload),
    callMeBot(payload),
  ];

  const hook = process.env.ORDER_NOTIFY_WEBHOOK;
  if (hook) {
    jobs.push(
      fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {})
    );
  }

  await Promise.allSettled(jobs);
}

/* ── 1) official WhatsApp Cloud API bot ─────────────────────────────── */
async function metaWhatsApp({ order: ord, brief, artUrl }: NotifyPayload): Promise<void> {
  const token = process.env.META_WA_TOKEN;
  const phoneId = process.env.META_WA_PHONE_ID;
  const to = (process.env.META_WA_TO || "").replace(/\D/g, "");
  const template = process.env.META_WA_TEMPLATE || "taj_order_alert";
  if (!token || !phoneId || !to) return;

  const o = ord as Record<string, any>;
  const bodyParams = [
    String(o.id ?? "").slice(0, 8), // {{1}} order code fragment
    String(o.customer_name ?? ""), // {{2}}
    String(o.customer_phone ?? ""), // {{3}}
    String(o.total ?? ""), // {{4}}
    String(o.payment_method ?? ""), // {{5}}
    String(o.customer_city ?? ""), // {{6}}
    String(o.customer_pincode ?? ""), // {{7}}
    String(o.gift_delivery_date || "asap"), // {{8}}
    String(o.gift_note ?? "").slice(0, 120) || "-", // {{9}}
    String(o.status ?? "pending"), // {{10}}
  ].map((text) => ({ type: "text", text }));

  const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const tmpl = (components: unknown[]) =>
    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: { name: template, language: { code: "en" }, components },
      }),
    });

  // template WITH image header first (sketch on top); retry header-less if the
  // approved template has no header component
  if (artUrl) {
    const res = await tmpl([
      { type: "header", parameters: [{ type: "image", image: { link: artUrl } }] },
      { type: "body", parameters: bodyParams },
    ]).catch(() => null);
    if (!res?.ok) await tmpl([{ type: "body", parameters: bodyParams }]).catch(() => {});
  } else {
    await tmpl([{ type: "body", parameters: bodyParams }]).catch(() => {});
  }

  // best-effort free-form image + full brief caption (delivers when a 24h
  // customer-service window is open, e.g. owner messaged the bot number today)
  if (artUrl) {
    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: { link: artUrl, caption: brief.slice(0, 1024) },
      }),
    }).catch(() => {});
  }
}

/* ── 2) Telegram bot (free, instant, photo + full text) ──────────────── */
async function telegram({ brief, artUrl }: NotifyPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const api = (method: string, body: Record<string, unknown>) =>
    fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});

  if (artUrl) await api("sendPhoto", { chat_id: chat, photo: artUrl, caption: brief.slice(0, 1000) });
  await api("sendMessage", { chat_id: chat, text: brief.slice(0, 4096) });
}

/* ── 3) CallMeBot WhatsApp gateway (free, text-only) ─────────────────── */
async function callMeBot({ brief }: NotifyPayload): Promise<void> {
  const key = process.env.CALLMEBOT_API_KEY;
  const phone = (process.env.CALLMEBOT_PHONE || process.env.META_WA_TO || "").replace(/\D/g, "");
  if (!key || !phone) return;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${encodeURIComponent(key)}&text=${encodeURIComponent(brief.slice(0, 1200))}`;
  await fetch(url).catch(() => {});
}
