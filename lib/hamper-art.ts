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
  const subject = (opts.contents && opts.contents.length ? opts.contents : opts.names).slice(0, 6).join(", ");
  const prompt =
    `Sharp studio product photo of an open wicker gift hamper basket on cream linen: ${subject}. ` +
    (opts.occasion ? `${opts.occasion} accents. ` : "") +
    `Pastel blush, lavender and mint palette, bright soft daylight, crisp focus, high detail, ` +
    `clean composition, silk ribbon bow, blank kraft tag, unlit candles only, no text, no people`;
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=1024&height=1280&seed=${hashSeed(opts.seed)}&model=flux&nologo=true`
  );
}
