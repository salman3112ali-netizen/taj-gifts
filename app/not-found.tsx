import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="font-script text-4xl text-rose">oh no, a loose ribbon…</p>
        <h1 className="font-display mt-4 text-6xl font-medium">Page not found</h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] text-ink-soft">The hamper you're looking for may have been unwrapped, renamed, or never tied. Let's get you back to the good stuff.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="btn-primary">Back home</Link>
          <Link href="/shop" className="btn-ghost">Shop hampers</Link>
        </div>
      </div>
    </section>
  );
}
