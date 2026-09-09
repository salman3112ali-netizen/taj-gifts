import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "taj_admin_session";
const secret = () => process.env.ADMIN_SECRET || "taj-gifts-dev-secret";

export function makeToken(hours = 12) {
  const exp = Date.now() + hours * 3600_000;
  const sig = createHmac("sha256", secret()).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}

export function verifyToken(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expected = createHmac("sha256", secret()).update(exp).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

export const ADMIN_COOKIE = COOKIE;
