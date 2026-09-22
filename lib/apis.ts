import { admin } from "@/lib/supabase";

/**
 * SINGLE SOURCE OF TRUTH for every external API key/setting.
 * Priority: value saved from the Admin → "APIs & keys" panel (settings.data.apis)
 *           ↓ fallback
 *           Netlify environment variable.
 * Owners can therefore change any integration anytime without touching code or redeploying.
 */
export const API_FIELDS = {
  orderNotifyEmail: "ORDER_NOTIFY_EMAIL",
  resendKey: "RESEND_API_KEY",
  resendFrom: "RESEND_FROM",
  smtpUser: "SMTP_USER",
  smtpPass: "SMTP_APP_PASSWORD",
  smtpHost: "SMTP_HOST",
  smtpPort: "SMTP_PORT",
  mailFrom: "MAIL_FROM",
  webhookUrl: "ORDER_NOTIFY_WEBHOOK",
  metaWaToken: "META_WA_TOKEN",
  metaWaPhoneId: "META_WA_PHONE_ID",
  metaWaTo: "META_WA_TO",
  metaWaTemplate: "META_WA_TEMPLATE",
  telegramToken: "TELEGRAM_BOT_TOKEN",
  telegramChat: "TELEGRAM_CHAT_ID",
  callmebotKey: "CALLMEBOT_API_KEY",
  callmebotPhone: "CALLMEBOT_PHONE",
  rzpKeyId: "RAZORPAY_KEY_ID",
  rzpKeySecret: "RAZORPAY_KEY_SECRET",
  geminiKey: "GEMINI_API_KEY",
  geminiModel: "GEMINI_IMAGE_MODEL",
  openaiKey: "OPENAI_API_KEY",
  openaiModel: "OPENAI_IMAGE_MODEL",
} as const;

export type ApiCfg = Record<keyof typeof API_FIELDS, string>;

let cache: { at: number; cfg: ApiCfg } | null = null;

export async function apiCfg(force = false): Promise<ApiCfg> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.cfg;
  const cfg = {} as ApiCfg;
  for (const [k, envName] of Object.entries(API_FIELDS)) {
    cfg[k as keyof ApiCfg] = process.env[envName] || "";
  }
  try {
    const { data } = await admin().from("settings").select("data").eq("id", "shop").maybeSingle();
    const saved = ((data?.data as Record<string, unknown> | null)?.apis ?? {}) as Record<string, string>;
    for (const k of Object.keys(API_FIELDS) as (keyof ApiCfg)[]) {
      if (typeof saved[k] === "string" && saved[k].trim() !== "") cfg[k] = saved[k];
    }
  } catch {
    /* env-only fallback */
  }
  cache = { at: Date.now(), cfg };
  return cfg;
}

export async function saveApiCfg(patch: Partial<ApiCfg>): Promise<void> {
  const sb = admin();
  const { data } = await sb.from("settings").select("data").eq("id", "shop").maybeSingle();
  const all = (data?.data ?? {}) as Record<string, unknown>;
  const apis = { ...((all.apis ?? {}) as Record<string, string>) };
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in API_FIELDS)) continue;
    if (v === "" || v == null) delete apis[k];
    else apis[k] = String(v);
  }
  all.apis = apis;
  await sb.from("settings").update({ data: all }).eq("id", "shop");
  cache = null;
  await apiCfg(true);
}

/** Which keys currently come from the DB (saved via admin) vs env only. */
export async function savedApiFlags(): Promise<Record<string, boolean>> {
  const flags: Record<string, boolean> = {};
  try {
    const { data } = await admin().from("settings").select("data").eq("id", "shop").maybeSingle();
    const saved = ((data?.data as Record<string, unknown> | null)?.apis ?? {}) as Record<string, string>;
    for (const k of Object.keys(API_FIELDS)) flags[k] = typeof saved[k] === "string" && saved[k].trim() !== "";
  } catch { /* none */ }
  return flags;
}
