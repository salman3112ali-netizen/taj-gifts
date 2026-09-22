import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

const COOKIE = "taj_admin_session";
const secret = () => process.env.ADMIN_SECRET || "taj-gifts-dev-secret";

/** scope "app" = the private Android admin app (1-year session). "web" = browser (session-only). */
export type SessionScope = "web" | "app";
export const ADMIN_APP_UA = "TajAdminApp";

export function makeToken(hours: number, scope: SessionScope = "web") {
  const exp = Date.now() + hours * 3600_000;
  const sig = createHmac("sha256", secret()).update(`${exp}.${scope}`).digest("hex");
  return `${exp}.${scope}.${sig}`;
}

export function verifyToken(token: string | undefined): { ok: boolean; scope: SessionScope } {
  const fail = { ok: false, scope: "web" as SessionScope };
  if (!token) return fail;
  const [exp, scope, sig] = token.split(".");
  if (!exp || !scope || !sig) return fail; // legacy 2-part tokens are dead — everyone re-logins once
  if (scope !== "web" && scope !== "app") return fail;
  if (Number(exp) < Date.now()) return fail;
  const expected = createHmac("sha256", secret()).update(`${exp}.${scope}`).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return fail;
  } catch {
    return fail;
  }
  return { ok: true, scope };
}

/**
 * Website = password on EVERY tab/visit: auth lives in a per-tab sessionStorage bearer
 * token (dies with the tab). No persistent web cookie exists at all.
 * Admin app = 1-year cookie, accepted ONLY from the app's user-agent.
 */
export async function isAdminRequest(): Promise<boolean> {
  const h = await headers();
  const auth = h.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return verifyToken(auth.slice(7).trim()).ok;
  const store = await cookies();
  const v = verifyToken(store.get(COOKIE)?.value);
  if (!v.ok || v.scope !== "app") return false; // cookies are app-only
  const ua = h.get("user-agent") || "";
  return ua.includes(ADMIN_APP_UA); // stolen app cookie in a browser = useless
}

export const ADMIN_COOKIE = COOKIE;
