// src/lib/three/island/cameraPath.test.ts
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, createCameraRig, sampleScalars, segmentAt, type CameraSample } from "./cameraPath";

const fresh = (): CameraSample => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, sx: 0, sy: 0, roll: 0, md: 1 });

describe("CAMERA_KEYS (prototype 1325–1344)", () => {
  it("has 5 approach + 12 ring + 9 finale keys with strictly increasing p from 0 to 1", () => {
    expect(CAMERA_KEYS).toHaveLength(26);
    expect(CAMERA_KEYS[0].p).toBe(0);
    expect(CAMERA_KEYS[CAMERA_KEYS.length - 1].p).toBe(1);
    for (let i = 1; i < CAMERA_KEYS.length; i++) expect(CAMERA_KEYS[i].p).toBeGreaterThan(CAMERA_KEYS[i - 1].p);
  });
  it("starts and ends on the prototype's keys", () => {
    expect(CAMERA_KEYS[0]).toMatchObject({ pos: [0, 6.5, 52], look: [0, -2.8, 0], fov: 36, shift: [0.3, 0.03], mshift: [0, -0.26] });
    expect(CAMERA_KEYS[25]).toMatchObject({ p: 1, pos: [0, 17.6, -58.5], look: [0, 22, -86], fov: 44 });
  });
  it("generates the ring keys like the prototype loop", () => {
    const first = CAMERA_KEYS[5];
    expect(first.p).toBeCloseTo(0.272, 12);
    expect(first.pos[0]).toBeCloseTo(3.983716857408418, 10);
    expect(first.pos[1]).toBeCloseTo(-37.6, 10);
    expect(first.pos[2]).toBeCloseTo(2.3, 10);
    expect(first.look[0]).toBeCloseTo(6.368312088070507, 10);
    expect(first.look[2]).toBeCloseTo(15.762125527635384, 10);
    expect(first).toMatchObject({ fov: 55, shift: [0, 0.07], mshift: [0, -0.1], md: 0.15 });
    const last = CAMERA_KEYS[16];
    expect(last.p).toBeCloseTo(0.548, 12);
    expect(last.pos[0]).toBeCloseTo(2.3, 10);
    expect(last.pos[1]).toBeCloseTo(-39.4, 10);
    expect(last.pos[2]).toBeCloseTo(-3.9837168574084174, 10);
  });
});

describe("segmentAt", () => {
  it("maps the endpoints to t = 0 and t = 1", () => {
    expect(segmentAt(0)).toEqual({ i: 0, l: 0, t: 0 });
    expect(segmentAt(1)).toEqual({ i: 24, l: 1, t: 1 });
  });
  it("maps key k to spline parameter k / (n − 1)", () => {
    CAMERA_KEYS.forEach((key, k) => expect(segmentAt(key.p).t).toBeCloseTo(k / 25, 12));
  });
  it("clamps p outside [0, 1]", () => {
    expect(segmentAt(-0.5)).toEqual(segmentAt(0));
    expect(segmentAt(1.5)).toEqual(segmentAt(1));
  });
});

describe("createCameraRig", () => {
  const rig = createCameraRig();
  it("passes exactly through every keyframe (endpoints = prototype keys)", () => {
    for (const key of CAMERA_KEYS) {
      const s = rig.sample(key.p, false, fresh());
      expect(s.pos.distanceTo(new THREE.Vector3(...key.pos))).toBeLessThan(1e-6);
      expect(s.look.distanceTo(new THREE.Vector3(...key.look))).toBeLessThan(1e-6);
      expect(s.fov).toBeCloseTo(key.fov, 9);
    }
  });
  it("is continuous across every key (no jumps in position, look or fov)", () => {
    for (const key of CAMERA_KEYS.slice(1, -1)) {
      const before = rig.sample(key.p - 1e-5, false, fresh());
      const after = rig.sample(key.p + 1e-5, false, fresh());
      expect(before.pos.distanceTo(after.pos)).toBeLessThan(0.05);
      expect(before.look.distanceTo(after.look)).toBeLessThan(0.05);
      expect(Math.abs(before.fov - after.fov)).toBeLessThan(0.01);
    }
  });
  it("uses the portrait shift in portrait", () => {
    expect(sampleScalars(0, true)).toMatchObject({ sx: 0, sy: -0.26 });
    expect(sampleScalars(0, false)).toMatchObject({ sx: 0.3, sy: 0.03 });
  });
});
