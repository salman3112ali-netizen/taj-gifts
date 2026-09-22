/**
 * ZERO-TOUCH owner notification router — fires server-side the instant an order is created.
 * The customer never has to press anything; the studio gets briefed like a bot message.
 *
 * Channels (all optional, parallel, fire-and-forget — a failure never blocks checkout):
 *  0) EMAIL (recommended): ORDER_NOTIFY_EMAIL + (RESEND_API_KEY | SMTP_USER+SMTP_APP_PASSWORD)
 *     → styled HTML email with the hamper sketch attached/embedded + full order tables.
 *  1) META_WA_TOKEN + META_WA_PHONE_ID + META_WA_TO → official WhatsApp Cloud API bot
 *     (template with AI sketch as image header + 10 body variables).
 *  2) TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → photo + full brief on Telegram.
 *  3) CALLMEBOT_API_KEY → CallMeBot WhatsApp text (provider currently at capacity).
 *  4) ORDER_NOTIFY_WEBHOOK → raw JSON POST for Make/Zapier/n8n/WATI.
 *
 * Setup: AUTO-NOTIFY-SETUP.md
 */
import { apiCfg } from "@/lib/apis";

type NotifyItem = { name: string; qty: number; variant: string | null; addons: string[]; line_total: number };
type NotifyPayload = {
  order: Record<string, unknown>;
  brief: string;
  artUrl?: string;
  items?: NotifyItem[];
};

export async function notifyOwners(payload: NotifyPayload): Promise<void> {
  const jobs: Promise<unknown>[] = [
    emailChannel(payload),
    metaWhatsApp(payload),
    telegram(payload),
    callMeBot(payload),
  ];

  const hook = (await apiCfg()).webhookUrl;
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

/* ── 0) EMAIL — order info + reference image, straight to the owner ──── */
async function emailChannel({ order: ord, brief, artUrl, items }: NotifyPayload): Promise<void> {
  const cfg = await apiCfg();
  const to = cfg.orderNotifyEmail;
  if (!to) return;
  const o = ord as Record<string, any>;
  const code = String(o.id ?? "").slice(0, 8).toUpperCase();
  const subject = `🎀 NEW ORDER ${code} · ₹${o.total ?? ""} · ${o.customer_name ?? ""} (${o.customer_city ?? ""})`;

  // pull the sketch bytes once so we can ATTACH it (not just link it)
  let buf: Buffer | null = null;
  if (artUrl) {
    try {
      const r = await fetch(artUrl, { signal: AbortSignal.timeout(20000) });
      if (r.ok) buf = Buffer.from(await r.arrayBuffer());
    } catch {
      /* no attachment, remote <img> only */
    }
  }

  const htmlRemote = emailHtml(o, items ?? [], brief, artUrl || null, false);
  const htmlCid = buf ? emailHtml(o, items ?? [], brief, "cid:hamper-sketch", true) : htmlRemote;

  const resendKey = cfg.resendKey;
  const smtpUser = cfg.smtpUser;
  const smtpPass = cfg.smtpPass;

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: cfg.resendFrom || "Taj Gifts Studio <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlRemote,
        ...(buf ? { attachments: [{ filename: "hamper-sketch.jpg", content: buf.toString("base64") }] } : {}),
      }),
    }).catch(() => {});
  } else if (smtpUser && smtpPass) {
    try {
      const nodemailer = (await import("nodemailer")).default;
      const transport = nodemailer.createTransport({
        host: cfg.smtpHost || "smtp.gmail.com",
        port: Number(cfg.smtpPort || 465),
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transport.sendMail({
        from: `"Taj Gifts Studio" <${smtpUser}>`,
        to,
        subject,
        html: htmlCid,
        attachments: buf ? [{ filename: "hamper-sketch.jpg", content: buf, cid: "hamper-sketch" }] : undefined,
      });
    } catch {
      /* silent */
    }
  }
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailHtml(o: Record<string, any>, items: NotifyItem[], brief: string, sketchSrc: string | null, cidMode: boolean): string {
  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:9px 0;border-bottom:1px solid #e8dfce;font-size:14px">
          ${esc(i.name)}${i.variant ? ` <span style="color:#7d7264">(${esc(i.variant)})</span>` : ""}
          ${i.addons?.length ? `<br><span style="font-size:12px;color:#7d7264">+ ${esc(i.addons.join(", "))}</span>` : ""}
        </td>
        <td style="padding:9px 8px;border-bottom:1px solid #e8dfce;font-size:14px;text-align:right;white-space:nowrap">×${i.qty}</td>
        <td style="padding:9px 0;border-bottom:1px solid #e8dfce;font-size:14px;text-align:right;white-space:nowrap">₹${i.line_total}</td>
      </tr>`
    )
    .join("");
  const sketch = sketchSrc
    ? `<img src="${cidMode ? sketchSrc : esc(sketchSrc)}" alt="Hamper reference sketch" style="width:100%;max-width:340px;display:block;margin:0 auto 20px;border-radius:18px;border:1px solid #e8dfce" />`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f3ebdd;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#3e362c">
  <div style="max-width:640px;margin:0 auto;background:#fbf7ef;border:1px solid #e8dfce;border-radius:24px;overflow:hidden">
    <div style="background:#3e362c;padding:18px 26px;color:#fbf7ef">
      <span style="font-family:Georgia,serif;font-size:26px;font-weight:700">Taj<span style="color:#e9b3a9">.</span></span>
      <span style="float:right;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85;padding-top:8px">new hamper order</span>
    </div>
    <div style="padding:24px 26px">
      <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px">Order ${esc(String(o.id ?? "").slice(0, 8).toUpperCase())} — ₹${esc(o.total)}</h1>
      <p style="margin:0 0 18px;font-size:13px;color:#7d7264">${esc(o.payment_method)} · payment ${esc(o.payment_status)} · ${esc(o.created_at ?? "")}</p>
      ${sketch}
      ${rows ? `<table style="width:100%;border-collapse:collapse">${rows}</table>` : ""}
      <div style="margin-top:18px;background:#f6dad3;border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.7">
        <b>👤 ${esc(o.customer_name)}</b> · ${esc(o.customer_phone)}<br>
        📍 ${esc(o.customer_address)}${o.customer_landmark ? `, ${esc(o.customer_landmark)}` : ""}, ${esc(o.customer_city)} — ${esc(o.customer_pincode)}<br>
        ${o.gift_occasion ? `🎉 ${esc(o.gift_occasion)} · ` : ""}${o.gift_delivery_date ? `📅 by ${esc(o.gift_delivery_date)} · ` : ""}${o.gift_surprise ? "🤫 surprise (no prices inside)" : ""}
      </div>
      <div style="margin-top:14px;font-size:14px;line-height:1.8">
        Subtotal ₹${esc(o.subtotal)} ${o.discount ? `− ₹${esc(o.discount)} (${esc(o.coupon)})` : ""} + delivery ₹${esc(o.delivery_charge)} = <b style="font-size:16px">₹${esc(o.total)}</b>
      </div>
      ${o.gift_note ? `<div style="margin-top:14px;background:#e4ddf3;border-radius:16px;padding:12px 16px;font-size:14px">✍️ “${esc(o.gift_note)}”${o.gift_sender_name ? ` — ${esc(o.gift_sender_name)}` : ""}</div>` : ""}
      <pre style="margin-top:18px;background:#ffffff;border:1px solid #e8dfce;border-radius:12px;padding:12px;font-size:11px;line-height:1.5;white-space:pre-wrap;color:#7d7264">${esc(brief)}</pre>
      <p style="margin:14px 0 0;font-size:11px;color:#7d7264">Auto-sent by the Taj Gifts store bot the moment this order was placed. Open /admin to update its status.</p>
    </div>
  </div>
  </body></html>`;
}

/* ── 1) official WhatsApp Cloud API bot ─────────────────────────────── */
async function metaWhatsApp({ order: ord, brief, artUrl }: NotifyPayload): Promise<void> {
  const cfg = await apiCfg();
  const token = cfg.metaWaToken;
  const phoneId = cfg.metaWaPhoneId;
  const to = (cfg.metaWaTo || "").replace(/\D/g, "");
  const template = cfg.metaWaTemplate || "taj_order_alert";
  if (!token || !phoneId || !to) return;

  const o = ord as Record<string, any>;
  const bodyParams = [
    String(o.id ?? "").slice(0, 8),
    String(o.customer_name ?? ""),
    String(o.customer_phone ?? ""),
    String(o.total ?? ""),
    String(o.payment_method ?? ""),
    String(o.customer_city ?? ""),
    String(o.customer_pincode ?? ""),
    String(o.gift_delivery_date || "asap"),
    String(o.gift_note ?? "").slice(0, 120) || "-",
    String(o.status ?? "pending"),
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

  if (artUrl) {
    const res = await tmpl([
      { type: "header", parameters: [{ type: "image", image: { link: artUrl } }] },
      { type: "body", parameters: bodyParams },
    ]).catch(() => null);
    if (!res?.ok) await tmpl([{ type: "body", parameters: bodyParams }]).catch(() => {});
  } else {
    await tmpl([{ type: "body", parameters: bodyParams }]).catch(() => {});
  }

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

/* ── 2) Telegram bot ─────────────────────────────────────────────────── */
async function telegram({ brief, artUrl }: NotifyPayload): Promise<void> {
  const cfg = await apiCfg();
  const token = cfg.telegramToken;
  const chat = cfg.telegramChat;
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

/* ── 3) CallMeBot WhatsApp gateway (provider at capacity as of 2026) ─── */
async function callMeBot({ brief }: NotifyPayload): Promise<void> {
  const cfg = await apiCfg();
  const key = cfg.callmebotKey;
  const phone = (cfg.callmebotPhone || cfg.metaWaTo || "").replace(/\D/g, "");
  if (!key || !phone) return;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&apikey=${encodeURIComponent(key)}&text=${encodeURIComponent(brief.slice(0, 1200))}`;
  await fetch(url).catch(() => {});
}

/* ── CUSTOMER emails — same email channel, branded, silent if unconfigured ── */
export type CustomerMailKind = "placed" | "confirm" | "pack" | "dispatch" | "deliver" | "cancel" | "mark_paid";
export async function notifyCustomer(order: Record<string, unknown>, kind: CustomerMailKind, otp?: string): Promise<void> {
  const to = order.customer_email as string | null;
  if (!to) return;
  const o = order as Record<string, any>;
  const code = String(o.id ?? "").slice(0, 8).toUpperCase();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app";
  const track = `${site}/order/${o.id}`;
  const subjects: Record<string, string> = {
    placed: `Taj Gifts · order ${code} received 🎀`,
    confirm: `Taj Gifts · order ${code} confirmed`,
    pack: `Taj Gifts · order ${code} is packed & ribbon-tied`,
    dispatch: `Taj Gifts · order ${code} is out for delivery (OTP inside)`,
    deliver: `Taj Gifts · order ${code} delivered — thank you!`,
    cancel: `Taj Gifts · order ${code} cancelled`,
    mark_paid: `Taj Gifts · payment received for order ${code}`,
  };
  const bodies: Record<string, string> = {
    placed: `Thank you ${o.customer_name ?? ""}! We've received your order ${code} of ₹${o.total ?? ""}. We'll start tying your hamper right away. Track live: ${track}`,
    confirm: `Good news — order ${code} is confirmed and in our tying queue. Track live: ${track}`,
    pack: `Your hamper for order ${code} is packed, ribbon-tied and labelled. Delivery update comes next. Track: ${track}`,
    dispatch: `Order ${code} is OUT FOR DELIVERY and will reach you shortly.<br/><br/><b>Your delivery OTP: <span style="font-size:22px;letter-spacing:4px">${otp ?? "----"}</span></b><br/><br/>Share this 4-digit code with our delivery partner at the door to confirm handover. Track: ${track}`,
    deliver: `Order ${code} has been delivered and OTP-verified. Thank you for gifting with Taj Gifts! Any help: WhatsApp +91 76688 19833.`,
    cancel: `Order ${code} has been cancelled. Any amount collected is refunded within 5–7 working days.`,
    mark_paid: `We've received and verified your payment for order ${code}. Thank you!`,
  };
  const html = `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:32px;background:#FBF7EF;color:#3E362C">
    <p style="font-size:30px;font-weight:700;margin:0">Taj<span style="color:#C0697A">.</span></p>
    <p style="font-size:15px;line-height:1.6;margin:18px 0">${bodies[kind]}</p>
    <p style="font-size:12px;color:#6b6257">Taj Gifts · Kashipur, Uttarakhand 244713 · +91 76688 19833 · tajgifts.netlify.app</p>
  </div>`;
  await emailRaw(to, subjects[kind] || `Taj Gifts · order ${code}`, html);
}

async function emailRaw(to: string, subject: string, html: string): Promise<void> {
  const cfg = await apiCfg();
  const resend = cfg.resendKey;
  const from = cfg.mailFrom || "Taj Gifts <orders@tajgifts.in>";
  if (resend) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    }).catch(() => {});
    return;
  }
  const user = cfg.smtpUser;
  const pass = cfg.smtpPass;
  if (user && pass) {
    const nodemailer = (await import("nodemailer")).default;
    const transport = nodemailer.createTransport({
      host: cfg.smtpHost || "smtp.gmail.com",
      port: Number(cfg.smtpPort || 465),
      secure: Number(cfg.smtpPort || 465) === 465,
      auth: { user, pass },
    });
    await transport.sendMail({ from, to, subject, html }).catch(() => {});
  }
}
