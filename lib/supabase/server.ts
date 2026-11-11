import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function serverSupabase() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, ...opts } of cookiesToSet) store.set(name, value, opts as never);
          } catch {
            // called from Server Component — ignore, middleware refreshes
          }
        },
      },
    }
  );
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await serverSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Resolve the signed-in customer for an API route that may be called by
 *   · the browser (Supabase session cookie), or
 *   · the native Taj Gifts app (Supabase access token in the Authorization header).
 *
 * The native app signs in through Supabase Auth directly, so it holds a real
 * access token rather than our cookie. We never trust the token's contents —
 * Supabase validates the signature and expiry on the server before we use it.
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
  const cookieUser = await getCurrentUser().catch(() => null);
  if (cookieUser) return cookieUser;

  const raw = req.headers.get("authorization") || "";
  if (!raw.toLowerCase().startsWith("bearer ")) return null;
  const token = raw.slice(7).trim();

  // A Supabase access token is a three-part JWT. The private Taj app token has
  // two parts and is verified separately by customerAppIdentity().
  if (token.split(".").length !== 3 || token.length > 4096) return null;
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data, error } = await client.auth.getUser(token);
    return error ? null : data.user ?? null;
  } catch {
    return null;
  }
}
