"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { Reveal } from "./reveal";
import { browserSupabase } from "@/lib/supabase/browser";

export function AuthShell({ title, script, children }: { title: string; script: string; children: ReactNode }) {
  const google = async () => {
    const sb = browserSupabase();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/account` },
    });
    if (error) {
      const el = document.getElementById("google-err");
      if (el) el.textContent =
        /provider|enabled/i.test(error.message)
          ? "Google sign-in isn't switched on for this project yet — open GOOGLE-LOGIN-SETUP.md in the project folder and follow the 6-minute setup (Google Cloud keys → Supabase dashboard → done)."
          : error.message;
    }
  };

  return (
    <section className="wrap grid min-h-[86vh] items-center gap-12 py-14 lg:grid-cols-[1fr_1.05fr]">
      <Reveal className="relative hidden lg:block">
        <div className="overflow-hidden rounded-t-[240px] rounded-b-[36px] border border-ink/10 shadow-[0_40px_90px_-40px_rgba(62,54,44,0.45)]">
          <img src="/img/story.jpg" alt="The Taj Gifts studio" className="aspect-[4/4.6] w-full object-cover" />
        </div>
        <div className="absolute -right-4 top-10 rotate-3 rounded-2xl bg-butter px-5 py-3 shadow-lg">
          <p className="font-script text-2xl">your hampers, your account ♥</p>
        </div>
        <div className="absolute -left-6 bottom-14 -rotate-2 rounded-2xl bg-mint px-5 py-3 shadow-lg">
          <p className="font-script text-2xl">order history · saved addresses</p>
        </div>
      </Reveal>
      <Reveal delay={0.1} y={26}>
        <div className="mx-auto w-full max-w-md rounded-[32px] border border-line bg-white/75 p-9 shadow-[0_30px_80px_-40px_rgba(62,54,44,0.35)] backdrop-blur">
          <Link href="/" className="font-display text-2xl font-semibold">Taj Gifts<span className="text-rose">.</span></Link>
          <h1 className="font-display mt-6 text-4xl font-medium leading-tight">{title}</h1>
          <p className="mt-1 font-script text-2xl text-rose">{script}</p>
          <div className="mt-7">{children}</div>
          <button
            onClick={google}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-6 py-3.5 text-[13px] font-bold tracking-wide transition hover:border-ink/40 hover:shadow-md"
          >
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.8 2.9c2.3-2.1 3.6-5.1 3.6-8.6Z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-4.9L1.4 17.4C3.3 21.3 7.3 24 12 24Z" />
              <path fill="#FBBC05" d="M5.3 14.5c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L1.4 7.1C.5 8.7 0 10.5 0 12.3s.5 3.6 1.4 5.1l3.9-2.9Z" />
              <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.4-3.3C17 1 14.2 0 12 0 7.3 0 3.3 2.7 1.4 6.6l3.9 3c.9-2.8 3.6-4.9 6.7-4.9Z" />
            </svg>
            Continue with Google
          </button>
          <p id="google-err" className="mt-3 min-h-[1em] text-center text-[12px] font-semibold leading-snug text-rose-deep" />
        </div>
      </Reveal>
    </section>
  );
}
