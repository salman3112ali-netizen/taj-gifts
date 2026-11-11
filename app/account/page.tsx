import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase";
import AccountClient from "./account-client";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  // Historic pre-account orders can be linked only by an EXACT, case-insensitive
  // match on the signed-in account's verified email. A SQL ILIKE would treat
  // characters such as "_" and "%" as wildcards inside an email address and could
  // attach another customer's order to this account, so matching happens in code.
  if (user.email) {
    const email = user.email.trim().toLowerCase();
    const { data: legacy } = await admin()
      .from("orders")
      .select("id,customer_email")
      .is("user_id", null)
      .not("customer_email", "is", null);
    const claimable = (legacy ?? [])
      .filter((row) => String((row as { customer_email: string | null }).customer_email ?? "").trim().toLowerCase() === email)
      .map((row) => (row as { id: string }).id);
    if (claimable.length) {
      await admin().from("orders").update({ user_id: user.id }).in("id", claimable).is("user_id", null);
    }
  }
  const tab = (await searchParams).tab;
  return <AccountClient user={{ id: user.id, email: user.email ?? "", name: (user.user_metadata?.full_name as string) || "", phone: (user.user_metadata?.phone as string) || "" }} initialTab={tab} />;
}
