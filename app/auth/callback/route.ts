import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  if (code) {
    const supabase = await serverSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/account"}`);
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
  return NextResponse.redirect(`${origin}/login`);
}
