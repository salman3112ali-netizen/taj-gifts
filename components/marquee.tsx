export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = [...items, ...items];
  return (
    <div className={"relative overflow-hidden border-y border-ink/10 bg-blush/60 py-3.5 " + className}>
      <div className="flex w-max animate-marquee gap-0 whitespace-nowrap will-change-transform">
        {row.map((t, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-6 text-[12px] font-extrabold uppercase tracking-[0.28em] text-ink/80">
            {t}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-rose">
              <path d="M12 2c.6 4.8 2.4 7.4 4.6 9.2 2 1.6 4.4 2.2 5.4 2.3-1 .1-3.4.7-5.4 2.3-2.2 1.8-4 4.4-4.6 9.2-.6-4.8-2.4-7.4-4.6-9.2-2-1.6-4.4-2.2-5.4-2.3 1-.1 3.4-.7 5.4-2.3C9.6 9.4 11.4 6.8 12 2Z" fill="currentColor" />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SpinBadge({ text = "hand-tied in kashipur · uttarakhand · ", className = "" }: { text?: string; className?: string }) {
  return (
    <div className={"relative h-28 w-28 " + className} data-cursor>
      <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow">
        <defs>
          <path id="circlePath" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
        </defs>
        <text className="fill-ink text-[8.6px] font-bold uppercase" style={{ letterSpacing: "0.22em" }}>
          <textPath href="#circlePath">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-rose">
          <path d="M12 21s-7.5-4.9-9.5-9C1 8.5 3 5 6.5 5c2 0 3.6 1.2 4.4 2.6L12 9l1.1-1.4C13.9 6.2 15.5 5 17.5 5 21 5 23 8.5 21.5 12c-2 4.1-9.5 9-9.5 9Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}
