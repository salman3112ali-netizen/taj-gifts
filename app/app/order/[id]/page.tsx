import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/lib/supabase";
import { getSettings, inr, orderCode, dateTimeFmt, waLink } from "@/lib/store";
import { hamperArtUrl } from "@/lib/hamper-art";
import { previewExists, previewPublicUrl } from "@/lib/hamper-art-server";
import type { Order, OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order · Taj Gifts App", robots: { index: false } };

const STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"];

export default async function AppOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
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
  const stepIdx = o.status === "cancelled" ? -1 : STEPS.indexOf(o.status);

  let artUrl = hamperArtUrl({ names: its.map((i) => i.name), contents: [], occasion: its[0]?.occasion ?? undefined, seed: o.id });
  if (await previewExists(o.id)) artUrl = previewPublicUrl(o.id);

  return (
    <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
      {isNew && (
        <div className="mb-5 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3e362c" strokeWidth="2.4"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          </div>
          <h1 className="font-display mt-3 text-[26px] font-medium leading-tight">Order tied with love.</h1>
          <p className="mx-auto mt-1 max-w-[280px] text-[13px] text-ink-soft">Thank you, {o.customer_name.split(" ")[0]}! The studio bot already received your hamper brief.</p>
        </div>
      )}

      <div className="rounded-[24px] border border-line bg-white/70 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose">Order {orderCode(o.id)}</p>
            <p className="mt-1 text-[11px] text-ink-soft">{dateTimeFmt(o.created_at)} · {o.payment_method}</p>
          </div>
          <p className="font-display text-[22px] font-semibold">{inr(o.total)}</p>
        </div>

        {o.status !== "cancelled" ? (
          <ol className="mt-5 space-y-0">
            {STEPS.map((s, i) => (
              <li key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={"grid h-8 w-8 place-items-center rounded-full border-2 text-[10px] font-black uppercase " + (i <= stepIdx ? "border-rose bg-rose text-white" : "border-ink/15 bg-cream text-ink-soft")}>
                    {i < stepIdx ? "✓" : i + 1}
                  </span>
                  {i < STEPS.length - 1 && <span className={"w-0.5 flex-1 " + (i < stepIdx ? "bg-rose" : "bg-ink/10")} style={{ minHeight: 18 }} />}
                </div>
                <p className={"pb-4 pt-1.5 text-[13px] font-bold uppercase tracking-[0.12em] " + (i <= stepIdx ? "text-rose" : "text-ink-soft/60")}>{s}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-5 rounded-xl bg-blush px-4 py-3 text-[13px] font-bold text-rose-deep">This order was cancelled.</p>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-line bg-white/70">
        <img src={artUrl} alt="Artist's preview of your hamper" className="aspect-[4/3.4] w-full object-cover" />
        <p className="px-4 py-3 text-center font-script text-lg text-ink-soft">our artist's sketch of your hamper</p>
      </div>

      <ul className="mt-4 space-y-2 rounded-[24px] border border-line bg-white/70 p-4">
        {its.map((i) => (
          <li key={i.id} className="flex items-center justify-between text-[13.5px]">
            <span className="font-semibold">{i.name}{i.variant ? ` (${i.variant})` : ""} × {i.qty}</span>
            <span className="font-bold">{inr(i.line_total)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-2.5 pb-6">
        <a className="btn-primary w-full justify-center py-3.5 text-[11px]" href={waLink(settings.whatsapp, `Hi! My order ${orderCode(o.id)} — just checking in 🙂`)} target="_blank" rel="noreferrer">Track on WhatsApp</a>
        <Link className="btn-ghost w-full justify-center py-3.5 text-[11px]" href="/app/shop">Send another gift</Link>
      </div>
    </div>
  );
}
