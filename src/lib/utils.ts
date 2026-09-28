import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseStatNumber(stat: string): number {
  const num = parseFloat(stat);
  if (stat.includes("B")) return num * 1_000_000_000;
  if (stat.includes("M")) return num * 1_000_000;
  if (stat.includes("K")) return num * 1_000;
  return num;
}

/** Leaderboard order: pinned maps first (in maps.json order), then the rest by minutes played, highest first. */
export function leaderboardOrder<T extends { pinned?: boolean; stats: { minutesPlayed: string } }>(maps: readonly T[]): T[] {
  const pinned = maps.filter((m) => m.pinned);
  const ranked = maps.filter((m) => !m.pinned).sort((a, b) => parseStatNumber(b.stats.minutesPlayed) - parseStatNumber(a.stats.minutesPlayed));
  return [...pinned, ...ranked];
}
