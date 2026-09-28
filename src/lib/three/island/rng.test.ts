import { describe, expect, it } from "vitest";
import { WORLD_SEED, hashName, mulberry32, rngFor } from "./rng";

describe("mulberry32", () => {
  it("reproduces the prototype's sequence for its seed", () => {
    const r = mulberry32(WORLD_SEED);
    expect(r()).toBeCloseTo(0.5817536343820393, 15);
    expect(r()).toBeCloseTo(0.3177114331629127, 15);
    expect(r()).toBeCloseTo(0.3009456454310566, 15);
  });
});

describe("hashName", () => {
  it("is 32-bit FNV-1a", () => {
    expect(hashName("")).toBe(2166136261);
    expect(hashName("a")).toBe(3826002220);
    expect(hashName("vegetation")).toBe(803490637);
  });
});

describe("rngFor", () => {
  it("is deterministic per module name", () => {
    const a = rngFor("vegetation");
    const b = rngFor("vegetation");
    const seqA = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(seqA);
    expect(seqA[0]).toBeCloseTo(0.22288738936185837, 15);
  });
  it("gives each module its own stream", () => {
    expect(rngFor("clouds").next()).toBeCloseTo(0.7726212288253009, 15);
    expect(rngFor("clouds").next()).not.toBe(rngFor("vegetation").next());
  });
  it("is unaffected by how much another module consumed", () => {
    const untouched = rngFor("clouds").next();
    const other = rngFor("vegetation");
    for (let i = 0; i < 1000; i++) other.next();
    expect(rngFor("clouds").next()).toBe(untouched);
  });
  it("range() stays within [min, max)", () => {
    const r = rngFor("range-test");
    for (let i = 0; i < 1000; i++) {
      const v = r.range(-2, 3);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThan(3);
    }
  });
});
