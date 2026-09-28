// Quality tiers for the 3D homepage (spec §4, §6) — pure and unit-tested. boot.ts runs the same
// decision before first paint (minus the WebGL2 probe); boot.test.ts keeps the two in sync.

export type Preference = "auto" | "on" | "off";
export type Tier = "high" | "medium" | "off";

export interface DeviceSignals {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB, capped at 8 by browsers); undefined when unsupported. */
  deviceMemory: number | undefined;
  coarsePointer: boolean;
  devicePixelRatio: number;
}

export function selectTier(s: DeviceSignals, pref: Preference): Tier {
  if (!s.webgl2 || pref === "off") return "off";
  const constrained = s.saveData || (s.deviceMemory !== undefined && s.deviceMemory < 4);
  // Without an explicit opt-in, reduced motion and constrained devices get the poster.
  if (pref !== "on" && (s.reducedMotion || constrained)) return "off";
  if (constrained || s.coarsePointer || (s.deviceMemory !== undefined && s.deviceMemory < 8)) return "medium";
  return "high";
}

export interface QualitySettings {
  tier: Exclude<Tier, "off">;
  dpr: number;
  msaa: number;
  /** IcosahedronGeometry detail of a cloud puff. */
  cloudDetail: number;
  /** Multiplier on the sea / background / portal cloud cluster counts. */
  cloudCountScale: number;
  particleScale: number;
  /** Bloom render-target scale relative to the drawing buffer. */
  bloomScale: number;
}

export function settingsFor(tier: Exclude<Tier, "off">, devicePixelRatio: number): QualitySettings {
  if (tier === "medium") {
    return { tier, dpr: Math.min(devicePixelRatio, 1), msaa: 2, cloudDetail: 3, cloudCountScale: 0.6, particleScale: 0.5, bloomScale: 0.5 };
  }
  const dpr = Math.min(devicePixelRatio, 1.5);
  return { tier, dpr, msaa: dpr > 1 ? 2 : 4, cloudDetail: 5, cloudCountScale: 1, particleScale: 1, bloomScale: 1 };
}

// ---- Adaptive step-down (prototype 1654–1662, fixed) ----

export interface RenderScale {
  dpr: number;
  msaa: number;
}
export type PerfDecision = { kind: "keep" } | { kind: "step"; next: RenderScale } | { kind: "giveUp" };

/** Frames per measurement window. */
export const PERF_WINDOW = 150;
export const PERF_TARGET_FPS = 45;
export const PERF_FLOOR_FPS = 20;
const FLOOR_DPR = 0.85;

/** Next rung: DPR 1.5 → 1 → 0.85, MSAA never above 2 once stepping (samples follow DPR down), then MSAA off. */
export function stepDown({ dpr, msaa }: RenderScale): RenderScale | null {
  if (dpr > 1) return { dpr: 1, msaa: Math.min(msaa, 2) };
  if (dpr > FLOOR_DPR) return { dpr: FLOOR_DPR, msaa: Math.min(msaa, 2) };
  if (msaa > 0) return { dpr, msaa: 0 };
  return null;
}

/**
 * Decision after one window. avgFps comes from UNCLAMPED frame times, so < 20 fps is visible:
 * below the floor we jump straight to the lowest rung, and give up (poster) if already there.
 */
export function decidePerf(avgFps: number, current: RenderScale): PerfDecision {
  if (avgFps >= PERF_TARGET_FPS) return { kind: "keep" };
  if (avgFps < PERF_FLOOR_FPS) {
    const floor = { dpr: Math.min(current.dpr, FLOOR_DPR), msaa: 0 };
    const atFloor = floor.dpr === current.dpr && current.msaa === 0;
    return atFloor ? { kind: "giveUp" } : { kind: "step", next: floor };
  }
  const next = stepDown(current);
  return next ? { kind: "step", next } : { kind: "keep" };
}

// ---- Reading the signals (everything but the WebGL2 probe) ----

export interface SignalSource {
  matchMedia(query: string): { matches: boolean };
  navigator: unknown;
  devicePixelRatio: number;
}

export function readSignals(win: SignalSource): Omit<DeviceSignals, "webgl2"> {
  const nav = win.navigator as { deviceMemory?: unknown; connection?: { saveData?: unknown } };
  return {
    reducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined,
    coarsePointer: win.matchMedia("(pointer: coarse)").matches,
    devicePixelRatio: win.devicePixelRatio || 1,
  };
}
