import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

/**
 * A narrowly-scoped customer-app session. It is issued only after Supabase proves
 * an email/password or Google identity, and lets the real native Android client
 * identify the customer without putting a Supabase refresh token in the APK.
 */
export type CustomerAppIdentity = {
  id: string;
  email: string;
  name: string;
  exp: number;
  type: "taj_customer_app";
};

function secret() {
  const value = process.env.CUSTOMER_APP_TOKEN_SECRET || process.env.ADMIN_SECRET || "";
  if (value.length < 32) throw new Error("Customer app security is not configured.");
  return value;
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeCustomerAppToken(input: { id: string; email?: string | null; name?: string | null }) {
  const identity: CustomerAppIdentity = {
    id: input.id,
    email: String(input.email || ""),
    name: String(input.name || "").slice(0, 120),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
    type: "taj_customer_app",
  };
  const payload = encode(identity);
  return { token: `${payload}.${sign(payload)}`, expiresAt: identity.exp, identity };
}

export function customerAppIdentity(req: NextRequest | Request): CustomerAppIdentity | null {
  try {
    const raw = req.headers.get("authorization") || "";
    if (!raw.startsWith("Bearer ")) return null;
    const [payload, signature, extra] = raw.slice(7).trim().split(".");
    if (!payload || !signature || extra) return null;
    const expected = sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CustomerAppIdentity;
    if (parsed.type !== "taj_customer_app" || !parsed.id || !Number.isFinite(parsed.exp) || parsed.exp <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
