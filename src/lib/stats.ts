// Total des minutes jouées, calculé en direct depuis maps.json (source de vérité).
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const maps = mapsData as FortniteMap[];

function toMinutes(s: string): number {
  const n = parseFloat(s);
  if (s.includes("B")) return n * 1_000_000_000;
  if (s.includes("M")) return n * 1_000_000;
  if (s.includes("K")) return n * 1_000;
  return n;
}

export const TOTAL_MINUTES = maps.reduce((sum, m) => sum + toMinutes(m.stats.minutesPlayed), 0);

// Format FR court, arrondi à la baisse pour rester crédible : "4,5 Md+", "X M+".
export function formatMinutesFr(n: number): string {
  if (n >= 1_000_000_000) return `${(Math.floor(n / 100_000_000) / 10).toLocaleString("fr-FR")} Md+`;
  if (n >= 1_000_000) return `${Math.floor(n / 1_000_000)} M+`;
  if (n >= 1_000) return `${Math.floor(n / 1_000)} K+`;
  return `${Math.round(n)}`;
}

export const TOTAL_MINUTES_LABEL = formatMinutesFr(TOTAL_MINUTES);
