/**
 * Owner notification router — fires server-side after an order is committed.
 * Channels are optional, parallel and non-blocking: an integration outage must
 * never lose a sale or make a customer resubmit checkout.
 *
 *  0) EMAIL: ORDER_NOTIFY_EMAIL + (RESEND_API_KEY | SMTP_USER+SMTP_APP_PASSWORD)
 *  1) Official Meta WhatsApp template
 *  2) Telegram text alert
 *  3) CallMeBot WhatsApp text
 *  4) ORDER_NOTIFY_WEBHOOK JSON POST
 */
import { apiCfg } from "@/lib/apis";

type NotifyItem = { name: string; qty: number; variant: string | null; addons: string[]; line_total: number };
type NotifyPayload = {
  order: Record<string, unknown>;
  brief: string;
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

/* ── 0) EMAIL — committed order details, straight to the owner ───────── */
async function emailChannel({ order: ord, brief, items }: NotifyPayload): Promise<void> {
  const cfg = await apiCfg();
  const to = cfg.orderNotifyEmail;
  if (!to) return;
  const o = ord as Record<string, any>;
  const code = String(o.id ?? "").slice(0, 8).toUpperCase();
  const subject = `🎀 NEW ORDER ${code} · ₹${o.total ?? ""} · ${o.customer_name ?? ""} (${o.customer_city ?? ""})`;
  const html = emailHtml(o, items ?? [], brief);

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
        html,
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
        html,
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

function emailHtml(o: Record<string, any>, items: NotifyItem[], brief: string): string {
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
  return `<!doctype html><html><body style="margin:0;background:#f3ebdd;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#3e362c">
  <div style="max-width:640px;margin:0 auto;background:#fbf7ef;border:1px solid #e8dfce;border-radius:24px;overflow:hidden">
    <div style="background:#3e362c;padding:18px 26px;color:#fbf7ef">
      <span style="font-family:Georgia,serif;font-size:26px;font-weight:700">Taj<span style="color:#e9b3a9">.</span></span>
      <span style="float:right;font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85;padding-top:8px">new hamper order</span>
    </div>
    <div style="padding:24px 26px">
      <h1 style="margin:0 0 4px;font-family:Georgia,serif;font-size:24px">Order ${esc(String(o.id ?? "").slice(0, 8).toUpperCase())} — ₹${esc(o.total)}</h1>
      <p style="margin:0 0 18px;font-size:13px;color:#7d7264">${esc(o.payment_method)} · payment ${esc(o.payment_status)} · ${esc(o.created_at ?? "")}</p>
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
      <p style="margin:14px 0 0;font-size:11px;color:#7d7264">This order notification was sent automatically after checkout. Open /admin to update its status.</p>
    </div>
  </div>
  </body></html>`;
}

/* ── 1) official WhatsApp Cloud API bot ─────────────────────────────── */
async function metaWhatsApp({ order: ord }: NotifyPayload): Promise<void> {
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

  await tmpl([{ type: "body", parameters: bodyParams }]).catch(() => {});
}

/* ── 2) Telegram bot ─────────────────────────────────────────────────── */
async function telegram({ brief }: NotifyPayload): Promise<void> {
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

/* ── CUSTOMER delivery messages — never block a real order ─────────────── */
export type CustomerMailKind = "placed" | "confirm" | "pack" | "dispatch" | "deliver" | "cancel" | "mark_paid";
export type CustomerMessageOptions = { otp?: string; trackingUrl?: string; otpExpiresAt?: string };
export type CustomerMessageReport = { email: boolean; whatsapp: boolean; webhook: boolean; channels: string[] };

/**
 * Sends status updates to the recipient. Dispatch is special: the six-digit
 * delivery code is delivered through every configured recipient-safe channel.
 * The admin route receives only the delivery report, never the raw code.
 */
export async function notifyCustomer(
  order: Record<string, unknown>,
  kind: CustomerMailKind,
  options: CustomerMessageOptions = {}
): Promise<CustomerMessageReport> {
  const o = order as Record<string, any>;
  const code = String(o.id ?? "").slice(0, 8).toUpperCase();
  const track = options.trackingUrl || "";
  const subjects: Record<CustomerMailKind, string> = {
    placed: `Taj Gifts · order ${code} received`,
    confirm: `Taj Gifts · order ${code} confirmed`,
    pack: `Taj Gifts · order ${code} is packed & ribbon-tied`,
    dispatch: `Taj Gifts · order ${code} is out for delivery — your secure code`,
    deliver: `Taj Gifts · order ${code} delivered — thank you!`,
    cancel: `Taj Gifts · order ${code} cancelled`,
    mark_paid: `Taj Gifts · payment received for order ${code}`,
  };
  const trackLine = track ? `<br/><br/>Private order tracking: <a href="${esc(track)}">open your secure order page</a>.` : "";
  const bodies: Record<CustomerMailKind, string> = {
    placed: `Thank you ${esc(o.customer_name ?? "")}! We have received order <b>${esc(code)}</b> for ₹${esc(o.total)}. The studio will confirm and prepare it after reviewing the order details.${trackLine}`,
    confirm: `Good news — order <b>${esc(code)}</b> is confirmed and being prepared.${trackLine}`, 
    pack: `Your hamper for order <b>${esc(code)}</b> is packed, ribbon-tied and labelled. Delivery update comes next.${trackLine}`,
    dispatch: `Order <b>${esc(code)}</b> is out for delivery.<br/><br/><b>Your one-time delivery code: <span style="font-size:24px;letter-spacing:4px">${esc(options.otp || "------")}</span></b><br/><br/>Share this code only when your Taj hamper is safely in your hands. It expires ${options.otpExpiresAt ? `at ${esc(new Date(options.otpExpiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }))}` : "soon"}.${trackLine}`,
    deliver: `Order <b>${esc(code)}</b> has been delivered and handover-verified. Thank you for gifting with Taj Gifts!`,
    cancel: `Order <b>${esc(code)}</b> has been cancelled. For payment or refund-status questions, please contact the studio with this order code.`, 
    mark_paid: `We have received and verified your payment for order <b>${esc(code)}</b>. Thank you!`,
  };
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:32px;background:#FBF7EF;color:#3E362C">
    <p style="font-family:Georgia,serif;font-size:30px;font-weight:700;margin:0">Taj<span style="color:#C0697A">.</span></p>
    <p style="font-size:15px;line-height:1.65;margin:18px 0">${bodies[kind]}</p>
    <p style="font-size:12px;color:#6b6257">Taj Gifts · Kashipur, Uttarakhand 244713 · +91 76688 19833 · tajgifts.netlify.app</p>
  </div>`;

  const email = o.customer_email ? emailRaw(String(o.customer_email), subjects[kind], html) : Promise.resolve(false);
  const wa = kind === "dispatch" && options.otp ? customerOtpWhatsApp(o, options) : Promise.resolve(false);
  const hook = kind === "dispatch" && options.otp ? deliveryOtpWebhook(o, options) : Promise.resolve(false);
  const [emailOk, whatsappOk, webhookOk] = await Promise.all([email, wa, hook]);
  const channels = [emailOk ? "email" : "", whatsappOk ? "whatsapp" : "", webhookOk ? "webhook" : ""].filter(Boolean);
  return { email: emailOk, whatsapp: whatsappOk, webhook: webhookOk, channels };
}

/** Official Meta WhatsApp template. Recipient must have opted in as required by Meta. */
async function customerOtpWhatsApp(order: Record<string, any>, options: CustomerMessageOptions): Promise<boolean> {
  try {
    const cfg = await apiCfg();
    const token = cfg.metaWaToken;
    const phoneId = cfg.metaWaPhoneId;
    const template = cfg.metaCustomerOtpTemplate;
    const to = String(order.customer_phone || "").replace(/\D/g, "").slice(-10);
    if (!token || !phoneId || !template || !to || !options.otp) return false;
    const expiry = options.otpExpiresAt
      ? new Date(options.otpExpiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
      : "shortly";
    const body = [
      String(order.id || "").slice(0, 8).toUpperCase(),
      options.otp,
      expiry,
    ].map((text) => ({ type: "text", text }));
    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `91${to}`,
        type: "template",
        template: {
          name: template,
          language: { code: cfg.metaCustomerOtpLanguage || "en" },
          components: [{ type: "body", parameters: body }],
        },
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Generic server-to-server bridge for a verified SMS/WhatsApp provider. */
async function deliveryOtpWebhook(order: Record<string, any>, options: CustomerMessageOptions): Promise<boolean> {
  try {
    const cfg = await apiCfg();
    if (!cfg.otpWebhookUrl || !options.otp) return false;
    const r = await fetch(cfg.otpWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "taj_delivery_otp",
        orderId: order.id,
        orderCode: String(order.id || "").slice(0, 8).toUpperCase(),
        recipient: { name: order.customer_name, phone: `91${String(order.customer_phone || "").replace(/\D/g, "").slice(-10)}`, email: order.customer_email || null },
        otp: options.otp,
        expiresAt: options.otpExpiresAt || null,
        trackingUrl: options.trackingUrl || null,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

async function emailRaw(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const cfg = await apiCfg();
    const resend = cfg.resendKey;
    const from = cfg.mailFrom || cfg.resendFrom || "Taj Gifts <tajgifts.orders@gmail.com>";
    if (resend) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, subject, html }),
      });
      return r.ok;
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
      await transport.sendMail({ from, to, subject, html });
      return true;
    }
  } catch {
    // A delivery message failing must never cancel an order or prevent an OTP from
    // being available in the recipient's private tracking page.
  }
  return false;
}
