import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/supabase/server";
import AccountClient from "./account-client";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function Account({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const tab = (await searchParams).tab;
  return <AccountClient user={{ id: user.id, email: user.email ?? "", name: (user.user_metadata?.full_name as string) || "", phone: (user.user_metadata?.phone as string) || "" }} initialTab={tab} />;
}
