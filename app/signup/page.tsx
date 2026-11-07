"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { browserSupabase } from "@/lib/supabase/browser";

export default function Signup() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", email: "", pw: "" });
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const sb = browserSupabase();
    const { data, error } = await sb.auth.signUp({
      email: f.email,
      password: f.pw,
      options: {
        data: { full_name: f.name, phone: f.phone.replace(/\D/g, "").slice(-10) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) {
      // email auto-confirmed → profile trigger already ran; just continue
      router.push("/account");
      router.refresh();
    } else {
      setSent(true);
    }
  };

  if (sent)
    return (
      <AuthShell title="One last step" script="check your inbox ♥">
        <div className="rounded-2xl bg-mint p-6 text-[15px] leading-relaxed">
          <p className="font-bold">We've sent a confirmation link to {f.email}.</p>
          <p className="mt-2 text-ink/70">Click it once and your account is live — order history, saved addresses, faster checkout. No email? Check spam, or write to us on WhatsApp.</p>
        </div>
        <Link href="/login" className="btn-ghost mt-5 w-full">Back to sign in</Link>
      </AuthShell>
    );

  return (
    <AuthShell title="Create your account" script="gifts remember you here">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Aisha Sharma" /></div>
        <div><label className="label">Mobile (for delivery updates)</label><input className="input" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98765 43210" /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" /></div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} placeholder="8+ characters" />
          <p className="mt-1 text-[11px] text-ink-soft">Mix letters, a number & a symbol — your future self thanks you.</p>
        </div>
        {err && <p className="rounded-xl bg-blush px-4 py-3 text-sm font-bold text-rose-deep">{err}</p>}
        <button className="btn-rose w-full" disabled={busy}>{busy ? "Tying your account…" : "Create account"}</button>
        <p className="text-center text-[13px] font-semibold text-ink-soft">
          Already family? <Link href="/login" className="text-rose hover:underline">Sign in →</Link>
        </p>
      </form>
    </AuthShell>
  );
}
