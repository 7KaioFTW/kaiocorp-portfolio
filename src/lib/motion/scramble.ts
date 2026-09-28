// Pure: one frame of the HUD "decode" effect — unit-tested in scramble.test.ts.
const DIGITS = "0123456789";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";

function pool(ch: string): string | null {
  if (ch >= "0" && ch <= "9") return DIGITS;
  if (ch !== ch.toLowerCase()) return UPPER;
  if (ch !== ch.toUpperCase()) return LOWER;
  return null; // spaces, punctuation, symbols stay as-is
}

/**
 * Letters/digits resolve left→right as `progress` goes 0→1; unresolved ones show a random glyph
 * of the same class (digit→digit, upper→upper, lower→lower). Length never changes.
 */
export function scrambleFrame(final: string, progress: number, rand: () => number = Math.random): string {
  const chars = Array.from(final);
  const slots = chars.flatMap((ch, i) => (pool(ch) ? [i] : []));
  const p = Math.min(Math.max(progress, 0), 1);
  const resolved = Math.floor(p * slots.length);
  for (let k = resolved; k < slots.length; k++) {
    const i = slots[k];
    const glyphs = pool(chars[i]) ?? "";
    chars[i] = glyphs[Math.floor(rand() * glyphs.length)] ?? chars[i];
  }
  return chars.join("");
}
