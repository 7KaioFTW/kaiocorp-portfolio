import { describe, expect, it } from "vitest";
import { shouldAnimate, tiltAngles } from "./geometry";

const VH = 800;

describe("shouldAnimate", () => {
  it("never hides elements above the viewport", () => {
    expect(shouldAnimate({ top: -400, bottom: -10 }, VH, false)).toBe(false);
    expect(shouldAnimate({ top: -400, bottom: -10 }, VH, true)).toBe(false);
  });
  it("leaves in-view elements alone on first load", () => {
    expect(shouldAnimate({ top: 100, bottom: 300 }, VH, false)).toBe(false);
    expect(shouldAnimate({ top: 700, bottom: 900 }, VH, false)).toBe(false);
  });
  it("animates in-view elements after a navigation", () => {
    expect(shouldAnimate({ top: 100, bottom: 300 }, VH, true)).toBe(true);
  });
  it("animates below-the-fold elements in both modes", () => {
    expect(shouldAnimate({ top: 800, bottom: 1000 }, VH, false)).toBe(true);
    expect(shouldAnimate({ top: 1200, bottom: 1400 }, VH, true)).toBe(true);
  });
  it("ignores zero-size (display:none) elements", () => {
    expect(shouldAnimate({ top: 0, bottom: 0 }, VH, true)).toBe(false);
  });
});

describe("tiltAngles", () => {
  it("is flat at the centre", () => {
    const a = tiltAngles(0.5, 0.5);
    expect(a.rotationX).toBeCloseTo(0);
    expect(a.rotationY).toBeCloseTo(0);
  });
  it("reaches ±max at the corners", () => {
    expect(tiltAngles(0, 0)).toEqual({ rotationX: 8, rotationY: -8 });
    expect(tiltAngles(1, 1, 10)).toEqual({ rotationX: -10, rotationY: 10 });
  });
  it("clamps pointer positions outside the element", () => {
    expect(tiltAngles(2, -1)).toEqual(tiltAngles(1, 0));
  });
});
