// src/lib/three/island/terrain.ts
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { withRim } from "./lights";
import { clamp, sstep } from "./math";
import { fbm } from "./noise";
import { mulberry32 } from "./rng";
import type { SceneContext, Unit } from "./types";

// Procedural floating-island generator + the main island (prototype lines 414–517).

export const WATERFALL_PHI = 0.95;

export type TopFn = (x: number, z: number, rn: number, nz: SimplexNoise) => number;

export interface IslandParams {
  radius?: number;
  depth?: number;
  detail?: number;
  seed?: number;
  outline?: number;
  top: TopFn;
  sandFn?: ((x: number, z: number) => number) | null;
}

export interface IslandShape {
  geometry: THREE.BufferGeometry;
  /** Outline radius at polar angle phi. */
  Rof(phi: number): number;
  /** Top-surface height at (x, z). */
  topAt(x: number, z: number): number;
  nz: SimplexNoise;
}

const col = (hex: string) => new THREE.Color(hex);
const PAL = {
  grass: ["#3fae5e", "#5cc46b", "#86d66a", "#2f9a62", "#39b08a"].map(col),
  lip: col("#2a7d4f"),
  soil: col("#7a4a34"),
  sand: col("#ecd08f"),
  rockA: col("#9a7263"),
  rockB: col("#76597a"),
  rockC: col("#4d3b6c"),
  rockD: col("#2a1f45"),
};

/** Distance from (x, z) to the segment a→b. */
export function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax;
  const vz = bz - az;
  const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
  return Math.hypot(x - (ax + vx * t), z - (az + vz * t));
}

/** Vertices per step of a chunked build (a multiple of 3, so both loops break on face boundaries). */
const CHUNK = 8190;

/**
 * Island mesh with flat-shaded vertex colours (prototype 422–490; logic unchanged), as resumable steps:
 * it yields after the base mesh, every CHUNK vertices of the position and colour loops, and after the
 * normals (F1: the detail-30 main island was one ~100 ms task). The work and its order are the same
 * whether the steps are drained at once or spread over tasks, so the output is byte-identical.
 */
function* islandSteps({ radius = 11, depth = 10, detail = 24, seed = 1, outline = 0.14, top, sandFn = null }: IslandParams): Generator<void, IslandShape, void> {
  const nz = new SimplexNoise({ random: mulberry32(seed * 977 + 13) });
  const Rof = (phi: number) =>
    radius * (1 + outline * nz.noise(Math.cos(phi) * 1.2 + seed, Math.sin(phi) * 1.2) + outline * 0.4 * nz.noise(Math.cos(phi) * 3.1 + 7, Math.sin(phi) * 3.1 - seed));
  const topAt = (x: number, z: number) => {
    const phi = Math.atan2(z, x);
    const rn = Math.min(1, Math.hypot(x, z) / Rof(phi));
    return top(x, z, rn, nz);
  };
  const g = new THREE.IcosahedronGeometry(1, detail);
  yield;
  const pos = g.attributes.position;
  const n = pos.count;
  const isTop = new Uint8Array(n);
  const fArr = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (i > 0 && i % CHUNK === 0) yield;
    v.fromBufferAttribute(pos, i).normalize();
    const phi = Math.atan2(v.z, v.x);
    const Rp = Rof(phi);
    let x: number;
    let y: number;
    let z: number;
    if (v.y >= -1e-5) {
      const rn = Math.min(1, Math.acos(clamp(v.y, -1, 1)) / (Math.PI / 2));
      const rr = Rp * rn;
      x = Math.cos(phi) * rr;
      z = Math.sin(phi) * rr;
      y = top(x, z, rn, nz);
      isTop[i] = 1;
    } else {
      const s = Math.min(1, Math.acos(clamp(-v.y, -1, 1)) / (Math.PI / 2));
      const f = 1 - s;
      fArr[i] = f;
      const rimY = top(Math.cos(phi) * Rp, Math.sin(phi) * Rp, 1, nz);
      const dpt = depth * (1 + 0.22 * nz.noise(Math.cos(phi) * 1.4 + 11, Math.sin(phi) * 1.4 + 11));
      y = rimY - dpt * Math.pow(f, 1.12) - 0.25 * f;
      let rr = Rp * Math.pow(Math.max(0, 1 - Math.pow(f, 1.7)), 0.82);
      const k = sstep(0.0, 0.07, f);
      rr *=
        1 +
        k *
          (0.065 * Math.sin(y * 2.2 + 2.0 * nz.noise(Math.cos(phi) * 2, Math.sin(phi) * 2)) +
            0.14 * nz.noise(Math.cos(phi) * 2.3 + y * 0.13, Math.sin(phi) * 2.3 - y * 0.17));
      rr *= 1 + 0.05 * Math.exp(-f * f * 900);
      x = Math.cos(phi) * rr;
      z = Math.sin(phi) * rr;
    }
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  yield;
  const nrm = g.attributes.normal;
  const colors = new Float32Array(n * 3);
  const c = new THREE.Color();
  const hashF = (a: number, b: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0; i < n; i += 3) {
    if (i > 0 && i % CHUNK === 0) yield;
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const ny = nrm.getY(i);
    const topFace = isTop[i] && isTop[i + 1] && isTop[i + 2];
    const jit = hashF(cx, cz + cy);
    if (topFace) {
      const gn = clamp(0.5 + 0.9 * fbm(nz, cx * 0.13 + 40, cz * 0.13, 3));
      const idx = gn * (PAL.grass.length - 1);
      c.copy(PAL.grass[Math.floor(idx)]).lerp(PAL.grass[Math.min(PAL.grass.length - 1, Math.floor(idx) + 1)], idx % 1);
      if (ny < 0.72) c.lerp(PAL.lip, sstep(0.72, 0.4, ny) * 0.7);
      const phi = Math.atan2(cz, cx);
      const rn = Math.hypot(cx, cz) / Rof(phi);
      if (rn > 0.9 && ny < 0.55) c.lerp(PAL.soil, 0.45);
      if (sandFn) {
        const sd = sandFn(cx, cz);
        if (sd > 0) c.lerp(PAL.sand, sd);
      }
    } else {
      const f = (fArr[i] + fArr[i + 1] + fArr[i + 2]) / 3;
      if (f < 0.03) c.copy(PAL.lip);
      else if (f < 0.1) c.copy(PAL.soil).lerp(PAL.rockA, sstep(0.05, 0.1, f));
      else {
        const t = sstep(0.1, 0.95, f);
        if (t < 0.33) c.copy(PAL.rockA).lerp(PAL.rockB, t / 0.33);
        else if (t < 0.7) c.copy(PAL.rockB).lerp(PAL.rockC, (t - 0.33) / 0.37);
        else c.copy(PAL.rockC).lerp(PAL.rockD, (t - 0.7) / 0.3);
        const band = Math.sin(cy * 1.7 + 2.5 * nz.noise(cx * 0.2, cz * 0.2));
        if (band > 0.55) c.multiplyScalar(1.18);
        else if (band < -0.7) c.multiplyScalar(0.85);
      }
    }
    c.multiplyScalar(0.93 + jit * 0.14);
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = c.r;
      colors[(i + k) * 3 + 1] = c.g;
      colors[(i + k) * 3 + 2] = c.b;
    }
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { geometry: g, Rof, topAt, nz };
}

/** The island in one go (small islands: satellites, pillar rocks, the outline probe). */
export function makeIsland(params: IslandParams): IslandShape {
  const steps = islandSteps(params);
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

/** The island in short tasks: `pause` (e.g. a yield to the main thread) runs between steps. */
async function makeIslandChunked(params: IslandParams, pause: () => Promise<void>): Promise<IslandShape> {
  const steps = islandSteps(params);
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
    await pause();
  }
}

export interface MainIsland extends Unit {
  group: THREE.Group;
  shape: IslandShape;
  /** Shared flat-shaded vertex-colour material (satellites and pillar rocks reuse it). */
  material: THREE.MeshStandardMaterial;
  pond: { x: number; z: number };
  waterfall: { x: number; z: number };
  /** y of the glowing core under the island (prototype 777–778). */
  coreY: number;
}

/** The main island; with `pause`, its detail-30 mesh is generated in short tasks (same bytes, F1). */
export async function createMainIsland({ scene }: SceneContext, pause?: () => Promise<void>): Promise<MainIsland> {
  const material = withRim(
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.0 }),
    new THREE.Color(0.28, 0.45, 1.0),
    3.2,
    0.28,
  );
  // Pond / waterfall anchors from a low-detail probe of the outline (prototype 510–511).
  const probe = makeIsland({ radius: 11, depth: 10.5, detail: 2, seed: 3, top: () => 0 });
  const rw = probe.Rof(WATERFALL_PHI) * 0.995;
  probe.geometry.dispose();
  const waterfall = { x: Math.cos(WATERFALL_PHI) * rw, z: Math.sin(WATERFALL_PHI) * rw };
  const pond = { x: waterfall.x * 0.52, z: waterfall.z * 0.52 };
  const mainTop: TopFn = (x, z, rn, nz) => {
    let y = 0.7 + 0.9 * fbm(nz, x * 0.085, z * 0.085, 3) + 0.22 * nz.noise(x * 0.42, z * 0.42);
    y += 3.6 * Math.exp(-((x + 4.4) ** 2 + (z + 3.6) ** 2) / 19);
    y += 1.4 * Math.exp(-((x + 1.2) ** 2 + (z - 6.0) ** 2) / 7);
    const dp = Math.hypot(x - pond.x, z - pond.z);
    y -= 1.55 * Math.exp(-(dp * dp) / 4.6);
    const ds = segDist(x, z, pond.x, pond.z, waterfall.x, waterfall.z);
    y -= 0.95 * Math.exp(-(ds * ds) / 0.9) * sstep(1.2, 2.6, dp);
    y -= 2.3 * Math.pow(sstep(0.7, 1.0, rn), 1.6);
    return y;
  };
  const params: IslandParams = {
    radius: 11,
    depth: 10.5,
    detail: 30,
    seed: 3,
    top: mainTop,
    sandFn: (x, z) => {
      const dp = Math.hypot(x - pond.x, z - pond.z);
      return sstep(2.9, 2.1, dp) * sstep(1.2, 1.8, dp) * 0.8;
    },
  };
  const shape = pause ? await makeIslandChunked(params, pause) : makeIsland(params);
  const group = new THREE.Group();
  group.add(new THREE.Mesh(shape.geometry, material));
  scene.add(group);
  shape.geometry.computeBoundingBox();
  const coreY = (shape.geometry.boundingBox?.min.y ?? -10) - 0.4;

  return {
    group,
    shape,
    material,
    pond,
    waterfall,
    coreY,
    // Chapter culling + idle bob (prototype 1564, 1571)
    update(frame, vis) {
      group.visible = vis.island;
      if (vis.island) group.position.y = Math.sin(frame.t * 0.45) * 0.18 * frame.bob;
    },
  };
}
