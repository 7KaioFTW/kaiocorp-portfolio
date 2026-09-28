// src/lib/three/island/cameraPath.ts
import * as THREE from "three";
import { RING_RADIUS } from "./chapters";
import { clamp, DEG, lerp } from "./math";

// Camera journey (prototype lines 1320–1364): keyframes → centripetal Catmull-Rom splines for the
// position and the look target; fov / lens shift / roll / portrait pull-back are eased per segment.

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export interface CameraKey {
  readonly p: number;
  readonly pos: Vec3;
  readonly look: Vec3;
  readonly fov: number;
  /** Projection shift (landscape). */
  readonly shift: Vec2;
  /** Projection shift (portrait). */
  readonly mshift: Vec2;
  readonly roll: number;
  /** How much the portrait pull-back applies (1 = full). */
  readonly md: number;
}

function buildKeys(): CameraKey[] {
  const keys: CameraKey[] = [];
  const K = (p: number, pos: Vec3, look: Vec3, fov = 45, shift: Vec2 = [0, 0], mshift: Vec2 = [0, 0], roll = 0, md = 1) =>
    keys.push({ p, pos, look, fov, shift, mshift, roll, md });
  K(0.0, [0, 6.5, 52], [0, -2.8, 0], 36, [0.3, 0.03], [0, -0.26]);
  K(0.07, [-3.2, 5.6, 45.5], [0, -3.0, 0], 36, [0.3, 0.03], [0, -0.26], 0.0);
  K(0.14, [27, 2.0, 25], [0, -4.0, 0], 40, [0.05, 0], [0, -0.05], -0.05);
  K(0.195, [21, -9.5, 9], [0, -11, 0], 46, [0, 0], [0, 0], -0.03);
  K(0.237, [12, -23, 4.5], [3, -39, 9], 52, [0, 0], [0, 0], 0.03);
  for (let k = 0; k <= 11; k++) {
    const t = k / 11;
    const th = lerp(30, 300, t) * DEG;
    const la = th + 38 * DEG;
    const r = 4.6 + Math.sin(t * Math.PI * 2) * 0.6;
    const y = -39.4 + Math.sin(t * Math.PI * 3) * 0.45 + (k === 0 ? 1.8 : 0);
    K(
      lerp(0.272, 0.548, t),
      [Math.cos(th) * r, y, Math.sin(th) * r],
      [Math.cos(la) * RING_RADIUS, -40.5, Math.sin(la) * RING_RADIUS],
      55,
      [0, 0.07],
      [0, -0.1],
      Math.sin(t * Math.PI * 2) * 0.035,
      0.15,
    );
  }
  K(0.592, [-2.5, -45.5, -17.5], [0, -45, -52], 46);
  K(0.64, [-3.6, -41.6, -20], [0, -45.2, -52], 40, [0, 0.0], [0, -0.1]);
  K(0.71, [0, -41.3, -21.5], [0, -45.3, -52], 40, [0, 0.0], [0, -0.1]);
  K(0.78, [3.6, -41.0, -23], [0, -45.3, -52], 40, [0, 0.0], [0, -0.1]);
  K(0.83, [1.5, -32, -36], [0, -14, -64], 50);
  K(0.866, [0, -22, -42], [0, 4, -74], 52);
  K(0.906, [0, 3, -50], [0, 19, -86], 48);
  K(0.952, [0, 14, -56.5], [0, 21.6, -86], 45);
  K(1.0, [0, 17.6, -58.5], [0, 22, -86], 44);
  return keys;
}

export const CAMERA_KEYS: readonly CameraKey[] = buildKeys();

/** Segment [keys[i], keys[i+1]] containing p, local l ∈ [0,1], and spline parameter t = (i + l)/(n − 1). */
export interface Segment {
  i: number;
  l: number;
  t: number;
}

export function segmentAt(p: number, keys: readonly CameraKey[] = CAMERA_KEYS): Segment {
  const n = keys.length;
  const q = clamp(p);
  let i = 0;
  while (i < n - 2 && keys[i + 1].p <= q) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const l = clamp((q - a.p) / (b.p - a.p));
  return { i, l, t: (i + l) / (n - 1) };
}

export interface CameraScalars {
  fov: number;
  sx: number;
  sy: number;
  roll: number;
  md: number;
}

export function sampleScalars(p: number, portrait: boolean, keys: readonly CameraKey[] = CAMERA_KEYS, out: CameraScalars = { fov: 0, sx: 0, sy: 0, roll: 0, md: 1 }): CameraScalars {
  const { i, l } = segmentAt(p, keys);
  const a = keys[i];
  const b = keys[i + 1];
  const e = l * l * (3 - 2 * l);
  const sa = portrait ? a.mshift : a.shift;
  const sb = portrait ? b.mshift : b.shift;
  out.fov = lerp(a.fov, b.fov, e);
  out.sx = lerp(sa[0], sb[0], e);
  out.sy = lerp(sa[1], sb[1], e);
  out.roll = lerp(a.roll, b.roll, e);
  out.md = lerp(a.md, b.md, e);
  return out;
}

export interface CameraSample extends CameraScalars {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

export interface CameraRig {
  sample(p: number, portrait: boolean, out: CameraSample): CameraSample;
}

export function createCameraRig(keys: readonly CameraKey[] = CAMERA_KEYS): CameraRig {
  const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal");
  return {
    sample(p, portrait, out) {
      const { t } = segmentAt(p, keys);
      posCurve.getPoint(t, out.pos);
      lookCurve.getPoint(t, out.look);
      sampleScalars(p, portrait, keys, out);
      return out;
    },
  };
}
