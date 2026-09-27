import { describe, expect, it } from "vitest";
import { FRAGMENT_SHADER, shaderTime } from "./shader";

describe("shaderTime", () => {
  it("converts ms to seconds", () => {
    expect(shaderTime(1500)).toBeCloseTo(1.5);
  });
  it("wraps every hour so float precision never degrades on long sessions", () => {
    expect(shaderTime(3_600_500)).toBeCloseTo(0.5);
    expect(shaderTime(10 * 3_600_000 + 250)).toBeCloseTo(0.25);
  });
});

describe("FRAGMENT_SHADER", () => {
  it("uses highp when the GPU supports it (mediump fallback)", () => {
    expect(FRAGMENT_SHADER).toContain("#ifdef GL_FRAGMENT_PRECISION_HIGH");
    expect(FRAGMENT_SHADER).toContain("precision highp float;");
    expect(FRAGMENT_SHADER).toContain("precision mediump float;");
  });
});
