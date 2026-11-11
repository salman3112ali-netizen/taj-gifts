import type { User } from "@supabase/supabase-js";
import { admin } from "@/lib/supabase";

/**
 * Account ownership check for a customer order. Historic guest orders can be
 * claimed exactly once when the customer signs in with the same verified email;
 * a bare UUID is never treated as authorization.
 */
export async function ownsOrClaimsLegacyOrder(
  order: { id: string; user_id?: string | null; customer_email?: string | null },
  user: User | { id: string; email?: string | null } | null
): Promise<boolean> {
  if (!user) return false;
  if (order.user_id === user.id) return true;
  const email = String(user.email || "").trim().toLowerCase();
  if (order.user_id || !email || String(order.customer_email || "").trim().toLowerCase() !== email) return false;

  // Race-safe: only an ownerless legacy order with this exact email can be bound.
  const { data, error } = await admin()
    .from("orders")
    .update({ user_id: user.id })
    .eq("id", order.id)
    .is("user_id", null)
    .ilike("customer_email", email)
    .select("id")
    .maybeSingle();
  if (error) return false;
  return !!data;
}
