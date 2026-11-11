"use client";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary. It never renders a stack trace, provider message or
 * customer data — only a calm recovery path and the studio's real contact routes.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server logs keep the diagnostic; the browser gets the friendly panel below.
    console.error("Taj Gifts route error:", error.digest || error.message);
  }, [error]);

  return (
    <section className="wrap grid min-h-[70vh] place-items-center pb-24 pt-16 text-center">
      <div>
        <p className="font-display text-6xl font-medium">
          Taj<span className="text-rose">.</span>
        </p>
        <p className="eyebrow mt-6 justify-center">Something slipped</p>
        <h1 className="font-display mt-3 text-4xl font-medium leading-tight md:text-5xl">
          That page didn&apos;t load <span className="italic text-rose">properly.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
          Nothing was charged and no order was placed by this error. Try again, or message the studio on WhatsApp and we will help immediately.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-rose">Try again</button>
          <Link className="btn-ghost" href="/shop">Back to the hampers</Link>
        </div>
        <p className="mt-6 text-[12px] text-ink-soft">
          If a payment was debited, it is being reviewed — <Link href="/contact" className="underline hover:text-rose">contact us with your order code</Link>.
        </p>
      </div>
    </section>
  );
}
