"use client";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { browserSupabase } from "@/lib/supabase/browser";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <AuthShell title="Forgot password?" script="it happens to the best of us">
      {sent ? (
        <div className="rounded-2xl bg-mint p-6 text-[15px] leading-relaxed">
          <p className="font-bold">Reset link sent to {email}.</p>
          <p className="mt-2 text-ink/70">It lands within a minute. The link opens a secure page where you pick a new password.</p>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await browserSupabase().auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset`,
            });
            if (error) setErr(error.message);
            else setSent(true);
          }}
        >
          <div><label className="label">Your email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          {err && <p className="rounded-xl bg-blush px-4 py-3 text-sm font-bold text-rose-deep">{err}</p>}
          <button className="btn-rose w-full">Email me a reset link</button>
        </form>
      )}
    </AuthShell>
  );
}
