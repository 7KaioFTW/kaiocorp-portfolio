// src/lib/three/island/chapters.test.ts
import { describe, expect, it } from "vitest";
import { CLOUD_Y, cloudVeil, deepness, pillarReveal, portalCharge, ringFade, visibilityAt } from "./chapters";

describe("visibilityAt", () => {
  it("hero: island + both far cloud zones (the portal-cradle clouds frame the hero horizon)", () => {
    expect(visibilityAt(0, 6.5)).toEqual({ island: true, ring: false, stats: false, portal: false, cloudBackground: true, cloudPortal: true });
  });
  it("ring chapter: ring (island culled below y −30) + both far cloud zones, seen through the cloud-sea gaps; stats already drawn", () => {
    expect(visibilityAt(0.4, -39)).toEqual({ island: false, ring: true, stats: true, portal: false, cloudBackground: true, cloudPortal: true });
  });
  it("ring gate opens at 0.075 — phones see the ring through a cloud gap from ~0.09 (T11 scan: no pixel at 0.065–0.085, 360–430 px wide)", () => {
    expect(visibilityAt(0.07, 5).ring).toBe(false);
    expect(visibilityAt(0.08, 5).ring).toBe(true);
    expect(visibilityAt(0.69, -41).ring).toBe(true);
    expect(visibilityAt(0.7, -41).ring).toBe(false);
  });
  it("stats gate opens at 0.34 — the pillar rocks show through the ring from ~0.38 (32:9) / ~0.40 (16:10) (T11 scan: none at 0.22–0.38)", () => {
    expect(visibilityAt(0.33, -39).stats).toBe(false);
    expect(visibilityAt(0.35, -39).stats).toBe(true);
    expect(visibilityAt(0.9, 3).stats).toBe(false);
  });
  it("far cloud zones are hidden only where they draw no pixel (T9 scan), gates ≥ 0.03 inside those windows", () => {
    expect(visibilityAt(0.29, -39)).toMatchObject({ cloudBackground: false, cloudPortal: false }); // dive end / ring entry
    expect(visibilityAt(0.35, -39)).toMatchObject({ cloudBackground: true, cloudPortal: false });
    expect(visibilityAt(0.24, -25)).toMatchObject({ cloudBackground: true, cloudPortal: true }); // still in the veil
    expect(visibilityAt(0.78, -41)).toMatchObject({ cloudBackground: true, cloudPortal: true }); // climb starts
  });
  it("stats chapter: stats + portal (prototype gates), ring gate closes at 0.7", () => {
    expect(visibilityAt(0.7, -41)).toMatchObject({ ring: false, stats: true, portal: true, cloudPortal: true, cloudBackground: false });
  });
  it("portal chapter: portal + both far cloud zones", () => {
    expect(visibilityAt(0.95, 14)).toMatchObject({ island: true, stats: false, portal: true, cloudBackground: true, cloudPortal: true });
  });
});

describe("ringFade", () => {
  it("landscape: always 1 — the ring keeps its hard 0.7 gate, unchanged", () => {
    for (const p of [0, 0.556, 0.58, 0.6, 0.65, 0.69]) expect(ringFade(p, 1440 / 900)).toBe(1);
    expect(ringFade(0.6, 1)).toBe(1); // square counts as landscape
  });
  it("portrait: 1 through the ring chapter, 1 → 0 over p 0.556 → 0.6, 0 from the pillar reveal on", () => {
    const a = 390 / 844;
    expect(ringFade(0.5, a)).toBe(1);
    expect(ringFade(0.556, a)).toBe(1);
    expect(ringFade(0.578, a)).toBeCloseTo(0.5, 6);
    expect(ringFade(0.6, a)).toBe(0);
    expect(ringFade(0.65, a)).toBe(0);
    expect(ringFade(0.6, 0)).toBe(0);
    expect(pillarReveal(0.6, 0)).toBe(0); // the first pillar starts rising exactly when the ring is gone
  });
  it("portrait fade is monotonic (no flicker while scrolling)", () => {
    let prev = 1;
    for (let p = 0.55; p <= 0.61; p += 0.001) {
      const f = ringFade(p, 0.5);
      expect(f).toBeLessThanOrEqual(prev);
      prev = f;
    }
  });
});

describe("pillarReveal", () => {
  it("is 0 before 0.6, 1 once risen, staggered per pillar", () => {
    expect(pillarReveal(0.6, 0)).toBe(0);
    expect(pillarReveal(0.675, 0)).toBe(1);
    expect(pillarReveal(0.64, 0)).toBeGreaterThan(pillarReveal(0.64, 3));
    expect(pillarReveal(0.72, 3)).toBe(1);
  });
});

describe("atmosphere helpers", () => {
  it("portalCharge ramps 0.84 → 1", () => {
    expect(portalCharge(0.84)).toBe(0);
    expect(portalCharge(1)).toBe(1);
  });
  it("deepness ramps from y −17 to y −31", () => {
    expect(deepness(-17)).toBe(0);
    expect(deepness(-31)).toBe(1);
  });
  it("cloudVeil peaks inside the cloud layer, away from the island axis", () => {
    expect(cloudVeil(CLOUD_Y + 0.5, 10)).toBeCloseTo(0.86, 6);
    expect(cloudVeil(CLOUD_Y + 0.5, 2)).toBe(0);
    expect(cloudVeil(10, 10)).toBe(0);
  });
});
