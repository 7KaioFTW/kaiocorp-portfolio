import { describe, expect, it } from "vitest";
import { buildAnchors, progressAt, scrollForProgress, stickyRange, type ChapterBoxes } from "./progress";

// A 900 px viewport, ring 300vh and stats 150vh (spec §3.2), stages exactly one viewport tall.
const BOXES: ChapterBoxes = {
  viewport: 900,
  maxScroll: 9500,
  heroBottom: 900,
  ringTop: 3000,
  ringHeight: 2700,
  ringStage: 900,
  statsTop: 5700,
  statsHeight: 1350,
  statsStage: 900,
  ctaTop: 9000,
  ctaHeight: 1000,
};

describe("stickyRange", () => {
  it("pins a viewport-tall stage from the section top for (height − viewport) px", () => {
    expect(stickyRange(3000, 2700, 900, 900)).toEqual([3000, 4800]);
  });
  it("pins a taller-than-viewport stage by its bottom", () => {
    // stage 1100 in a 900 viewport: sticks at top −200 → starts 200 px later, lasts height − stage
    expect(stickyRange(3000, 2700, 1100, 900)).toEqual([3200, 4800]);
  });
  it("never returns an inverted range", () => {
    expect(stickyRange(100, 500, 900, 900)).toEqual([100, 100]);
  });
});

describe("buildAnchors", () => {
  it("maps each chapter boundary to its spec p", () => {
    expect(buildAnchors(BOXES)).toEqual([
      { y: 0, p: 0 },
      { y: 900, p: 0.14 },
      { y: 3000, p: 0.27 },
      { y: 4800, p: 0.556 },
      { y: 5700, p: 0.59 },
      { y: 6150, p: 0.8 },
      { y: 8100, p: 0.906 },
      { y: 9100, p: 1 },
    ]);
  });
  it("ends at maxScroll when the CTA cannot reach the viewport top", () => {
    const anchors = buildAnchors({ ...BOXES, maxScroll: 8700 });
    expect(anchors[anchors.length - 1]).toEqual({ y: 8700, p: 1 });
  });
  it("keeps y non-decreasing when chapters are shorter than expected", () => {
    const anchors = buildAnchors({ ...BOXES, ctaTop: 6200 }); // CTA starts before the stats stage ends + 1 vh
    for (let i = 1; i < anchors.length; i++) expect(anchors[i].y).toBeGreaterThanOrEqual(anchors[i - 1].y);
  });
});

describe("progressAt", () => {
  const anchors = buildAnchors(BOXES);
  it("interpolates inside a chapter", () => {
    expect(progressAt(450, anchors)).toBeCloseTo(0.07, 6);
    expect(progressAt(3900, anchors)).toBeCloseTo(0.413, 6);
    expect(progressAt(5925, anchors)).toBeCloseTo(0.695, 6);
  });
  it("interpolates the ring → stats gap across the section boundary", () => {
    expect(progressAt(5250, anchors)).toBeCloseTo(0.573, 6);
  });
  it("clamps before the first and after the last anchor", () => {
    expect(progressAt(-50, anchors)).toBe(0);
    expect(progressAt(9100, anchors)).toBe(1);
    expect(progressAt(99999, anchors)).toBe(1);
  });
  it("jumps across zero-length segments", () => {
    const degenerate = [
      { y: 0, p: 0 },
      { y: 100, p: 0.2 },
      { y: 100, p: 0.3 },
      { y: 200, p: 0.5 },
    ];
    expect(progressAt(99.999, degenerate)).toBeCloseTo(0.2, 3);
    expect(progressAt(100, degenerate)).toBeCloseTo(0.3, 6);
    expect(progressAt(150, degenerate)).toBeCloseTo(0.4, 6);
  });
  it("returns 0 without anchors (chapters not measured yet)", () => {
    expect(progressAt(500, [])).toBe(0);
  });
});

describe("scrollForProgress", () => {
  const anchors = buildAnchors(BOXES);
  it("inverts progressAt", () => {
    for (const p of [0, 0.07, 0.2, 0.27, 0.413, 0.573, 0.7, 0.906, 0.95, 1]) {
      expect(progressAt(scrollForProgress(p, anchors), anchors)).toBeCloseTo(p, 6);
    }
  });
});
