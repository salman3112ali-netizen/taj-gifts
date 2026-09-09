/**
 * Auto-generated "artist's preview" of a hamper — deterministic per order.
 * Uses the free Pollinations image API (no key needed). Same seed = same picture,
 * so the preview stays stable every time the order page is opened.
 * Recipe tuned to the Taj Gifts pastel house style (high-key, wicker, unlit candles).
 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h % 1000000);
}

export function hamperArtUrl(opts: { names: string[]; contents?: string[]; occasion?: string; seed: string }): string {
  const subject = (opts.contents && opts.contents.length ? opts.contents : opts.names).slice(0, 8).join(", ");
  const prompt =
    `High-key bright studio product photograph, soft diffused daylight, cream linen backdrop, ` +
    `pastel palette of blush pink, lavender, mint and butter yellow: ` +
    `one open natural wicker gift hamper box lined with blush tissue paper, filled neatly with: ${subject}. ` +
    (opts.occasion ? `${opts.occasion} occasion accents. ` : "") +
    `All candles unlit, no flames, no smoke, bright ambient light, clean minimal composition, ` +
    `silk ribbon bow on the box, blank kraft paper gift tag, award-winning editorial styling, no text, no people`;
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=768&height=960&seed=${hashSeed(opts.seed)}&model=flux&nologo=true`
  );
}
