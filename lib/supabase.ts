import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Public client — safe for browser, respects RLS. */
export const supabase = createClient(url, anon);

let _admin: SupabaseClient | null = null;
/** Server-only client with full privileges. Never import into client components. */
export function admin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
