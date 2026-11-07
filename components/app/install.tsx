"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Native install button: uses Chrome/Android's install prompt, falls back to 30-second manual steps. */
export default function InstallButton({ className = "btn-primary w-full justify-center py-4 text-[12px]" }: { className?: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", on);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  if (installed) return <p className="rounded-2xl bg-mint px-4 py-3.5 text-center text-[13px] font-bold">App installed — open it from your home screen 🎀</p>;
  if (evt)
    return (
      <button
        className={className}
        onClick={async () => {
          await evt.prompt();
          setEvt(null);
        }}
      >
        ⬇ Install the Taj Gifts app — free
      </button>
    );
  return (
    <details className="rounded-2xl border border-ink/12 bg-white/70 p-4 text-[13px] leading-relaxed">
      <summary className="cursor-pointer font-bold">Install in 30 seconds (no store needed)</summary>
      <p className="mt-2"><b>Android / Chrome:</b> menu ⋮ → <b>“Install app” / “Add to Home screen”</b>.</p>
      <p className="mt-1"><b>iPhone / Safari:</b> Share ▢ → <b>Add to Home Screen</b>.</p>
      <p className="mt-1 text-ink-soft">It then opens full-screen with its own Taj icon — free forever, updates itself.</p>
    </details>
  );
}
