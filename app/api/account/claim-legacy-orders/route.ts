import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Binds historical guest-era orders to the signed-in account — but only when the
 * email stored on the order matches the verified account email exactly.
 *
 * Deliberately NOT using .ilike(): an email containing "_" or "%" would be read
 * as a SQL wildcard and could pull in another customer's order.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req).catch(() => null);
  if (!user?.email) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const email = user.email.trim().toLowerCase();

  const sb = admin();
  const { data: candidates, error } = await sb
    .from("orders")
    .select("id,customer_email")
    .is("user_id", null)
    .limit(500);
  if (error) return NextResponse.json({ ok: false, error: "Could not retrieve historic orders." }, { status: 500 });

  const ids = (candidates ?? [])
    .filter((row) => String((row as { customer_email?: string | null }).customer_email ?? "").trim().toLowerCase() === email)
    .map((row) => (row as { id: string }).id);
  if (!ids.length) return NextResponse.json({ ok: true, claimed: 0 }, { headers: { "Cache-Control": "no-store" } });

  const { data, error: updateError } = await sb
    .from("orders")
    .update({ user_id: user.id })
    .in("id", ids)
    .is("user_id", null)
    .select("id");
  if (updateError) return NextResponse.json({ ok: false, error: "Could not retrieve historic orders." }, { status: 500 });
  return NextResponse.json({ ok: true, claimed: data?.length ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}
