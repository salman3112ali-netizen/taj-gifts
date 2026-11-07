import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { apiCfg, saveApiCfg, savedApiFlags, API_FIELDS, type ApiCfg } from "@/lib/apis";

/** Admin-only control center for every external API key / integration setting. */
export async function GET() {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const cfg = await apiCfg(true);
  const fromEnv: Record<string, boolean> = {};
  for (const [k, envName] of Object.entries(API_FIELDS)) fromEnv[k] = !!process.env[envName];
  const saved = await savedApiFlags();
  return NextResponse.json({ ok: true, values: cfg, fromEnv, saved, fields: Object.keys(API_FIELDS) });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json()) as Partial<ApiCfg>;
  const patch: Partial<ApiCfg> = {};
  for (const k of Object.keys(API_FIELDS) as (keyof ApiCfg)[]) {
    if (k in body) patch[k] = String(body[k] ?? "").trim();
  }
  await saveApiCfg(patch);
  return NextResponse.json({ ok: true });
}

/** { test: "email" | "wa" | "telegram" | "webhook" } — live-fire one sample alert */
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) return NextResponse.json({ ok: false }, { status: 401 });
  const { test } = await req.json();
  const cfg = await apiCfg(true);
  const sample = {
    order: { id: "test-" + Date.now(), total: 999, customer_name: "API Test", customer_city: "Kashipur", customer_phone: "9999999999" },
    brief: "🧪 TEST alert from your Taj Gifts admin panel — this channel works!",
    items: [{ name: "Test hamper", qty: 1, variant: null, addons: [], line_total: 999 }],
  };
  try {
    if (test === "email") {
      if (!cfg.orderNotifyEmail) return NextResponse.json({ ok: false, error: "Set the owner alert email first." }, { status: 400 });
      if (!cfg.resendKey && !cfg.smtpUser) return NextResponse.json({ ok: false, error: "Set a Resend key or SMTP login first." }, { status: 400 });
      const { notifyOwners } = await import("@/lib/notify");
      await notifyOwners(sample as never);
      return NextResponse.json({ ok: true, msg: `Test email sent to ${cfg.orderNotifyEmail}` });
    }
    if (test === "wa") {
      if (!cfg.metaWaToken || !cfg.metaWaPhoneId || !cfg.metaWaTo) return NextResponse.json({ ok: false, error: "Fill all three WhatsApp Cloud fields first." }, { status: 400 });
      const r = await fetch(`https://graph.facebook.com/v21.0/${cfg.metaWaPhoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.metaWaToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: cfg.metaWaTo.replace(/\D/g, ""), type: "text", text: { body: sample.brief } }),
      });
      return r.ok ? NextResponse.json({ ok: true, msg: "Test WhatsApp sent." }) : NextResponse.json({ ok: false, error: "WhatsApp API rejected it — check token/phone-id." }, { status: 502 });
    }
    if (test === "telegram") {
      if (!cfg.telegramToken || !cfg.telegramChat) return NextResponse.json({ ok: false, error: "Fill Telegram token + chat id first." }, { status: 400 });
      const r = await fetch(`https://api.telegram.org/bot${cfg.telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: cfg.telegramChat, text: sample.brief }),
      });
      return r.ok ? NextResponse.json({ ok: true, msg: "Test Telegram message sent." }) : NextResponse.json({ ok: false, error: "Telegram rejected it — check token/chat id." }, { status: 502 });
    }
    if (test === "webhook") {
      if (!cfg.webhookUrl) return NextResponse.json({ ok: false, error: "Set the webhook URL first." }, { status: 400 });
      const r = await fetch(cfg.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sample) });
      return NextResponse.json({ ok: r.ok, msg: r.ok ? "Webhook responded OK." : "Webhook returned " + r.status });
    }
    return NextResponse.json({ ok: false, error: "unknown test" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "test failed" }, { status: 500 });
  }
}
