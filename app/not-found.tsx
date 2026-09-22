import Link from "next/link";

export const metadata = { title: "Page not found — Taj Gifts" };

export default function NotFound() {
  return (
    <section className="wrap grid min-h-[70vh] place-items-center pb-24 pt-16 text-center">
      <div>
        <p className="font-display text-7xl font-semibold">
          Taj<span className="text-rose">.</span>
        </p>
        <p className="eyebrow mt-6">404 — this ribbon leads nowhere</p>
        <h1 className="font-display mt-3 text-4xl font-medium leading-tight">
          The page you want has been <span className="italic text-rose">re-gifted.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ink-soft">
          No worries — the hampers are all still here, hand-tied and waiting.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link className="btn-rose" href="/">Back to home</Link>
          <Link className="btn-ghost" href="/shop">Shop hampers</Link>
        </div>
      </div>
    </section>
  );
}
