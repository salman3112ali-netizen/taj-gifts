import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** Claims only legacy orders whose stored checkout email matches the verified account email. */
export async function POST() {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.email) return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
  const { data, error } = await admin()
    .from("orders")
    .update({ user_id: user.id })
    .is("user_id", null)
    .ilike("customer_email", user.email)
    .select("id");
  if (error) return NextResponse.json({ ok: false, error: "Could not retrieve historic orders." }, { status: 500 });
  return NextResponse.json({ ok: true, claimed: data?.length ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}
