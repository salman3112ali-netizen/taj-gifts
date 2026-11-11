import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { admin } from "@/lib/supabase";
import { getSettings, inr, orderCode, dateTimeFmt, waLink } from "@/lib/store";
import OrderPay from "@/components/order-pay";
import LiveRefresh from "@/components/live-refresh";
import type { Order, OrderItem } from "@/lib/types";
import { getCurrentUser } from "@/lib/supabase/server";
import { customerVisibleOtp, validTrackingToken } from "@/lib/fulfilment";
import { ownsOrClaimsLegacyOrder } from "@/lib/order-access";

export const metadata: Metadata = { title: "Your order" };
export const dynamic = "force-dynamic";

const STATUS_STEPS = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"];
const STEP_LABEL: Record<string, string> = { pending: "placed", confirmed: "confirmed", packed: "packed", out_for_delivery: "on your way", delivered: "delivered" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string; t?: string }> }) {
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
  const [visibleOtp, fulfilment] = await Promise.all([
    customerVisibleOtp(id),
    admin().from("order_fulfilments").select("courier_name,tracking_number,tracking_url,latest_attempt_note").eq("order_id", id).maybeSingle(),
  ]);
  const o = raw as Order;
  const its = (items ?? []) as OrderItem[];
  const stepIdx = o.status === "cancelled" ? -1 : STATUS_STEPS.indexOf(o.status);

  return (
    <section className="wrap max-w-[860px] pb-24 pt-12">
      <LiveRefresh />
      {isNew && (
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mint">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3e362c" strokeWidth="2.4"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          </div>
          <h1 className="font-display mt-6 text-5xl font-medium leading-tight">Order received.</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-soft">
            Thank you, {o.customer_name.split(" ")[0]}! Your order is saved in your private account area. The studio will update its status as it is confirmed and prepared.
          </p>
        </div>
      )}

      <div className="rounded-[32px] border border-line bg-white/70 p-8 backdrop-blur md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Order {orderCode(o.id)}</p>
            <p className="mt-2 text-sm text-ink-soft">Placed {dateTimeFmt(o.created_at)} · {o.payment_method} · payment {o.payment_status}</p>
          </div>
          <p className="font-display text-3xl font-medium">{inr(o.total)}</p>
        </div>

        {o.status !== "cancelled" ? (
          <div className="mt-9 flex items-center">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <span className={"grid h-9 w-9 place-items-center rounded-full border-2 text-[11px] font-medium uppercase transition " + (i <= stepIdx ? "border-rose bg-rose text-white" : "border-ink/15 bg-cream text-ink-soft")}>
                    {i < stepIdx ? "✓" : i + 1}
                  </span>
                  <span className={"text-[10px] font-medium uppercase tracking-wider " + (i <= stepIdx ? "text-rose" : "text-ink-soft/60")}>{STEP_LABEL[s] ?? s}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && <div className={"mx-2 mb-5 h-0.5 flex-1 rounded " + (i < stepIdx ? "bg-rose" : "bg-ink/10")} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl bg-blush px-5 py-3 text-sm font-medium text-rose-deep">This order was cancelled. Write to us if that's a mistake!</p>
        )}

        <ul className="mt-9 divide-y divide-line border-y border-line">
          {its.map((it) => (
            <li key={it.id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-deep"><img src={it.image || "/img/hero.jpg"} alt={it.name} className="h-full w-full object-cover" /></div>
              <div className="flex-1">
                <p className="font-display text-[16px] font-medium">{it.name}</p>
                <p className="text-[12px] text-ink-soft">{it.variant ?? "As shown"}{it.addons?.length ? ` · +${it.addons.map((a) => a.label).join(", +")}` : ""} · qty {it.qty}</p>
              </div>
              <p className="font-medium">{inr(it.line_total)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="space-y-1.5 text-sm">
            <p className="label">Totals</p>
            <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><b>{inr(o.subtotal)}</b></div>
            {o.discount > 0 && <div className="flex justify-between text-mint-deep"><span>Coupon {o.coupon}</span><b>−{inr(o.discount)}</b></div>}
            <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><b>{o.delivery_charge === 0 ? "FREE" : inr(o.delivery_charge)}</b></div>
            <div className="flex justify-between border-t border-line pt-2 font-display text-xl font-medium"><span>Total</span><span>{inr(o.total)}</span></div>
          </div>
          <div className="text-sm">
            <p className="label">Delivering to</p>
            <p className="font-medium">{o.customer_name} · {o.customer_phone}</p>
            <p className="mt-1 text-ink-soft">{o.customer_address}{o.customer_landmark ? `, ${o.customer_landmark}` : ""}, {o.customer_city} — {o.customer_pincode}</p>
            {o.gift_note && <p className="mt-3 rounded-xl bg-butter/70 px-4 py-3 font-script text-lg leading-snug">“{o.gift_note}”{o.gift_sender_name ? ` — ${o.gift_sender_name}` : ""}</p>}
          </div>
        </div>

        {o.payment_method === "UPI" && o.payment_status === "pending" && o.status !== "cancelled" && (
          <OrderPay orderId={o.id} total={o.total} upiId={settings.upiId} payeeName={settings.payeeName} code={orderCode(o.id)} />
        )}

        {visibleOtp && (
          <div className="mt-7 rounded-2xl bg-butter/70 p-5 text-sm">
            <p className="font-medium">Your delivery code: <span className="ml-1 rounded-lg bg-white px-3 py-1 font-mono text-xl font-medium tracking-[0.22em]">{visibleOtp.code}</span></p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
              Share this one-time 6-digit code only when your Taj hamper is safely in your hands. It expires at {new Date(visibleOtp.expiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.
            </p>
          </div>
        )}
        {fulfilment.data?.tracking_url && (
          <a className="btn-ghost mt-4" href={fulfilment.data.tracking_url} target="_blank" rel="noreferrer">Track courier parcel ↗</a>
        )}
        {fulfilment.data?.latest_attempt_note && o.status === "out_for_delivery" && (
          <p className="mt-4 rounded-xl bg-lav/60 px-4 py-3 text-[13px] text-ink-soft">Delivery note: {fulfilment.data.latest_attempt_note}</p>
        )}

        <div className="mt-9 grid items-center gap-8 rounded-[28px] bg-cream-deep/60 p-6 md:grid-cols-[180px_1fr]">
          <div className="aspect-[4/5] overflow-hidden rounded-[22px] bg-white">
            <img src={its[0]?.image || "/img/hero.jpg"} alt={its[0]?.name || "Taj Gifts hamper"} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="eyebrow">Need help with this order?</p>
            <h2 className="font-display mt-2 text-2xl font-medium leading-snug">Your order details are saved here.</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
              The image is a product reference from your order, not a photograph of the final packed hamper. For a delivery question or an allowed change, contact the studio with your order code.
            </p>
            <a
              className="btn-ghost mt-4"
              href={waLink(settings.whatsapp, `Hi! About order ${orderCode(o.id)} — I'd like help with: `)}
              target="_blank"
              rel="noreferrer"
            >
              Contact the studio on WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-9 flex flex-wrap gap-4">
          <a className="btn-primary" href={waLink(settings.whatsapp, `Hi! My order ${orderCode(o.id)} — just checking in 🙂`)} target="_blank" rel="noreferrer">Track on WhatsApp</a>
          <Link className="btn-ghost" href="/shop">Send another gift</Link>
        </div>
      </div>
    </section>
  );
}
