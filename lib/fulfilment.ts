import crypto from "crypto";
import { admin } from "@/lib/supabase";

/**
 * Server-only fulfilment security primitives.
 * The delivery code is never kept in an order timeline or returned to an owner
 * screen. Supabase stores a one-way verifier plus an AES-GCM encrypted display
 * copy that only this server can decrypt for the recipient's private track link.
 */
export const OTP_TTL_MINUTES = 30;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_RESENDS = 3;

export type DeliveryOtp = {
  order_id: string;
  code_hash: string;
  code_ciphertext: string;
  expires_at: string;
  sent_at: string;
  last_sent_at: string;
  resend_count: number;
  attempts: number;
  max_attempts: number;
  verified_at: string | null;
  sent_channels: unknown;
};

function sourceSecret(): string {
  // ADMIN_SECRET is an acceptable fallback for an existing installation. A
  // dedicated DELIVERY_OTP_SECRET can later be rotated independently.
  const value = process.env.DELIVERY_OTP_SECRET || process.env.ADMIN_SECRET || "";
  if (value.length < 32) {
    throw new Error("Delivery security is not configured. Set a 32+ character ADMIN_SECRET or DELIVERY_OTP_SECRET in Netlify.");
  }
  return value;
}

function key(label: string): Buffer {
  return crypto.createHmac("sha256", sourceSecret()).update(`taj-gifts:${label}`).digest();
}

function fixedEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function makeTrackingToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function hashTrackingToken(token: string): string {
  return crypto.createHmac("sha256", key("tracking")).update(token).digest("hex");
}

export function validTrackingToken(storedHash: string | null | undefined, raw: string | null | undefined): boolean {
  if (!storedHash || !raw || raw.length < 20) return false;
  try {
    return fixedEqual(String(storedHash), hashTrackingToken(raw));
  } catch {
    return false;
  }
}

export function trackingUrl(orderId: string, token: string): string {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://tajgifts.netlify.app").replace(/\/$/, "");
  return `${site}/order/${encodeURIComponent(orderId)}?t=${encodeURIComponent(token)}`;
}

function hashOtp(orderId: string, otp: string): string {
  return crypto.createHmac("sha256", key("otp-hash")).update(`${orderId}:${otp}`).digest("hex");
}

function encryptValue(value: string, label: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(label), iv);
  const bytes = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${bytes.toString("base64url")}`;
}

function decryptValue(ciphertext: string, label: string): string | null {
  try {
    const [ivRaw, tagRaw, dataRaw] = String(ciphertext || "").split(".");
    if (!ivRaw || !tagRaw || !dataRaw) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(label), Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataRaw, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function encryptTrackingToken(token: string): string { return encryptValue(token, "tracking-cipher"); }
export function decryptTrackingToken(ciphertext: string | null | undefined): string | null { return decryptValue(String(ciphertext || ""), "tracking-cipher"); }
function encryptOtp(otp: string): string { return encryptValue(otp, "otp-cipher"); }
function decryptOtp(ciphertext: string): string | null { return decryptValue(ciphertext, "otp-cipher"); }

export function newOtpCode(): string {
  return String(crypto.randomInt(100000, 1_000_000));
}

export function otpExpiry(): string {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();
}

export async function writeOrderEvent(
  orderId: string,
  eventType: string,
  title: string,
  note?: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  // Event history is a valuable audit trail but should not prevent the order from
  // moving if a pre-existing database has not yet received the migration.
  try {
    await admin().from("order_events").insert({
      order_id: orderId,
      actor: "owner",
      event_type: eventType,
      title,
      note: note || null,
      metadata,
    });
  } catch {
    /* best-effort audit record */
  }
}

export async function issueDeliveryOtp(
  orderId: string,
  sentChannels: string[],
  resend = false
): Promise<{ code: string; expiresAt: string; resendCount: number }> {
  const sb = admin();
  const { data: current, error: findError } = await sb
    .from("delivery_otps")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (findError && !/does not exist|relation/i.test(findError.message)) throw new Error(findError.message);

  const old = current as DeliveryOtp | null;
  if (resend && old && Number(old.resend_count || 0) >= OTP_MAX_RESENDS) {
    throw new Error(`This delivery code was already resent ${OTP_MAX_RESENDS} times. Contact the customer before creating another delivery attempt.`);
  }

  const code = newOtpCode();
  const expiresAt = otpExpiry();
  const now = new Date().toISOString();
  const resendCount = old ? Number(old.resend_count || 0) + (resend ? 1 : 0) : 0;
  const row = {
    order_id: orderId,
    code_hash: hashOtp(orderId, code),
    code_ciphertext: encryptOtp(code),
    expires_at: expiresAt,
    sent_at: old?.sent_at || now,
    last_sent_at: now,
    resend_count: resendCount,
    attempts: 0,
    max_attempts: OTP_MAX_ATTEMPTS,
    verified_at: null,
    verified_by: null,
    sent_channels: sentChannels,
    updated_at: now,
  };
  const { error } = await sb.from("delivery_otps").upsert(row, { onConflict: "order_id" });
  if (error) {
    if (/does not exist|relation/i.test(error.message)) throw new Error("Delivery OTP database is not installed. Run supabase/migrations/0002_real_fulfilment_and_delivery_otp.sql once, then try again.");
    throw new Error(error.message);
  }
  return { code, expiresAt, resendCount };
}

export async function verifyDeliveryOtp(
  orderId: string,
  supplied: string
): Promise<{ ok: boolean; error?: string; expiresAt?: string }> {
  const normalized = String(supplied || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(normalized)) return { ok: false, error: "Enter the customer’s 6-digit delivery code." };

  const sb = admin();
  const { data, error } = await sb.from("delivery_otps").select("*").eq("order_id", orderId).maybeSingle();
  if (error) return { ok: false, error: "Delivery OTP database is unavailable. Run migration 0002 first." };
  if (!data) return { ok: false, error: "Start delivery first — that creates the customer’s secure code." };
  const otp = data as DeliveryOtp;
  if (otp.verified_at) return { ok: false, error: "This delivery code was already used." };
  if (new Date(otp.expires_at).getTime() < Date.now()) return { ok: false, error: "This delivery code expired. Use Send fresh code, then ask the customer again." };
  if (Number(otp.attempts || 0) >= Number(otp.max_attempts || OTP_MAX_ATTEMPTS)) return { ok: false, error: "Too many wrong codes. Send a fresh delivery code to the customer." };

  const match = fixedEqual(otp.code_hash, hashOtp(orderId, normalized));
  if (!match) {
    await sb.from("delivery_otps").update({ attempts: Number(otp.attempts || 0) + 1, updated_at: new Date().toISOString() }).eq("order_id", orderId);
    const remaining = Math.max(0, Number(otp.max_attempts || OTP_MAX_ATTEMPTS) - Number(otp.attempts || 0) - 1);
    return { ok: false, error: `That code does not match. ${remaining} attempt${remaining === 1 ? "" : "s"} remain.` };
  }

  await sb.from("delivery_otps").update({ verified_at: new Date().toISOString(), verified_by: "owner-app", updated_at: new Date().toISOString() }).eq("order_id", orderId);
  return { ok: true, expiresAt: otp.expires_at };
}

export async function customerVisibleOtp(orderId: string): Promise<{ code: string; expiresAt: string } | null> {
  const { data, error } = await admin().from("delivery_otps").select("*").eq("order_id", orderId).maybeSingle();
  if (error || !data) return null;
  const otp = data as DeliveryOtp;
  if (otp.verified_at || new Date(otp.expires_at).getTime() < Date.now()) return null;
  const code = decryptOtp(otp.code_ciphertext);
  if (!code || !/^\d{6}$/.test(code)) return null;
  return { code, expiresAt: otp.expires_at };
}

export async function otpStatus(orderId: string): Promise<{ active: boolean; expiresAt?: string; resendCount?: number; attempts?: number; sentChannels?: string[] }> {
  const { data, error } = await admin().from("delivery_otps").select("*").eq("order_id", orderId).maybeSingle();
  if (error || !data) return { active: false };
  const row = data as DeliveryOtp;
  return {
    active: !row.verified_at && new Date(row.expires_at).getTime() >= Date.now(),
    expiresAt: row.expires_at,
    resendCount: Number(row.resend_count || 0),
    attempts: Number(row.attempts || 0),
    sentChannels: Array.isArray(row.sent_channels) ? row.sent_channels.filter((x): x is string => typeof x === "string") : [],
  };
}

export async function saveFulfilment(orderId: string, patch: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  const permitted = [
    "delivery_mode", "rider_name", "rider_phone", "courier_name", "tracking_number", "tracking_url",
    "dispatch_note", "latest_attempt_note", "delivery_note", "out_for_delivery_at", "delivered_at",
  ];
  const safe: Record<string, unknown> = { order_id: orderId, updated_at: now };
  for (const key of permitted) if (patch[key] !== undefined) safe[key] = patch[key] || null;
  const { error } = await admin().from("order_fulfilments").upsert(safe, { onConflict: "order_id" });
  if (error && !/does not exist|relation/i.test(error.message)) throw new Error(error.message);
}
