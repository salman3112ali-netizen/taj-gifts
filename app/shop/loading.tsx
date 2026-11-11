export default function Loading() {
  return (
    <div className="wrap grid min-h-[55vh] place-items-center py-24 text-center" role="status" aria-live="polite">
      <div>
        <p className="font-display text-4xl font-medium">
          Taj<span className="text-rose">.</span>
        </p>
        <div className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-2 border-rose/25 border-t-rose" />
        <p className="mt-4 font-script text-2xl text-ink-soft">tying this page together…</p>
      </div>
    </div>
  );
}
