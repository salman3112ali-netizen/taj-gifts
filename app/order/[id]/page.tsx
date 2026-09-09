import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { admin } from "@/lib/supabase";
import { getSettings, inr, orderCode, dateTimeFmt, waLink } from "@/lib/store";
import { hamperArtUrl } from "@/lib/hamper-art";
import { workOrderLink } from "@/lib/workorder";
import HamperArt from "@/components/hamper-art";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = { title: "Your order" };
export const dynamic = "force-dynamic";

const STATUS_STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const { id } = await params;
  const isNew = (await searchParams).new === "1";
  const [{ data: order }, { data: items }, settings] = await Promise.all([
    admin().from("orders").select("*").eq("id", id).maybeSingle(),
    admin().from("order_items").select("*").eq("order_id", id),
    getSettings(),
  ]);
  if (!order) notFound();
  const o = order as Order;
  const its = (items ?? []) as OrderItem[];
  const stepIdx = o.status === "cancelled" ? -1 : STATUS_STEPS.indexOf(o.status);

  // artist's preview: deterministic AI render of exactly this hamper
  const slugs = [...new Set(its.map((i) => i.slug))];
  const { data: prods } = await admin().from("products").select("slug,contents,occasion").in("slug", slugs);
  const artUrl = hamperArtUrl({
    names: its.map((i) => i.name),
    contents: (prods ?? []).flatMap((p: { contents: string[] | null }) => p.contents ?? []),
    occasion: its[0]?.occasion ?? undefined,
    seed: o.id,
  });
  const waWork = workOrderLink(o, its, settings, artUrl);

  return (
    <section className="wrap max-w-[860px] pb-24 pt-12">
      {isNew && (
        <div className="mb-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mint">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3e362c" strokeWidth="2.4"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          </div>
          <h1 className="font-display mt-6 text-5xl font-medium leading-tight">Order tied with love.</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-ink-soft">
            Thank you, {o.customer_name.split(" ")[0]}! Your hamper is in our tying queue. We've saved everything below — a confirmation goes out on WhatsApp shortly.
          </p>
        </div>
      )}

      <div className="rounded-[32px] border border-line bg-white/70 p-8 backdrop-blur md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Order {orderCode(o.id)}</p>
            <p className="mt-2 text-sm text-ink-soft">Placed {dateTimeFmt(o.created_at)} · {o.payment_method} · payment {o.payment_status}</p>
          </div>
          <p className="font-display text-3xl font-semibold">{inr(o.total)}</p>
        </div>

        {o.status !== "cancelled" ? (
          <div className="mt-9 flex items-center">
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <span className={"grid h-9 w-9 place-items-center rounded-full border-2 text-[11px] font-black uppercase transition " + (i <= stepIdx ? "border-rose bg-rose text-white" : "border-ink/15 bg-cream text-ink-soft")}>
                    {i < stepIdx ? "✓" : i + 1}
                  </span>
                  <span className={"text-[10px] font-black uppercase tracking-wider " + (i <= stepIdx ? "text-rose" : "text-ink-soft/60")}>{s}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && <div className={"mx-2 mb-5 h-0.5 flex-1 rounded " + (i < stepIdx ? "bg-rose" : "bg-ink/10")} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-xl bg-blush px-5 py-3 text-sm font-bold text-rose-deep">This order was cancelled. Write to us if that's a mistake!</p>
        )}

        <ul className="mt-9 divide-y divide-line border-y border-line">
          {its.map((it) => (
            <li key={it.id} className="flex items-center gap-4 py-4">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-deep"><img src={it.image || "/img/hero.jpg"} alt={it.name} className="h-full w-full object-cover" /></div>
              <div className="flex-1">
                <p className="font-display text-[16px] font-semibold">{it.name}</p>
                <p className="text-[12px] text-ink-soft">{it.variant ?? "As shown"}{it.addons?.length ? ` · +${it.addons.map((a) => a.label).join(", +")}` : ""} · qty {it.qty}</p>
              </div>
              <p className="font-bold">{inr(it.line_total)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="space-y-1.5 text-sm">
            <p className="label">Totals</p>
            <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><b>{inr(o.subtotal)}</b></div>
            {o.discount > 0 && <div className="flex justify-between text-mint-deep"><span>Coupon {o.coupon}</span><b>−{inr(o.discount)}</b></div>}
            <div className="flex justify-between"><span className="text-ink-soft">Delivery</span><b>{o.delivery_charge === 0 ? "FREE" : inr(o.delivery_charge)}</b></div>
            <div className="flex justify-between border-t border-line pt-2 font-display text-xl font-semibold"><span>Total</span><span>{inr(o.total)}</span></div>
          </div>
          <div className="text-sm">
            <p className="label">Delivering to</p>
            <p className="font-bold">{o.customer_name} · {o.customer_phone}</p>
            <p className="mt-1 text-ink-soft">{o.customer_address}{o.customer_landmark ? `, ${o.customer_landmark}` : ""}, {o.customer_city} — {o.customer_pincode}</p>
            {o.gift_note && <p className="mt-3 rounded-xl bg-butter/70 px-4 py-3 font-script text-lg leading-snug">“{o.gift_note}”{o.gift_sender_name ? ` — ${o.gift_sender_name}` : ""}</p>}
          </div>
        </div>

        {o.payment_method === "UPI" && o.payment_status !== "paid" && (
          <div className="mt-7 rounded-2xl bg-lav/70 p-5 text-sm">
            <p className="font-bold">Pending UPI: send {inr(o.total)} to <span className="rounded bg-white px-2 py-0.5 font-mono">{settings.upiId}</span> ({settings.payeeName})</p>
            <p className="mt-1 text-ink/70">Then WhatsApp us the screenshot with your order code {orderCode(o.id)}.</p>
          </div>
        )}

        <div className="mt-9 grid items-center gap-8 rounded-[28px] bg-cream-deep/60 p-6 md:grid-cols-[240px_1fr]">
          <HamperArt src={artUrl} fallback={its[0]?.image || "/img/hero.jpg"} alt={`Artist's preview of your ${its.map((i) => i.name).join(" + ")} hamper`} />
          <div>
            <p className="eyebrow">While you wait</p>
            <h2 className="font-display mt-2 text-2xl font-semibold leading-snug">Here's our artist's sketch of the hamper we'll tie for you.</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
              Auto-painted from your exact contents list — the real one is tied by hand in {settings.city}, so expect it even lovelier (and smelling of mithai). Want a change? Reply on WhatsApp before we seal the box.
            </p>
            <a className="btn-rose mt-5" href={waWork} target="_blank" rel="noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.5-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.4 0 .1 0 .7-.2 1.2Z" /></svg>
              Send hamper work-order to studio
            </a>
            <p className="mt-2 text-[12px] text-ink-soft">One tap forwards the full tying brief (items, note, address, totals) to our WhatsApp.</p>
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
