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

export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}
