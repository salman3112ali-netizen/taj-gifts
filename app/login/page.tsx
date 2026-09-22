"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { browserSupabase } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(params.get("error") ? "That link didn't work — please sign in again." : null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await browserSupabase().auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error)
      return setErr(
        /Invalid/i.test(error.message)
          ? "Email or password doesn't match our records."
          : /not confirmed/i.test(error.message)
          ? "Please confirm your email first — tap the link we sent at signup. Lost it? Sign up again with the same email to resend."
          : error.message
      );
    router.push(params.get("next") || "/");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
      </div>
      {err && <p className="rounded-xl bg-blush px-4 py-3 text-sm font-bold text-rose-deep">{err}</p>}
      <button className="btn-rose w-full" disabled={busy}>{busy ? "Opening the door…" : "Sign in"}</button>
      <div className="flex items-center justify-between text-[13px] font-semibold">
        <Link href="/forgot" className="text-ink-soft hover:text-rose">Forgot password?</Link>
        <Link href="/signup" className="text-rose hover:underline">Create an account →</Link>
      </div>
    </form>
  );
}

export default function Login() {
  return (
    <Suspense>
      <AuthShell title="Welcome back" script="the ribbons missed you">
        <LoginForm />
      </AuthShell>
    </Suspense>
  );
}
