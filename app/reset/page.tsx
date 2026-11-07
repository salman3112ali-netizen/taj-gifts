"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { browserSupabase } from "@/lib/supabase/browser";

export default function Reset() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // the reset email link lands here with a recovery session in the hash/cookies
    browserSupabase().auth.getSession().then((res: { data: { session: import("@supabase/supabase-js").Session | null } }) => setReady(!!res.data.session));
  }, []);

  if (!ready)
    return (
      <AuthShell title="Almost there" script="checking your reset link…">
        <p className="text-sm text-ink-soft">If this page doesn't continue automatically, use the link from your email again — it expires in 60 minutes.</p>
      </AuthShell>
    );

  return (
    <AuthShell title="Pick a new password" script="fresh start, same hampers">
      {done ? (
        <div className="rounded-2xl bg-mint p-6 text-[15px] font-bold">Password updated — signing you in…</div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await browserSupabase().auth.updateUser({ password: pw });
            if (error) return setErr(error.message);
            setDone(true);
            setTimeout(() => router.push("/account"), 900);
          }}
        >
          <div><label className="label">New password</label><input className="input" type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="8+ characters" /></div>
          {err && <p className="rounded-xl bg-blush px-4 py-3 text-sm font-bold text-rose-deep">{err}</p>}
          <button className="btn-rose w-full">Update password</button>
        </form>
      )}
    </AuthShell>
  );
}
