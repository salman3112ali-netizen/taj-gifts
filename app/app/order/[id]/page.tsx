import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase";
import { getSettings, inr, orderCode, dateTimeFmt, waLink } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";
import { getCurrentUser } from "@/lib/supabase/server";
import { customerVisibleOtp, validTrackingToken } from "@/lib/fulfilment";
import { ownsOrClaimsLegacyOrder } from "@/lib/order-access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order · Taj Gifts App", robots: { index: false } };

const STEPS = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"];

export default async function AppOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string; t?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const isNew = query.new === "1";
  const [{ data: order }, { data: items }, settings] = await Promise.all([
    admin().from("orders").select("*").eq("id", id).maybeSingle(),
    admin().from("order_items").select("*").eq("order_id", id),
    getSettings(),
  ]);
  if (!order) notFound();
  const raw = order as Order & { tracking_token_hash?: string | null; user_id?: string | null };
  const account = await getCurrentUser().catch(() => null);
  const accountAllowed = await ownsOrClaimsLegacyOrder(raw, account);
  const allowed = validTrackingToken(raw.tracking_token_hash, query.t) || accountAllowed;
  if (!allowed) notFound();
  const visibleOtp = await customerVisibleOtp(id);
  const o = raw as Order;
  const its = (items ?? []) as OrderItem[];
  const stepIdx = o.status === "cancelled" ? -1 : STEPS.indexOf(o.status);

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      {isNew && (
        <div className="mb-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3e362c" strokeWidth="2.4"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          </div>
          <h1 className="font-display mt-3 text-[26px] font-medium leading-tight">Order received.</h1>
          <p className="mx-auto mt-1 max-w-[280px] text-[13px] text-ink-soft">Thank you, {o.customer_name.split(" ")[0]}! Your order is saved in your private account area.</p>
        </div>
      )}

      <div className="rounded-[24px] border border-line bg-white/70 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-rose">Order {orderCode(o.id)}</p>
            <p className="mt-1 text-[11px] text-ink-soft">{dateTimeFmt(o.created_at)} · {o.payment_method}</p>
          </div>
          <p className="font-display text-[22px] font-medium">{inr(o.total)}</p>
        </div>

        {o.status !== "cancelled" ? (
          <ol className="mt-5 space-y-0">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={"grid h-8 w-8 place-items-center rounded-full border-2 text-[10px] font-medium uppercase " + (i <= stepIdx ? "border-rose bg-rose text-white" : "border-ink/15 bg-cream text-ink-soft")}>
                    {i < stepIdx ? "✓" : i + 1}
                  </span>
                  {i < STEPS.length - 1 && <span className={"w-0.5 flex-1 " + (i < stepIdx ? "bg-rose" : "bg-ink/10")} style={{ minHeight: 18 }} />}
                </div>
                <p className={"pb-4 pt-1.5 text-[13px] font-medium uppercase tracking-[0.12em] " + (i <= stepIdx ? "text-rose" : "text-ink-soft/60")}>{s}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-5 rounded-xl bg-blush px-4 py-3 text-[13px] font-medium text-rose-deep">This order was cancelled.</p>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-line bg-white/70">
        <img src={its[0]?.image || "/img/hero.jpg"} alt={its[0]?.name || "Taj Gifts hamper"} className="aspect-[4/3.4] w-full object-cover" />
        <p className="px-4 py-3 text-center text-[12px] text-ink-soft">Product reference image from your order</p>
      </div>

      <ul className="mt-4 space-y-2 rounded-[24px] border border-line bg-white/70 p-4">
        {its.map((i) => (
          <li key={i.id} className="flex items-center justify-between text-[13.5px]">
            <span className="font-medium">{i.name}{i.variant ? ` (${i.variant})` : ""} × {i.qty}</span>
            <span className="font-medium">{inr(i.line_total)}</span>
          </li>
        ))}
      </ul>

      {visibleOtp && (
        <div className="mt-4 rounded-[24px] bg-ink p-5 text-cream">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-blush">Doorstep handover code</p>
          <p className="mt-2 font-mono text-[30px] font-medium tracking-[0.24em]">{visibleOtp.code}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-cream/75">Share this six-digit code only after your Taj hamper is safely in your hands. It expires at {new Date(visibleOtp.expiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.</p>
        </div>
      )}

      <div className="mt-4 grid gap-2.5 pb-6">
        <a className="btn-primary w-full justify-center py-3.5 text-[11px]" href={waLink(settings.whatsapp, `Hi! My order ${orderCode(o.id)} — just checking in 🙂`)} target="_blank" rel="noreferrer">Track on WhatsApp</a>
        <Link className="btn-ghost w-full justify-center py-3.5 text-[11px]" href="/app/shop">Send another gift</Link>
      </div>
    </div>
  );
}
