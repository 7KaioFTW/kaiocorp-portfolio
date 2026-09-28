import { describe, expect, it } from "vitest";
import { clamp, damp, easeOutCubic, lerp, sstep } from "./math";

describe("math helpers", () => {
  it("clamp defaults to [0, 1]", () => {
    expect(clamp(-2)).toBe(0);
    expect(clamp(3)).toBe(1);
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("lerp interpolates", () => {
    expect(lerp(2, 4, 0.25)).toBe(2.5);
  });
  it("sstep works with reversed edges (the prototype calls sstep(0.72, 0.4, x))", () => {
    expect(sstep(0.72, 0.4, 0.8)).toBe(0);
    expect(sstep(0.72, 0.4, 0.3)).toBe(1);
    expect(sstep(0.72, 0.4, 0.56)).toBeCloseTo(0.5, 6);
  });
  it("easeOutCubic clamps its input", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 6);
  });
  it("damp is frame-rate independent", () => {
    const oneStep = damp(0, 1, 4.2, 1 / 60);
    const twoSteps = damp(damp(0, 1, 4.2, 1 / 120), 1, 4.2, 1 / 120);
    expect(oneStep).toBeCloseTo(twoSteps, 10);
    expect(damp(0, 1, 4.2, 10)).toBeCloseTo(1, 6);
  });
});
