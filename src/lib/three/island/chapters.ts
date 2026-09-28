// src/lib/three/island/chapters.ts
import { easeOutCubic, sstep } from "./math";

// Where the chapters live in world space (prototype values) and when each one is drawn. Pure.

export const RING_CENTER = [0, -40, 0] as const;
export const RING_RADIUS = 17;
export const CLOUD_Y = -23.5;
export const PORTAL_POS = [0, 22, -86] as const;
export const STAT_Z = -52;
export const STAT_BASE_Y = -50;
/** One pillar per StatsBand stat. */
export const STAT_COUNT = 4;

export interface Visibility {
  island: boolean;
  ring: boolean;
  stats: boolean;
  portal: boolean;
  /** High background cloud zone (hero depth layers, prototype line 903). */
  cloudBackground: boolean;
  /** Clouds cradling the portal (prototype line 905). */
  cloudPortal: boolean;
}

/**
 * Chapter culling (prototype 1564–1567) + the two far cloud zones. Those are hidden only inside the p windows
 * where they draw no pixel at any tested aspect (T9 scan, 360–2560 px wide: background none at p 0.21–0.36 and
 * 0.63–0.795, portal cradle none at 0.21–0.41); every gate sits ≥ 0.03 inside a window, so toggling never pops.
 * T11 scan (frozen clock, gated unit forced on vs off, 360–3840 px wide): the prototype's ring gate at 0.17 popped
 * on phones (screens in a cloud gap from ~0.09) → 0.075, mid-window of the only p range no phone sees it in
 * (0.065–0.085: a ~0.01 margin, not 0.03 — none wider exists);
 * its stats gate at 0.5 popped everywhere (pillar rocks through the ring from ~0.38 on 32:9, ~0.40 on 16:10) → 0.34.
 */
export function visibilityAt(p: number, cameraY: number): Visibility {
  return {
    island: cameraY > -30,
    ring: p > 0.075 && p < 0.7,
    stats: p > 0.34 && p < 0.9,
    portal: p > 0.55,
    cloudBackground: p < 0.25 || (p > 0.33 && p < 0.66) || p > 0.75,
    cloudPortal: p < 0.25 || p > 0.38,
  };
}

/** Portrait map-ring fade window: 1 → 0 as the stats chapter begins (T11 fix round 1). */
export const RING_PORTRAIT_FADE = [0.556, 0.6] as const;

/**
 * Map-ring opacity. Portrait (aspect < 1) only: the pulled-back stats camera sits inside the ring, whose screens
 * would cover the pillars until the 0.7 gate and then vanish at once — so the ring fades out from the end of the
 * Réalisations chapter (0.556) and is gone when the first pillar starts rising (0.6). Landscape: always 1.
 */
export function ringFade(p: number, aspect: number): number {
  return aspect < 1 ? 1 - sstep(RING_PORTRAIT_FADE[0], RING_PORTRAIT_FADE[1], p) : 1;
}

/** 0..1 rise of stat pillar `index` (prototype line 1609). */
export function pillarReveal(p: number, index: number): number {
  return easeOutCubic((p - 0.6 - index * 0.012) / 0.075);
}

/** Portal charge (prototype line 1631). */
export function portalCharge(p: number): number {
  return sstep(0.84, 1, p);
}

/** 0 above the cloud sea → 1 below it (prototype line 1551). */
export function deepness(cameraY: number): number {
  return sstep(-17, -31, cameraY);
}

/** Cloud veil strength while the camera crosses the cloud layer (prototype line 1557). */
export function cloudVeil(cameraY: number, horizontalDistance: number): number {
  return sstep(6.5, 1.2, Math.abs(cameraY - (CLOUD_Y + 0.5))) * sstep(4, 8, horizontalDistance) * 0.86;
}
