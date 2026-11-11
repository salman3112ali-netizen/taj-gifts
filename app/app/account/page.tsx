"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/use-user";
import { browserSupabase } from "@/lib/supabase/browser";
import { useCart, inr } from "@/lib/cart";
import { orderCode } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function AppAccount() {
  const { user, loading } = useUser();
  const { settings } = useCart();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        await fetch("/api/account/claim-legacy-orders", { method: "POST" });
        const { data, error } = await browserSupabase().from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
        if (error) throw error;
        setOrders((data ?? []) as Order[]);
      } catch {
        // Never fall back to a phone-number lookup: an order history belongs to
        // the signed-in account, not to whoever knows a mobile number.
        setOrders([]);
      }
    })();
  }, [user]);

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      <h1 className="font-display text-[26px] font-medium leading-none">You</h1>

      {!loading && !user ? (
        <div className="mt-6 rounded-[24px] border border-line bg-white/70 p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blush">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a2505f" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-5.5 8-5.5S18.5 17 20 21" /></svg>
          </div>
          <p className="font-display mt-3 text-xl font-medium">Welcome to Taj Gifts</p>
          <p className="mx-auto mt-1 max-w-[240px] text-[13px] text-ink-soft">Sign in to place orders, protect your delivery details and see your order history.</p>
          <Link href="/login?next=/app/account" className="btn-primary mt-4 w-full justify-center py-3.5 text-[11px]">Sign in</Link>
          <Link href="/signup?next=/app/account" className="btn-ghost mt-2 w-full justify-center py-3.5 text-[11px]">Create an account</Link>
        </div>
      ) : user ? (
        <div className="mt-5 rounded-[24px] border border-line bg-white/70 p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rose">Signed in</p>
          <p className="mt-1 truncate text-[14px] font-medium">{user.email}</p>
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="font-display text-[17px] font-medium">Your orders</h2>
        {!user && !loading && <p className="mt-4 text-[13px] text-ink-soft">Sign in to see the orders saved to your account.</p>}
        {user && orders && orders.length === 0 && <p className="mt-4 text-[13px] text-ink-soft">No orders yet — your first hamper is waiting 🎀</p>}
        <ul className="mt-3 space-y-2.5">
          {(orders ?? []).map((o) => (
            <li key={o.id}>
              <Link href={`/app/order/${o.id}`} className="flex items-center justify-between rounded-[20px] border border-line bg-white/70 p-4 active:scale-[0.99]">
                <div>
                  <p className="text-[13px] font-medium">{orderCode(o.id)}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {o.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[15px] font-medium">{inr(o.total)}</p>
                  <span className={"mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider " + (o.status === "delivered" ? "bg-mint text-ink" : o.status === "cancelled" ? "bg-blush text-rose-deep" : "bg-butter text-ink")}>{o.status}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid gap-2.5 pb-6">
        <a className="btn-ghost w-full justify-center py-3.5 text-[11px]" href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer">Chat with the studio</a>
        <Link className="btn-ghost w-full justify-center py-3.5 text-[11px]" href="/download">Get the app / share it</Link>
        {user && (
          <button
            className="w-full rounded-full border border-ink/15 py-3.5 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft"
            onClick={async () => { await browserSupabase().auth.signOut(); location.reload(); }}
          >
            Log out
          </button>
        )}
      </section>
    </div>
  );
}
