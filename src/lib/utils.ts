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
