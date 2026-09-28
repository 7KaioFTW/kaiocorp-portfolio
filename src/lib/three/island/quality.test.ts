import { describe, expect, it } from "vitest";
import { decidePerf, readSignals, selectTier, settingsFor, stepDown, type DeviceSignals, type Preference, type Tier } from "./quality";

const DESKTOP: DeviceSignals = { webgl2: true, reducedMotion: false, saveData: false, deviceMemory: 8, coarsePointer: false, devicePixelRatio: 2 };

describe("selectTier (spec §4 table + §6 toggle)", () => {
  const cases: [string, Partial<DeviceSignals>, Preference, Tier][] = [
    ["desktop, 8 GB", {}, "auto", "high"],
    ["desktop, deviceMemory unknown", { deviceMemory: undefined }, "auto", "high"],
    ["desktop, 4 GB", { deviceMemory: 4 }, "auto", "medium"],
    ["touch / coarse pointer", { coarsePointer: true }, "auto", "medium"],
    ["no WebGL2", { webgl2: false }, "auto", "off"],
    ["no WebGL2 even when opted in", { webgl2: false }, "on", "off"],
    ["saveData", { saveData: true }, "auto", "off"],
    ["2 GB", { deviceMemory: 2 }, "auto", "off"],
    ["reduced motion", { reducedMotion: true }, "auto", "off"],
    ["reduced motion + opt-in", { reducedMotion: true }, "on", "high"],
    ["reduced motion + opt-in on a phone", { reducedMotion: true, coarsePointer: true }, "on", "medium"],
    ["opt-in on a 2 GB device", { deviceMemory: 2 }, "on", "medium"],
    ["opt-in with saveData", { saveData: true }, "on", "medium"],
    ["opted out", {}, "off", "off"],
  ];
  it.each(cases)("%s", (_label, overrides, pref, expected) => {
    expect(selectTier({ ...DESKTOP, ...overrides }, pref)).toBe(expected);
  });
});

describe("settingsFor", () => {
  it("high = prototype settings, DPR capped at 1.5 (MSAA 2 above DPR 1)", () => {
    expect(settingsFor("high", 2)).toEqual({ tier: "high", dpr: 1.5, msaa: 2, cloudDetail: 5, cloudCountScale: 1, particleScale: 1, bloomScale: 1 });
  });
  it("high on a 1× screen uses MSAA 4 (prototype: samples DPR > 1 ? 2 : 4)", () => {
    expect(settingsFor("high", 1)).toMatchObject({ dpr: 1, msaa: 4 });
  });
  it("medium: DPR 1, clouds detail 3 and −40 %, particles −50 %, half-res bloom, MSAA 2", () => {
    expect(settingsFor("medium", 3)).toEqual({ tier: "medium", dpr: 1, msaa: 2, cloudDetail: 3, cloudCountScale: 0.6, particleScale: 0.5, bloomScale: 0.5 });
  });
});

describe("stepDown", () => {
  it("walks DPR 1.5 → 1 → 0.85, keeps MSAA ≤ 2, then turns MSAA off", () => {
    expect(stepDown({ dpr: 1.5, msaa: 2 })).toEqual({ dpr: 1, msaa: 2 });
    expect(stepDown({ dpr: 1, msaa: 4 })).toEqual({ dpr: 0.85, msaa: 2 });
    expect(stepDown({ dpr: 0.85, msaa: 2 })).toEqual({ dpr: 0.85, msaa: 0 });
    expect(stepDown({ dpr: 0.85, msaa: 0 })).toBeNull();
  });
});

describe("decidePerf", () => {
  it("keeps the scale at ≥ 45 fps", () => {
    expect(decidePerf(45, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "keep" });
    expect(decidePerf(60, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "keep" });
  });
  it("steps one rung between 20 and 45 fps", () => {
    expect(decidePerf(44, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "step", next: { dpr: 1, msaa: 2 } });
  });
  it("stays at the floor between 20 and 45 fps", () => {
    expect(decidePerf(30, { dpr: 0.85, msaa: 0 })).toEqual({ kind: "keep" });
  });
  it("jumps straight to the floor below 20 fps (no longer masked by the dt clamp)", () => {
    expect(decidePerf(12, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "step", next: { dpr: 0.85, msaa: 0 } });
  });
  it("gives up below 20 fps at the floor", () => {
    expect(decidePerf(12, { dpr: 0.85, msaa: 0 })).toEqual({ kind: "giveUp" });
  });
});

describe("readSignals", () => {
  it("reads media queries, deviceMemory, saveData and DPR defensively", () => {
    const win = {
      matchMedia: (q: string) => ({ matches: q === "(pointer: coarse)" }),
      navigator: { deviceMemory: 4, connection: { saveData: true } },
      devicePixelRatio: 0,
    };
    expect(readSignals(win)).toEqual({ reducedMotion: false, saveData: true, deviceMemory: 4, coarsePointer: true, devicePixelRatio: 1 });
    expect(readSignals({ ...win, navigator: {} })).toMatchObject({ saveData: false, deviceMemory: undefined });
  });
});
