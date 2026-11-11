"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { browserSupabase } from "@/lib/supabase/browser";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [f, setF] = useState({ name: "", phone: "", email: "", pw: "" });
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (f.pw.length < 10) {
      return setErr("Please use at least 10 characters — a short phrase you'll remember works well.");
    }
    setBusy(true);
    const sb = browserSupabase();
    const { data, error } = await sb.auth.signUp({
      email: f.email,
      password: f.pw,
      options: {
        data: { full_name: f.name, phone: f.phone.replace(/\D/g, "").slice(-10) },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthShell title="One last step" script="check your inbox ♥">
        <div className="rounded-2xl bg-mint p-6 text-[15px] leading-relaxed">
          <p className="font-medium">We&apos;ve sent a confirmation link to {f.email}.</p>
          <p className="mt-2 text-ink/70">Click it once and your account is live. Then you&apos;ll return to your account or checkout securely.</p>
        </div>
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-ghost mt-5 w-full">Back to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" script="gifts remember you here">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Aisha Sharma" /></div>
        <div><label className="label">Mobile (for delivery updates)</label><input className="input" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98765 43210" /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="you@example.com" /></div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={10} value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} placeholder="10+ characters" />
          <p className="mt-1 text-[11px] text-ink-soft">Use at least 8 characters. A mix of letters, numbers and a symbol is safer.</p>
        </div>
        {err && <p className="rounded-xl bg-blush px-4 py-3 text-sm font-medium text-rose-deep">{err}</p>}
        <button className="btn-rose w-full" disabled={busy}>{busy ? "Creating your account…" : "Create account"}</button>
        <p className="text-center text-[13px] font-medium text-ink-soft">
          Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-rose hover:underline">Sign in →</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function Signup() {
  return <Suspense><SignupForm /></Suspense>;
}
