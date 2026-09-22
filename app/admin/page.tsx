"use client";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Coupon, Order, OrderItem, Product, Settings } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";
import { dateTimeFmt, inr, orderCode } from "@/lib/store";
import { hamperArtUrl } from "@/lib/hamper-art";
import { workOrderLink } from "@/lib/workorder";

/** admin fetch with the per-tab bearer token (website asks password every tab) */
function afetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  try {
    if (typeof window !== "undefined") {
      const tok = sessionStorage.getItem("taj_admin_tok");
      if (tok) headers.set("Authorization", "Bearer " + tok);
    }
  } catch { /* ignore */ }
  return fetch(url, { ...init, headers });
}

type Lead = { id: string; name: string; phone: string; message: string; created_at: string };
type Sub = { email: string; created_at: string };
type Customer = { phone: string; name: string; email: string | null; city: string | null; order_count: number; total_spend: number; last_order_at: string | null };
type Data = {
  orders: Order[]; items: OrderItem[]; products: Product[]; coupons: Coupon[];
  leads: Lead[]; subscribers: Sub[]; customers: Customer[]; settings: Record<string, any>;
};

const TABS = ["Orders", "Products", "Coupons", "Customers", "Enquiries", "APIs & keys", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("Orders");

  const load = useCallback(async () => {
    const r = await afetch("/api/admin/bootstrap");
    if (r.status === 401) { setAuthed(false); return; }
    const j = await r.json();
    setData(j); setAuthed(true);
  }, []);
  useEffect(() => {
    afetch("/api/admin/session").then((r) => r.json()).then((j) => (j.ok ? load() : setAuthed(false)));
  }, [load]);

  // LIVE OPS: auto-poll every 20 s + chime & vibrate the instant a new order lands (mobile admin app)
  const prevCount = useRef<number | null>(null);
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [authed, load]);
  useEffect(() => {
    const n = data?.orders.length ?? null;
    if (n !== null && prevCount.current !== null && n > prevCount.current) {
      try {
        navigator.vibrate?.([400, 150, 400]);
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        [880, 1174.66].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.frequency.value = f;
          osc.connect(g);
          g.connect(ctx.destination);
          const t0 = ctx.currentTime + i * 0.18;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
          osc.start(t0);
          osc.stop(t0 + 0.18);
        });
      } catch {
        /* browser audio unlocks after first tap — silent until then, fine */
      }
    }
    if (n !== null) prevCount.current = n;
  }, [data?.orders.length]);

  if (authed === null) return <div className="grid min-h-[70vh] place-items-center font-script text-3xl text-ink-soft">opening the studio door…</div>;
  if (!authed) return <Login onOk={load} />;
  if (!data) return null;

  return (
    <section className="wrap pb-24 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Studio admin</p>
          <h1 className="font-display mt-2 text-4xl font-medium">Good day, maker 🌸</h1>
        </div>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={"chip " + (tab === t ? "chip-on" : "")}>{t}</button>
          ))}
          <button className="chip hover:border-rose hover:text-rose" onClick={async () => { await afetch("/api/admin/session", { method: "POST" }); setAuthed(false); }}>Exit</button>
        </div>
      </div>
      <div className="mt-8">
        {tab === "Orders" && <Orders data={data} reload={load} />}
        {tab === "Products" && <Products data={data} reload={load} />}
        {tab === "Coupons" && <Coupons data={data} reload={load} />}
        {tab === "Customers" && <Customers data={data} />}
        {tab === "Enquiries" && <Enquiries data={data} />}
        {tab === "APIs & keys" && <ApisTab />}
        {tab === "Settings" && <SettingsTab data={data} reload={load} />}
      </div>
    </section>
  );
}

function Login({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <section className="grid min-h-[75vh] place-items-center px-5">
      <form
        className="w-full max-w-sm rounded-[32px] border border-line bg-white/70 p-9 backdrop-blur"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
          const j = await r.json();
          if (j.ok) { try { sessionStorage.setItem("taj_admin_tok", j.token || ""); } catch { /* ignore */ } onOk(); }
          else setErr(j.error);
        }}
      >
        <p className="font-display text-3xl font-semibold">Studio door</p>
        <p className="mt-1 font-script text-xl text-ink-soft">staff only, ribbons everywhere</p>
        <label className="label mt-7">Password</label>
        <input type="password" className="input" value={pw} onChange={(e) => { setPw(e.target.value); setErr(null); }} placeholder="••••••••" autoFocus />
        {err && <p className="mt-2 text-sm font-bold text-rose-deep">{err}</p>}
        <button className="btn-rose mt-5 w-full">Unlock</button>
      </form>
    </section>
  );
}

const card = "rounded-[24px] border border-line bg-white/70 backdrop-blur";

function Orders({ data, reload }: { data: Data; reload: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [otpDraft, setOtpDraft] = useState<Record<string, string>>({});
  const act = async (o: Order, action: string, extra?: Record<string, unknown>) => {
    const r = await afetch("/api/admin/order", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id, action, ...extra }) });
    const j = await r.json();
    if (!j.ok) alert(j.error || "Action failed — try again.");
    else if (action === "dispatch") alert("Out for delivery! Customer OTP " + j.otp + " was emailed to them and shown on their tracking page. Ask for it at the door and verify below.");
    reload();
  };
  const stats = useMemo(() => {
    const paid = data.orders.filter((o) => o.payment_status === "paid").length;
    const revenue = data.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    return { count: data.orders.length, revenue, paid, pending: data.orders.filter((o) => o.status === "pending").length };
  }, [data.orders]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    await afetch("/api/admin/order", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    reload();
  };

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Orders", String(stats.count)], ["Revenue", inr(stats.revenue)], ["Paid", String(stats.paid)], ["Awaiting action", String(stats.pending)]].map(([t, v]) => (
          <div key={t} className={card + " p-5"}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-ink-soft">{t}</p>
            <p className="font-display mt-1 text-3xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <div className={card + " mt-6 overflow-x-auto"}>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">
            <tr>{["Order", "Customer", "Items", "Total", "Payment", "Status", ""].map((h) => <th key={h} className="px-5 py-4">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.orders.map((o) => {
              const its = data.items.filter((i) => i.order_id === o.id);
              return (
                <Fragment key={o.id}>
                  <tr className="cursor-pointer transition hover:bg-cream-deep/50" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    <td className="px-5 py-4"><b>{orderCode(o.id)}</b><br /><span className="text-[11px] text-ink-soft">{dateTimeFmt(o.created_at)}</span></td>
                    <td className="px-5 py-4">{o.customer_name}<br /><span className="text-[11px] text-ink-soft">{o.customer_phone} · {o.customer_city}</span></td>
                    <td className="px-5 py-4 text-ink-soft">{its.length} line{its.length === 1 ? "" : "s"}</td>
                    <td className="px-5 py-4 font-bold">{inr(o.total)}</td>
                    <td className="px-5 py-4">
                      <select value={o.payment_status} onClick={(e) => e.stopPropagation()} onChange={(e) => patch(o.id, { payment_status: e.target.value })} className="cursor-pointer rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-bold">
                        {["pending", "paid", "refunded"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                      <br /><span className="text-[11px] text-ink-soft">{o.payment_method}</span>
                    </td>
                    <td className="px-5 py-4">
                      <select value={o.status} onClick={(e) => e.stopPropagation()} onChange={(e) => patch(o.id, { status: e.target.value })} className={"cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-black uppercase " + (o.status === "cancelled" ? "border-rose bg-blush text-rose-deep" : o.status === "delivered" ? "border-mint-deep bg-mint" : "border-butter bg-butter/60")}>
                        {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4 text-ink-soft">{open === o.id ? "▴" : "▾"}</td>
                  </tr>
                  {open === o.id && (
                    <tr>
                      <td colSpan={7} className="bg-cream-deep/40 px-6 py-5">
                        <div className="mb-5 flex flex-wrap items-center gap-2">
                          {o.status === "pending" && <button className="btn-rose" onClick={() => act(o, "confirm")}>1 · Confirm order</button>}
                          {o.status === "confirmed" && <button className="btn-rose" onClick={() => act(o, "pack")}>2 · Packed & ribbon-tied</button>}
                          {o.status === "packed" && <button className="btn-rose" onClick={() => act(o, "dispatch")}>3 · Start delivery + send OTP</button>}
                          {o.status === "out_for_delivery" && (
                            <span className="flex flex-wrap items-center gap-2">
                              <input
                                className="input w-28 text-center font-mono text-lg font-black tracking-[0.3em]"
                                placeholder="OTP"
                                inputMode="numeric"
                                maxLength={4}
                                value={otpDraft[o.id] ?? ""}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setOtpDraft({ ...otpDraft, [o.id]: e.target.value.replace(/\D/g, "") })}
                              />
                              <button className="btn-rose" onClick={() => act(o, "deliver", { otp: otpDraft[o.id] })}>4 · Verify OTP & deliver</button>
                            </span>
                          )}
                          {o.status === "delivered" && <span className="rounded-full bg-mint px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-ink">delivered ✓</span>}
                          {o.status !== "cancelled" && o.status !== "delivered" && o.payment_status !== "paid" && (
                            <button className="btn-ghost" onClick={() => act(o, "mark_paid")}>Mark payment received</button>
                          )}
                          {o.status !== "cancelled" && o.status !== "delivered" && (
                            <button className="btn-ghost" onClick={() => { if (confirm("Cancel this order and restock the hampers?")) act(o, "cancel"); }}>Cancel + restock</button>
                          )}
                          <a className="btn-ghost" href={`tel:+91${o.customer_phone}`}>📞 Call</a>
                          <a className="btn-ghost" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.customer_address}, ${o.customer_landmark ?? ""} ${o.customer_city} ${o.customer_pincode}`)}`} target="_blank" rel="noreferrer">🗺 Route</a>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                          <ul className="space-y-2">
                            {its.map((i) => (
                              <li key={i.id} className="flex justify-between text-[13px]">
                                <span>{i.name} × {i.qty} {i.variant ? `(${i.variant})` : ""}{i.addons?.length ? ` +${i.addons.map((a) => a.label).join(", ")}` : ""}</span>
                                <b>{inr(i.line_total)}</b>
                              </li>
                            ))}
                            <li className="flex justify-between border-t border-line pt-2 text-[13px]"><span>Discount {o.coupon ? `(${o.coupon})` : ""} · Delivery {o.delivery_charge === 0 ? "free" : inr(o.delivery_charge)}</span><b>{inr(o.total)}</b></li>
                          </ul>
                          <div className="space-y-1 text-[13px] text-ink-soft">
                            <p><b className="text-ink">Ship to:</b> {o.customer_address}{o.customer_landmark ? `, ${o.customer_landmark}` : ""}, {o.customer_city} — {o.customer_pincode}</p>
                            {o.customer_email && <p><b className="text-ink">Email:</b> {o.customer_email}</p>}
                            {o.gift_note && <p className="rounded-xl bg-butter/60 px-3 py-2 font-script text-lg text-ink">“{o.gift_note}”{o.gift_sender_name ? ` — ${o.gift_sender_name}` : ""}</p>}
                            {o.gift_delivery_date && <p><b className="text-ink">Deliver on:</b> {o.gift_delivery_date}</p>}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <a className="inline-block rounded-full bg-mint px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-ink" href={`https://wa.me/91${o.customer_phone}`} target="_blank" rel="noreferrer">WhatsApp customer</a>
                              <a
                                className="inline-block rounded-full bg-rose px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
                                href={workOrderLink(o, its, data.settings as Settings, hamperArtUrl({ names: its.map((i) => i.name), occasion: its[0]?.occasion ?? undefined, seed: o.id }))}
                                target="_blank"
                                rel="noreferrer"
                              >
                                 WA work-order to studio
                              </a>
                            </div>
                            <img
                              src={hamperArtUrl({ names: its.map((i) => i.name), occasion: its[0]?.occasion ?? undefined, seed: o.id })}
                              alt="AI hamper preview"
                              loading="lazy"
                              className="mt-3 h-28 w-24 rounded-xl border border-line object-cover"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {data.orders.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center font-script text-2xl text-ink-soft">no orders yet — your first ribbon is imminent ♥</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const IMG_CHOICES = ["/img/diwali.jpg", "/img/wedding.jpg", "/img/birthday.jpg", "/img/pahadi.jpg", "/img/corporate.jpg", "/img/baby.jpg", "/img/selfcare.jpg", "/img/anniversary.jpg", "/img/hero.jpg"];

function Products({ data, reload }: { data: Data; reload: () => void }) {
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [imgUrl, setImgUrl] = useState("");
  const [galUrl, setGalUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const uploadImgs = async (files: FileList | null, apply: (u: string) => void) => {
    if (!files || !files.length) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      const fdf = new FormData();
      fdf.append("file", f);
      try {
        const r = await afetch("/api/admin/upload", { method: "POST", body: fdf });
        const j = await r.json();
        if (j.ok) apply(j.url);
        else alert("Upload failed: " + (j.error || r.status));
      } catch {
        alert("Upload failed — check your connection and try again.");
      }
    }
    setBusy(false);
  };
  const save = async () => {
    if (!editing) return;
    const isnew = !editing.id;
    await afetch("/api/admin/product", { method: isnew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    setEditing(null); reload();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this hamper from the shop?")) return;
    await afetch("/api/admin/product?id=" + id, { method: "DELETE" });
    reload();
  };
  return (
    <div>
      <button className="btn-primary mb-5" onClick={() => setEditing({ occasion: "Festive", stock: 10, published: true, image: "/img/hero.jpg", gallery: [], contents: [], variants: [], addons: [] })}>+ New hamper</button>
      <div className={card + " overflow-x-auto"}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">
            <tr>{["", "Hamper", "Occasion", "Price", "Stock", "Live", ""].map((h, i) => <th key={i} className="px-5 py-4">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.products.map((p) => (
              <tr key={p.id} className="hover:bg-cream-deep/50">
                <td className="px-5 py-3"><img src={p.image} alt="" className="h-12 w-10 rounded-lg object-cover" /></td>
                <td className="px-5 py-3"><b>{p.name}</b><br /><span className="text-[11px] text-ink-soft">/{p.slug}</span></td>
                <td className="px-5 py-3">{p.occasion}</td>
                <td className="px-5 py-3 font-bold">{inr(p.price)}</td>
                <td className="px-5 py-3">{p.stock}</td>
                <td className="px-5 py-3">
                  <button onClick={async () => { await afetch("/api/admin/product", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, published: !p.published }) }); reload(); }} className={"rounded-full px-3 py-1 text-[10px] font-black uppercase " + (p.published ? "bg-mint text-ink" : "bg-cream-deep text-ink-soft")}>
                    {p.published ? "live" : "hidden"}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button className="mr-2 text-[11px] font-black uppercase tracking-wider text-rose hover:underline" onClick={() => setEditing({ ...p, contents: (p.contents ?? []).join("\n") as unknown as string[] })}>Edit</button>
                  <button className="text-[11px] font-black uppercase tracking-wider text-ink-soft hover:text-rose-deep hover:underline" onClick={() => del(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className={card + " max-h-[88vh] w-full max-w-2xl overflow-y-auto bg-cream p-8"} onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-2xl font-semibold">{editing.id ? "Edit hamper" : "New hamper"}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="label">Name</label><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className="label">Occasion</label><input className="input" value={editing.occasion ?? ""} onChange={(e) => setEditing({ ...editing, occasion: e.target.value })} /></div>
              <div><label className="label">Badge</label><input className="input" value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="Bestseller" /></div>
              <div><label className="label">Price ₹</label><input className="input" type="number" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
              <div><label className="label">Compare-at ₹</label><input className="input" type="number" value={editing.compare_at ?? ""} onChange={(e) => setEditing({ ...editing, compare_at: Number(e.target.value) })} /></div>
              <div><label className="label">Stock</label><input className="input" type="number" value={editing.stock ?? ""} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></div>
              <div><label className="label">Lead time</label><input className="input" value={editing.lead_time ?? ""} onChange={(e) => setEditing({ ...editing, lead_time: e.target.value })} placeholder="7–10 days for 20+ trays" /></div>
              <div className="sm:col-span-2"><label className="label">Tagline</label><input className="input" value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input min-h-[90px]" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Contents (one per line)</label><textarea className="input min-h-[110px]" value={Array.isArray(editing.contents) ? (editing.contents as string[]).join("\n") : (editing.contents ?? "")} onChange={(e) => setEditing({ ...editing, contents: e.target.value as unknown as string[] })} /></div>
              <div className="sm:col-span-2">
                <label className="label">Photo</label>
                <div className="flex flex-wrap gap-2">
                  {IMG_CHOICES.map((im) => (
                    <button key={im} onClick={() => setEditing({ ...editing, image: im })} className={"h-16 w-14 overflow-hidden rounded-lg border-2 " + (editing.image === im ? "border-rose" : "border-transparent opacity-70")}>
                      <img src={im} alt={im} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {editing.image && <img src={editing.image} alt="" className="h-16 w-14 rounded-lg border-2 border-rose object-cover" />}
                  <label className={"btn-ghost cursor-pointer" + (busy ? " pointer-events-none opacity-50" : "")}>
                    {busy ? "Uploading…" : "Upload from device"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadImgs(e.target.files, (u) => setEditing({ ...editing, image: u })); e.target.value = ""; }} />
                  </label>
                  <input className="input min-w-[180px] flex-1" placeholder="…or paste an image link (https://…)" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} />
                  <button className="btn-ghost" onClick={() => { const u = imgUrl.trim(); if (u) { setEditing({ ...editing, image: u }); setImgUrl(""); } }}>Use link</button>
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">Device photos are stored in your Supabase Storage (public “products” bucket, created automatically). Links are used exactly as pasted.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Gallery (product-page slider)</label>
                <div className="flex flex-wrap items-center gap-2">
                  {(editing.gallery ?? []).map((g, gi) => (
                    <span key={gi} className="relative inline-block">
                      <img src={g} alt="" className="h-16 w-14 rounded-lg object-cover" />
                      <button onClick={() => setEditing({ ...editing, gallery: (editing.gallery ?? []).filter((_, x) => x !== gi) })} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] font-black text-cream" title="Remove">×</button>
                    </span>
                  ))}
                  <label className={"btn-ghost cursor-pointer" + (busy ? " pointer-events-none opacity-50" : "")}>
                    + Add photos
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { uploadImgs(e.target.files, (u) => setEditing({ ...editing, gallery: [...(editing.gallery ?? []), u] })); e.target.value = ""; }} />
                  </label>
                  <input className="input min-w-[150px] flex-1" placeholder="…or add a link" value={galUrl} onChange={(e) => setGalUrl(e.target.value)} />
                  <button className="btn-ghost" onClick={() => { const u = galUrl.trim(); if (u) { setEditing({ ...editing, gallery: [...(editing.gallery ?? []), u] }); setGalUrl(""); } }}>Add</button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-4 w-4 accent-rose" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Featured on home</label>
              <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-4 w-4 accent-rose" checked={editing.published !== false} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Published</label>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="btn-rose" onClick={save}>Save hamper</button>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Coupons({ data, reload }: { data: Data; reload: () => void }) {
  const [n, setN] = useState({ code: "", type: "flat", value: "", min_order: "", label: "" });
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className={card + " overflow-x-auto"}>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft"><tr>{["Code", "Deal", "Min order", "Uses", "Active", ""].map((h) => <th key={h} className="px-5 py-4">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {data.coupons.map((c) => (
              <tr key={c.code} className="hover:bg-cream-deep/50">
                <td className="px-5 py-4 font-mono font-bold">{c.code}</td>
                <td className="px-5 py-4">{c.type === "flat" ? inr(c.value) + " off" : c.value + "% off"}<br /><span className="text-[11px] text-ink-soft">{c.label}</span></td>
                <td className="px-5 py-4">{inr(c.min_order)}</td>
                <td className="px-5 py-4">{c.uses}</td>
                <td className="px-5 py-4">
                  <button onClick={async () => { await afetch("/api/admin/coupon", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c.code, active: !c.active }) }); reload(); }} className={"rounded-full px-3 py-1 text-[10px] font-black uppercase " + (c.active ? "bg-mint" : "bg-cream-deep text-ink-soft")}>{c.active ? "on" : "off"}</button>
                </td>
                <td className="px-5 py-4"><button className="text-[11px] font-black uppercase tracking-wider text-ink-soft hover:text-rose-deep hover:underline" onClick={async () => { if (confirm("Delete " + c.code + "?")) { await afetch("/api/admin/coupon?code=" + c.code, { method: "DELETE" }); reload(); } }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className={card + " h-fit p-7"} onSubmit={async (e) => {
        e.preventDefault();
        await afetch("/api/admin/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...n, value: Number(n.value), min_order: Number(n.min_order) }) });
        setN({ code: "", type: "flat", value: "", min_order: "", label: "" }); reload();
      }}>
        <p className="font-display text-xl font-semibold">New coupon</p>
        <div className="mt-4 grid gap-3">
          <input className="input uppercase" placeholder="CODE" required value={n.code} onChange={(e) => setN({ ...n, code: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={n.type} onChange={(e) => setN({ ...n, type: e.target.value })}><option value="flat">₹ flat off</option><option value="percent">% off</option></select>
            <input className="input" type="number" placeholder="Value" required value={n.value} onChange={(e) => setN({ ...n, value: e.target.value })} />
          </div>
          <input className="input" type="number" placeholder="Min order ₹" value={n.min_order} onChange={(e) => setN({ ...n, min_order: e.target.value })} />
          <input className="input" placeholder="Label (shown to shoppers)" value={n.label} onChange={(e) => setN({ ...n, label: e.target.value })} />
          <button className="btn-rose">Create coupon</button>
        </div>
      </form>
    </div>
  );
}

function Customers({ data }: { data: Data }) {
  return (
    <div className={card + " overflow-x-auto"}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-[10px] font-black uppercase tracking-[0.18em] text-ink-soft">
          <tr>{["Customer", "Phone / email", "City", "Orders", "Lifetime spend", "Last order"].map((h) => <th key={h} className="px-5 py-4">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.customers.map((c) => (
            <tr key={c.phone} className="hover:bg-cream-deep/50">
              <td className="px-5 py-4 font-bold">{c.name}</td>
              <td className="px-5 py-4">{c.phone}<br /><span className="text-[11px] text-ink-soft">{c.email}</span></td>
              <td className="px-5 py-4">{c.city}</td>
              <td className="px-5 py-4">{c.order_count}</td>
              <td className="px-5 py-4 font-bold">{inr(c.total_spend ?? 0)}</td>
              <td className="px-5 py-4 text-ink-soft">{c.last_order_at ? dateTimeFmt(c.last_order_at) : "—"}</td>
            </tr>
          ))}
          {data.customers.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center font-script text-2xl text-ink-soft">your first customer appears here after their first order ♥</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Enquiries({ data }: { data: Data }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={card + " p-7"}>
        <p className="font-display text-xl font-semibold">Custom-hamper enquiries <span className="text-ink-soft">({data.leads.length})</span></p>
        <ul className="mt-4 space-y-4">
          {data.leads.map((l) => (
            <li key={l.id} className="rounded-2xl bg-cream-deep/60 p-4">
              <p className="font-bold">{l.name} · <a className="text-rose" href={`https://wa.me/91${l.phone.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noreferrer">{l.phone}</a></p>
              <p className="mt-1 text-sm text-ink-soft">{l.message}</p>
              <p className="mt-1 text-[11px] text-ink-soft/70">{dateTimeFmt(l.created_at)}</p>
            </li>
          ))}
          {data.leads.length === 0 && <li className="font-script text-xl text-ink-soft">no enquiries yet</li>}
        </ul>
      </div>
      <div className={card + " p-7"}>
        <p className="font-display text-xl font-semibold">Newsletter family <span className="text-ink-soft">({data.subscribers.length})</span></p>
        <ul className="mt-4 space-y-2 text-sm">
          {data.subscribers.map((s) => <li key={s.email} className="flex justify-between border-b border-line/60 pb-2"><span>{s.email}</span><span className="text-[11px] text-ink-soft">{dateTimeFmt(s.created_at)}</span></li>)}
          {data.subscribers.length === 0 && <li className="font-script text-xl text-ink-soft">no subscribers yet</li>}
        </ul>
      </div>
    </div>
  );
}

function SettingsTab({ data, reload }: { data: Data; reload: () => void }) {
  const [s, setS] = useState<Record<string, any>>(data.settings);
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const up = (k: string, v: unknown) => setS({ ...s, [k]: v });
  return (
    <form className={card + " max-w-3xl p-8"} onSubmit={async (e) => {
      e.preventDefault();
      const body: Record<string, unknown> = { ...s, localPincodes: String(s.localPincodes).split(",").map((x: string) => x.trim()).filter(Boolean) };
      if (pw) body.newPassword = pw;
      const r = await afetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      setMsg(j.ok ? "Saved ✓ (site updates within a minute)" : j.error);
      if (j.ok) { setPw(""); reload(); }
    }}>
      <p className="font-display text-2xl font-semibold">Shop settings</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div><label className="label">Shop name</label><input className="input" value={s.shopName ?? ""} onChange={(e) => up("shopName", e.target.value)} /></div>
        <div><label className="label">Tagline</label><input className="input" value={s.tagline ?? ""} onChange={(e) => up("tagline", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">Announcement bar</label><input className="input" value={s.announcement ?? ""} onChange={(e) => up("announcement", e.target.value)} /></div>
        <div><label className="label">Phone</label><input className="input" value={s.phone ?? ""} onChange={(e) => up("phone", e.target.value)} /></div>
        <div><label className="label">WhatsApp (digits, with 91)</label><input className="input" value={s.whatsapp ?? ""} onChange={(e) => up("whatsapp", e.target.value)} /></div>
        <div><label className="label">Email</label><input className="input" value={s.email ?? ""} onChange={(e) => up("email", e.target.value)} /></div>
        <div><label className="label">UPI ID</label><input className="input" value={s.upiId ?? ""} onChange={(e) => up("upiId", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">Studio address</label><input className="input" value={s.address ?? ""} onChange={(e) => up("address", e.target.value)} /></div>
        <div><label className="label">City</label><input className="input" value={s.city ?? ""} onChange={(e) => up("city", e.target.value)} /></div>
        <div><label className="label">Pincode</label><input className="input" value={s.pincode ?? ""} onChange={(e) => up("pincode", e.target.value)} /></div>
        <div><label className="label">Delivery charge ₹ (outside zone)</label><input className="input" type="number" value={s.deliveryCharge ?? 0} onChange={(e) => up("deliveryCharge", Number(e.target.value))} /></div>
        <div><label className="label">Local delivery charge ₹</label><input className="input" type="number" value={s.localDeliveryCharge ?? 0} onChange={(e) => up("localDeliveryCharge", Number(e.target.value))} /></div>
        <div><label className="label">Free delivery above ₹</label><input className="input" type="number" value={s.freeDeliveryAbove ?? 0} onChange={(e) => up("freeDeliveryAbove", Number(e.target.value))} /></div>
        <div className="sm:col-span-2"><label className="label">Local pincodes (comma separated)</label><input className="input" value={Array.isArray(s.localPincodes) ? s.localPincodes.join(", ") : s.localPincodes} onChange={(e) => up("localPincodes", e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-4 w-4 accent-rose" checked={!!s.codAvailable} onChange={(e) => up("codAvailable", e.target.checked)} /> Cash on delivery</label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="h-4 w-4 accent-rose" checked={!!s.shopOpen} onChange={(e) => up("shopOpen", e.target.checked)} /> Shop open</label>
        <div className="sm:col-span-2"><label className="label">Change admin password (leave blank to keep)</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="min 8 characters" /></div>
      </div>
      <button className="btn-rose mt-6">Save settings</button>
      {msg && <p className="mt-3 text-sm font-bold text-mint-deep">{msg}</p>}
    </form>
  );
}

/* ── APIs & keys control center — change any integration anytime, no redeploy ── */
const API_GROUPS: { title: string; note?: string; test?: "email" | "wa" | "telegram" | "webhook"; fields: [string, string, string?][] }[] = [
  {
    title: "Owner alerts · email (order + OTP copies)", test: "email",
    note: "Recommended channel. Resend free tier, or any Gmail SMTP with an app-password.",
    fields: [
      ["orderNotifyEmail", "Owner alert email", "where every new-order alert goes"],
      ["resendKey", "Resend API key", "re_… from resend.com"],
      ["resendFrom", "Resend from address", "Taj Gifts Studio <onboarding@resend.dev> works free"],
      ["smtpUser", "SMTP user (fallback)", "e.g. tajgifts.in@gmail.com"],
      ["smtpPass", "SMTP app password", "app password, never your login password"],
      ["smtpHost", "SMTP host", "default smtp.gmail.com"],
      ["smtpPort", "SMTP port", "default 465"],
      ["mailFrom", "Customer emails from", "Taj Gifts <orders@tajgifts.in>"],
    ],
  },
  {
    title: "WhatsApp Cloud API bot", test: "wa",
    note: "Official Meta bot that pings your WhatsApp with the full order brief + AI sketch.",
    fields: [
      ["metaWaToken", "Meta access token"],
      ["metaWaPhoneId", "WhatsApp phone-number id"],
      ["metaWaTo", "Owner WhatsApp number", "digits with country code, e.g. 917668819833"],
      ["metaWaTemplate", "Approved template name", "default taj_order_alert"],
    ],
  },
  {
    title: "Telegram bot", test: "telegram",
    fields: [["telegramToken", "Bot token", "from @BotFather"], ["telegramChat", "Chat id", "your numeric chat id"]],
  },
  {
    title: "Webhook (Make / Zapier / n8n / WATI)", test: "webhook",
    fields: [["webhookUrl", "POST URL", "raw JSON of every new order"]],
  },
  {
    title: "Payments · Razorpay (UPI, cards, netbanking)",
    note: "Empty = checkout keeps UPI deep-link + COD. Add keys and the gateway switch turns itself on.",
    fields: [["rzpKeyId", "Key id"], ["rzpKeySecret", "Key secret"]],
  },
  {
    title: "AI hamper previews",
    note: "Powerful-model sketch attached to owner alerts & shown on tracking pages.",
    fields: [["geminiKey", "Gemini API key"], ["geminiModel", "Gemini image model", "default gemini-2.5-flash-image"], ["openaiKey", "OpenAI API key"], ["openaiModel", "OpenAI image model", "default gpt-image-1"]],
  },
  {
    title: "CallMeBot (paused provider)",
    fields: [["callmebotKey", "CallMeBot API key"], ["callmebotPhone", "CallMeBot phone"]],
  },
];

function ApisTab() {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [fromEnv, setFromEnv] = useState<Record<string, boolean>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await afetch("/api/admin/apis");
    const j = await r.json();
    if (j.ok) { setVals(j.values); setSaved(j.saved); setFromEnv(j.fromEnv); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    setBusy(true); setMsg("");
    const r = await afetch("/api/admin/apis", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vals) });
    const j = await r.json();
    setBusy(false);
    setMsg(j.ok ? "Saved — live immediately, no redeploy needed. Empty fields fall back to Netlify env." : "Save failed.");
    void load();
  };
  const test = async (kind: string) => {
    setBusy(true); setMsg("");
    const r = await afetch("/api/admin/apis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: kind }) });
    const j = await r.json();
    setBusy(false);
    setMsg(j.ok ? j.msg : j.error || "Test failed.");
  };

  return (
    <div className="grid gap-6">
      <div className={card + " p-6"}>
        <p className="font-display text-2xl font-semibold">APIs & keys</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          Every external integration lives here. Save a value and it goes live instantly (stored encrypted-at-rest in your Supabase settings);
          clear a field to fall back to the Netlify environment variable. Badges show where each value currently comes from.
        </p>
        {msg && <p className="mt-3 rounded-xl bg-butter/70 px-4 py-2.5 text-[13px] font-bold">{msg}</p>}
      </div>
      {API_GROUPS.map((g) => (
        <div key={g.title} className={card + " p-6"}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-lg font-semibold">{g.title}</p>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setShow({ ...show, [g.title]: !show[g.title] })}>{show[g.title] ? "Hide values" : "Show values"}</button>
              {g.test && <button className="btn-ghost" disabled={busy} onClick={() => g.test && test(g.test)}>Send test</button>}
            </div>
          </div>
          {g.note && <p className="mt-1 text-[12px] text-ink-soft">{g.note}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {g.fields.map(([k, label, hint]) => (
              <div key={k}>
                <label className="label flex items-center gap-2">
                  {label}
                  <span className={"rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider " + (saved[k] ? "bg-mint text-ink" : fromEnv[k] ? "bg-lav text-ink" : "bg-cream-deep text-ink-soft")}>
                    {saved[k] ? "saved here" : fromEnv[k] ? "from env" : "not set"}
                  </span>
                </label>
                <input
                  className="input font-mono text-[12px]"
                  type={show[g.title] ? "text" : "password"}
                  autoComplete="off"
                  spellCheck={false}
                  value={vals[k] ?? ""}
                  placeholder={fromEnv[k] && !saved[k] ? "••• set in Netlify env — type to override" : hint || ""}
                  onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button className="btn-rose px-8" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save all keys"}</button>
        <p className="text-[12px] text-ink-soft">Changes apply to the very next order / alert — no rebuild, no redeploy.</p>
      </div>
    </div>
  );
}
