const NUMBER = /\d+(?:[.,]\d+)?/;

/**
 * Stat label while its pillar rises: the first number in `final` scaled by t ∈ [0, 1], keeping the
 * label's decimals, decimal separator and surrounding text ("4,9 Md+" → "2,0 Md+" at t ≈ 0.4).
 * t ≥ 1 returns `final` untouched.
 */
export function countUpText(final: string, t: number): string {
  if (t >= 1) return final;
  const match = NUMBER.exec(final);
  if (!match) return final;
  const raw = match[0];
  const separator = raw.includes(",") ? "," : ".";
  const [, fraction = ""] = raw.split(/[.,]/);
  const k = Number.isFinite(t) ? Math.max(0, t) : 0;
  const value = parseFloat(raw.replace(",", ".")) * k;
  const text = value.toFixed(fraction.length).replace(".", separator);
  return final.slice(0, match.index) + text + final.slice(match.index + raw.length);
}
