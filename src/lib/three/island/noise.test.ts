import { describe, expect, it } from "vitest";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { fbm, fogUniforms } from "./noise";
import { mulberry32 } from "./rng";

describe("fbm", () => {
  it("is deterministic for a seeded SimplexNoise and stays within (-1, 1)", () => {
    const a = fbm(new SimplexNoise({ random: mulberry32(3) }), 0.3, 0.7);
    const b = fbm(new SimplexNoise({ random: mulberry32(3) }), 0.3, 0.7);
    expect(a).toBe(b);
    expect(Math.abs(a)).toBeLessThan(1);
  });
});

describe("fogUniforms", () => {
  it("clones the fog uniforms per call and keeps extras by reference", () => {
    const uTime = { value: 0 };
    const u1 = fogUniforms({ uTime });
    const u2 = fogUniforms({ uTime });
    expect(Object.keys(u1)).toEqual(expect.arrayContaining(["fogColor", "fogDensity", "fogNear", "fogFar", "uTime"]));
    expect(u1.fogColor).not.toBe(u2.fogColor);
    expect(u1.uTime).toBe(uTime);
  });
});
