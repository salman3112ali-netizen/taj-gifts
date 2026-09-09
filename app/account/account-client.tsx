"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { browserSupabase } from "@/lib/supabase/browser";
import { inr, orderCode, dateTimeFmt } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";

type Address = { id: string; label: string; name: string; phone: string; address: string; landmark: string | null; city: string; pincode: string; is_default: boolean };
type Profile = { id: string; full_name: string | null; phone: string | null };

const TABS = [
  { id: "orders", label: "Order history" },
  { id: "addresses", label: "Address book" },
  { id: "profile", label: "Profile & security" },
] as const;

export default function AccountClient({ user, initialTab }: { user: { id: string; email: string; name: string; phone: string }; initialTab?: string }) {
  const [tab, setTab] = useState<string>(initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : "orders");
  const [needsSetup, setNeedsSetup] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    const sb = browserSupabase();
    const [o, a, p] = await Promise.all([
      sb.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      sb.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);
    if (o.error && /does not exist|schema cache|relation/i.test(o.error.message)) setNeedsSetup(true);
    setOrders((o.data as Order[]) ?? []);
    setAddresses((a.data as Address[]) ?? []);
    setProfile((p.data as Profile) ?? { id: user.id, full_name: user.name, phone: user.phone });
    if (orders?.length) {
      const ids = orders.map((x) => x.id);
      const its = await sb.from("order_items").select("*").in("order_id", ids);
      setItems((its.data as OrderItem[]) ?? []);
    }
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!orders?.length) return;
    (async () => {
      const its = await browserSupabase().from("order_items").select("*").in("order_id", orders.map((x) => x.id));
      setItems((its.data as OrderItem[]) ?? []);
    })();
  }, [orders]);

  return (
    <section className="wrap pb-24 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="font-display mt-2 text-5xl font-medium">Namaste, {profile?.full_name || user.name || "friend"} 🌸</h1>
          <p className="mt-2 font-script text-2xl text-ink-soft">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={"chip " + (tab === t.id ? "chip-on" : "")}>{t.label}</button>
          ))}
        </div>
      </div>

      {needsSetup && (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-rose/50 bg-blush/40 p-6">
          <p className="font-display text-xl font-semibold">Accounts tables not installed yet</p>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink/75">
            Sign-in works, but order history & saved addresses need one SQL step: open your Supabase dashboard → <b>SQL editor</b> → paste the contents of
            <code className="mx-1 rounded bg-white px-2 py-0.5 font-mono text-[12px]">supabase/migrations/0001_accounts.sql</code> from this project → Run. Everything below switches on instantly (the owner can also hand the agent the DB password and it will apply it for you).
          </p>
        </div>
      )}

      <div className="mt-9">
        {tab === "orders" && (
          <div className="grid gap-5 md:grid-cols-2">
            {orders?.length === 0 && (
              <div className="md:col-span-2 rounded-[28px] border border-line bg-white/70 p-10 text-center">
                <p className="font-script text-3xl text-ink-soft">no orders on this account yet</p>
                <Link href="/shop" className="btn-primary mt-5 inline-flex">Find someone to spoil</Link>
              </div>
            )}
            {(orders ?? []).map((o) => {
              const its = items.filter((i) => i.order_id === o.id);
              return (
                <Link key={o.id} href={`/order/${o.id}`} className="group rounded-[26px] border border-line bg-white/70 p-6 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold">{orderCode(o.id)}</p>
                      <p className="text-[12px] text-ink-soft">{dateTimeFmt(o.created_at)}</p>
                    </div>
                    <span className={"rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider " + (o.status === "delivered" ? "bg-mint" : o.status === "cancelled" ? "bg-blush text-rose-deep" : "bg-butter")}>{o.status}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {its.slice(0, 4).map((i) => (
                      <img key={i.id} src={i.image || "/img/hero.jpg"} alt={i.name} className="h-14 w-12 rounded-lg object-cover" />
                    ))}
                    {its.length > 4 && <span className="self-center text-[12px] font-bold text-ink-soft">+{its.length - 4}</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-ink-soft">{its.length} item{its.length === 1 ? "" : "s"} · {o.payment_method} · {o.payment_status}</span>
                    <b className="font-display text-lg">{inr(o.total)}</b>
                  </div>
                </Link>
              );
            })}
            {orders === null && <p className="font-script text-2xl text-ink-soft md:col-span-2">loading your gifts…</p>}
          </div>
        )}

        {tab === "addresses" && <Addresses addresses={addresses} userId={user.id} reload={load} />}
        {tab === "profile" && <ProfileTab profile={profile} reload={load} />}
      </div>
    </section>
  );
}

function Addresses({ addresses, userId, reload }: { addresses: Address[] | null; userId: string; reload: () => void }) {
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const save = async () => {
    if (!editing) return;
    const sb = browserSupabase();
    const payload = { ...editing, user_id: userId, is_default: !!editing.is_default };
    if (editing.id) await sb.from("addresses").update(payload).eq("id", editing.id);
    else await sb.from("addresses").insert(payload);
    if (payload.is_default) {
      const all = await sb.from("addresses").select("id").eq("user_id", userId).neq("id", editing.id ?? "");
      if (all.data?.length) await sb.from("addresses").update({ is_default: false }).in("id", all.data.map((a: { id: string }) => a.id));
    }
    setEditing(null);
    reload();
  };
  return (
    <div>
      <button className="btn-primary mb-6" onClick={() => setEditing({ label: "Home", is_default: (addresses ?? []).length === 0 })}>+ Add address</button>
      <div className="grid gap-5 md:grid-cols-3">
        {(addresses ?? []).map((a) => (
          <div key={a.id} className="rounded-[24px] border border-line bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-semibold">{a.label} {a.is_default && <span className="ml-1 rounded-full bg-mint px-2 py-0.5 text-[10px] font-black uppercase">default</span>}</p>
              <button className="text-[11px] font-black uppercase tracking-wider text-ink-soft hover:text-rose-deep" onClick={async () => { if (confirm("Remove this address?")) { await browserSupabase().from("addresses").delete().eq("id", a.id); reload(); } }}>Remove</button>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              <b className="text-ink">{a.name}</b> · {a.phone}<br />
              {a.address}{a.landmark ? `, ${a.landmark}` : ""}<br />{a.city} — {a.pincode}
            </p>
            <div className="mt-4 flex gap-3">
              <button className="text-[11px] font-black uppercase tracking-wider text-rose hover:underline" onClick={() => setEditing(a)}>Edit</button>
              {!a.is_default && (
                <button className="text-[11px] font-black uppercase tracking-wider text-ink-soft hover:underline" onClick={async () => {
                  const sb = browserSupabase();
                  await sb.from("addresses").update({ is_default: false }).eq("user_id", userId).neq("id", a.id);
                  await sb.from("addresses").update({ is_default: true }).eq("id", a.id);
                  reload();
                }}>Make default</button>
              )}
            </div>
          </div>
        ))}
        {addresses?.length === 0 && <p className="font-script text-2xl text-ink-soft md:col-span-3">your address book is empty — add one for lightning checkout ♥</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-line bg-cream p-8" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-2xl font-semibold">{editing.id ? "Edit address" : "New address"}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className="label">Label</label><input className="input" value={editing.label ?? ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Home / Office / Maika" /></div>
              <div><label className="label">Receiver name</label><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div><label className="label">Pincode</label><input className="input" maxLength={6} value={editing.pincode ?? ""} onChange={(e) => setEditing({ ...editing, pincode: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div><label className="label">Landmark</label><input className="input" value={editing.landmark ?? ""} onChange={(e) => setEditing({ ...editing, landmark: e.target.value })} /></div>
              <div><label className="label">City</label><input className="input" value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-rose" checked={!!editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} /> Default address</label>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="btn-rose" onClick={save}>Save address</button>
              <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ profile, reload }: { profile: Profile | null; reload: () => void }) {
  const [f, setF] = useState({ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" });
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  useEffect(() => { setF({ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" }); }, [profile]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="rounded-[26px] border border-line bg-white/70 p-7" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await browserSupabase().from("profiles").upsert({ id: profile?.id, full_name: f.full_name, phone: f.phone.replace(/\D/g, "").slice(-10), updated_at: new Date().toISOString() });
        setMsg(error ? error.message : "Profile saved ✓");
        if (!error) reload();
      }}>
        <p className="font-display text-xl font-semibold">Profile</p>
        <div className="mt-5 grid gap-4">
          <div><label className="label">Full name</label><input className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <button className="btn-rose">Save profile</button>
          {msg && <p className="text-sm font-bold text-mint-deep">{msg}</p>}
        </div>
      </form>
      <form className="rounded-[26px] border border-line bg-white/70 p-7" onSubmit={async (e) => {
        e.preventDefault();
        if (pw.next !== pw.confirm) return setPwMsg("Passwords don't match.");
        const { error } = await browserSupabase().auth.updateUser({ password: pw.next });
        setPwMsg(error ? error.message : "Password changed ✓ — use it next time you sign in.");
        if (!error) setPw({ next: "", confirm: "" });
      }}>
        <p className="font-display text-xl font-semibold">Change password</p>
        <div className="mt-5 grid gap-4">
          <div><label className="label">New password</label><input className="input" type="password" minLength={8} required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <div><label className="label">Confirm new password</label><input className="input" type="password" minLength={8} required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
          <button className="btn-primary">Update password</button>
          {pwMsg && <p className="text-sm font-bold text-rose-deep">{pwMsg}</p>}
        </div>
      </form>
    </div>
  );
}
