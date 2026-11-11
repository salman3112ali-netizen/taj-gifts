import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { makeCustomerAppToken } from "@/lib/customer-app-auth";

export const dynamic = "force-dynamic";

type Hit = { at: number; count: number };
const hits = new Map<string, Hit>();

function clientIp(req: NextRequest) {
  return (req.headers.get("x-nf-client-ip") || req.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0].trim().slice(0, 80);
}

/** Cheap in-process guard; the durable counter is in Postgres below. */
function allowed(req: NextRequest) {
  const ip = clientIp(req);
  const now = Date.now();
  if (hits.size > 5000) hits.clear(); // never grow without bound
  const last = hits.get(ip);
  const next: Hit = !last || now - last.at > 15 * 60_000 ? { at: now, count: 1 } : { at: last.at, count: last.count + 1 };
  hits.set(ip, next);
  return next.count <= 12;
}

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !anon) throw new Error("Taj account service is not configured yet.");
  // Implicit flow places a short-lived access token in the tajgifts:// callback
  // fragment; Android forwards it here once for verification and receives only a
  // narrower Taj customer token in return.
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" } });
}

function responseForUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const session = makeCustomerAppToken({ id: user.id, email: user.email, name });
  return NextResponse.json({
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    user: { id: session.identity.id, email: session.identity.email, name: session.identity.name },
  }, { headers: { "Cache-Control": "no-store" } });
}

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email or password doesn't match a Taj Gifts account.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first, then sign in in the Taj app.";
  if (/rate limit/i.test(message)) return "Please wait a few minutes before trying again.";
  if (/redirect.*allow|redirect.*valid/i.test(message)) return "Native sign-in still needs tajgifts://auth/callback in Supabase Redirect URLs.";
  return message || "Account request could not be completed.";
}

/** A non-sensitive deployment check: it lets the owner verify the real site has this API before installing the APK. */
export async function GET() {
  try {
    makeCustomerAppToken({ id: "health-check" });
    authClient();
    return NextResponse.json({ ok: true, service: "Taj Gifts native account API" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Native account service needs its Netlify environment variables." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ ok: false, error: "Too many account attempts. Please wait 15 minutes." }, { status: 429 });
  try {
    // Durable per-connection limit so restarting a serverless instance cannot
    // reset a password-guessing budget.
    try {
      const { admin } = await import("@/lib/supabase");
      const { data: ok } = await admin().rpc("taj_rate_limit", {
        p_key: `app_auth:${clientIp(req)}`,
        p_max: 20,
        p_window_seconds: 900,
      });
      if (ok === false) return NextResponse.json({ ok: false, error: "Too many account attempts. Please wait 15 minutes." }, { status: 429 });
    } catch {
      /* limiter unavailable — keep the in-process guard */
    }
    const body = await req.json();
    const action = String(body.action || "");
    const client = authClient();

    if (action === "login") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
        return NextResponse.json({ ok: false, error: "Enter a valid email and password." }, { status: 400 });
      }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error || !data.user) return NextResponse.json({ ok: false, error: friendly(error?.message || "Sign-in failed.") }, { status: 401 });
      return responseForUser(data.user);
    }

    if (action === "signup") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim().slice(0, 120);
      if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || password.length > 200) {
        return NextResponse.json({ ok: false, error: "Enter your name, a valid email and a password with at least 10 characters." }, { status: 400 });
      }
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          // After confirmation Supabase returns directly to Android. If the auth
          // provider does not attach an access token, the app simply shows native
          // sign-in — it never strands the customer on the website.
          emailRedirectTo: "tajgifts://auth/callback?confirmed=1",
        },
      });
      if (error) return NextResponse.json({ ok: false, error: friendly(error.message) }, { status: 400 });
      // If a project disables email confirmation, sign the customer in directly.
      if (data.session && data.user) return responseForUser(data.user);
      return NextResponse.json({ ok: true, confirmationRequired: true, message: "Check your email, confirm your Taj Gifts account, then return here and sign in." });
    }

    if (action === "google_url") {
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: "tajgifts://auth/callback", skipBrowserRedirect: true },
      });
      if (error || !data.url) return NextResponse.json({ ok: false, error: friendly(error?.message || "Google sign-in is not ready yet.") }, { status: 400 });
      return NextResponse.json({ ok: true, url: data.url });
    }

    if (action === "exchange_google") {
      const accessToken = String(body.accessToken || "");
      if (accessToken.length < 40) return NextResponse.json({ ok: false, error: "The Google sign-in reply was incomplete. Please try again." }, { status: 400 });
      const { data, error } = await client.auth.getUser(accessToken);
      if (error || !data.user) return NextResponse.json({ ok: false, error: friendly(error?.message || "Google sign-in could not be verified.") }, { status: 401 });
      return responseForUser(data.user);
    }

    return NextResponse.json({ ok: false, error: "Unknown account action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Account service is unavailable." }, { status: 500 });
  }
}
