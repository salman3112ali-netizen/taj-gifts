"use client";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  return (
    <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
      <div>
        <p className="eyebrow text-blush-deep">First look, always</p>
        <h3 className="font-display mt-3 text-3xl font-semibold leading-tight md:text-4xl">
          Festival drops & early-bird prices, straight to your inbox.
        </h3>
        <p className="mt-3 max-w-md text-sm text-cream/70">
          One gentle email a month — new hamper launches, Diwali & Rakhi pre-order windows, and subscriber-only codes.
        </p>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
          const j = await res.json();
          setState(j.ok ? "done" : "error");
          if (j.ok) setEmail("");
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-cream/25 bg-cream/10 px-6 py-4 text-sm text-cream placeholder:text-cream/40 outline-none transition focus:border-blush-deep focus:bg-cream/15"
        />
        <button className="rounded-full bg-blush px-8 py-4 text-[12px] font-black uppercase tracking-[0.18em] text-ink transition hover:bg-cream">
          {state === "done" ? "You're in ♥" : "Join the list"}
        </button>
      </form>
      {state === "done" && <p className="text-sm text-mint md:col-span-2">Lovely — you're on the list. Watch for our next drop!</p>}
      {state === "error" && <p className="text-sm text-blush-deep md:col-span-2">Hmm, that email didn't look right. Mind checking it?</p>}
    </div>
  );
}
