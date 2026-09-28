// src/lib/three/island/vegetation.ts
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { blobGeometry, composeMatrix } from "./geometry";
import { withRim } from "./lights";
import { rngFor } from "./rng";
import { segDist, type MainIsland } from "./terrain";
import type { SceneContext } from "./types";

// Trees, flowers, boulders on the main island (prototype lines 628–694).

const col = (hex: string) => new THREE.Color(hex);
const LEAF_COLORS = ["#2fa56a", "#3fbf74", "#1f8f63", "#ff79b4", "#ff9fcf", "#c98bff"].map(col);
const PINE_COLORS = ["#1f8a66", "#2a9d74", "#17775c"].map(col);
const FLOWER_COLORS = ["#ffd1ea", "#ff8cc6", "#fff4c2", "#b8f3ff"].map(col);
const FLOWERS = 170;

interface TreeSpot {
  x: number;
  z: number;
  y: number;
  kind: "pine" | "round";
}

export function createVegetation(_ctx: SceneContext, island: MainIsland): void {
  const rng = rngFor("vegetation");
  const R = rng.range;
  const { pond, waterfall, shape, group } = island;
  const avoidWater = (x: number, z: number) => Math.hypot(x - pond.x, z - pond.z) > 3.4 && segDist(x, z, pond.x, pond.z, waterfall.x, waterfall.z) > 1.7;

  const spots: TreeSpot[] = [];
  for (let tries = 0; spots.length < 19 && tries < 600; tries++) {
    const a = R(0, Math.PI * 2);
    const r = Math.sqrt(R(0.02, 1)) * 8.6;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!avoidWater(x, z)) continue;
    if (spots.some((t) => Math.hypot(t.x - x, t.z - z) < 2.1)) continue;
    spots.push({ x, z, y: shape.topAt(x, z), kind: rng.next() < 0.42 ? "pine" : "round" });
  }

  const foliage = withRim(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8, metalness: 0 }), new THREE.Color(0.45, 0.4, 1.0), 2.6, 0.5);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5e3d34, flatShading: true, roughness: 0.9 });
  const trunkGeometry = new THREE.CylinderGeometry(0.13, 0.24, 1, 5).translate(0, 0.5, 0);
  const canopyGeometry = blobGeometry(1, 0.22, 11);
  const coneParts = [0, 1, 2].map((k) => new THREE.ConeGeometry(1 - k * 0.24, 1.25, 7).translate(0, 0.55 + k * 0.72, 0));
  const pineGeometry = mergeGeometries(coneParts.map((g) => g.toNonIndexed()));
  coneParts.forEach((g) => g.dispose());
  pineGeometry.computeVertexNormals();

  const rounds = spots.filter((t) => t.kind === "round");
  const pines = spots.filter((t) => t.kind === "pine");
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, spots.length);
  const canopies = new THREE.InstancedMesh(canopyGeometry, foliage, rounds.length * 3);
  const pineMesh = new THREE.InstancedMesh(pineGeometry, foliage, pines.length);
  const leaf = new THREE.Color();
  let ti = 0;
  let ci = 0;
  for (const t of rounds) {
    const h = R(0.9, 1.35);
    trunks.setMatrixAt(ti++, composeMatrix(t.x, t.y - 0.2, t.z, R(-0.08, 0.08), 0, R(-0.08, 0.08), 1, h, 1));
    const lc = LEAF_COLORS[Math.floor(R(0, LEAF_COLORS.length))];
    const s = R(0.72, 1.0);
    const blobs: [number, number, number, number][] = [
      [0, h + s * 0.55, 0, s],
      [s * 0.62, h + s * 0.2, R(-0.4, 0.4), s * 0.68],
      [-s * 0.55, h + s * 0.3, R(-0.4, 0.4), s * 0.62],
    ];
    blobs.forEach(([ox, oy, oz, ss], k) => {
      canopies.setMatrixAt(ci, composeMatrix(t.x + ox, t.y - 0.2 + oy, t.z + oz, R(0, 6), R(0, 6), R(0, 6), ss, ss * 0.88, ss));
      canopies.setColorAt(ci++, leaf.copy(lc).multiplyScalar(k ? 0.9 : 1.0));
    });
  }
  pines.forEach((t, k) => {
    const s = R(0.66, 0.92);
    trunks.setMatrixAt(ti++, composeMatrix(t.x, t.y - 0.2, t.z, 0, 0, 0, 0.6, 0.7, 0.6));
    pineMesh.setMatrixAt(k, composeMatrix(t.x, t.y + 0.3, t.z, 0, R(0, 6), 0, s * 1.05, s * 1.45, s * 1.05));
    pineMesh.setColorAt(k, PINE_COLORS[k % PINE_COLORS.length]);
  });
  group.add(trunks, canopies, pineMesh);

  // Flowers — placement loop BOUNDED (the prototype's `while (k < 170)` could spin forever).
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.6, emissive: 0x220a22 }), FLOWERS);
  let placed = 0;
  for (let tries = 0; placed < FLOWERS && tries < FLOWERS * 20; tries++) {
    const a = R(0, Math.PI * 2);
    const r = Math.sqrt(R(0, 1)) * 9.2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!avoidWater(x, z)) continue;
    flowers.setMatrixAt(placed, composeMatrix(x, shape.topAt(x, z) + 0.05, z, 0, 0, 0, R(0.6, 1.2)));
    flowers.setColorAt(placed, FLOWER_COLORS[(placed + 1) % FLOWER_COLORS.length]);
    placed++;
  }
  flowers.count = placed;
  group.add(flowers);

  const boulders = new THREE.InstancedMesh(blobGeometry(0, 0.25, 21), withRim(new THREE.MeshStandardMaterial({ color: 0x8b7a9e, flatShading: true, roughness: 0.9 })), 9);
  for (let i = 0; i < 9; i++) {
    const a = R(0, Math.PI * 2);
    const r = R(3, 9.5);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = R(0.35, 0.9);
    boulders.setMatrixAt(i, composeMatrix(x, shape.topAt(x, z) + s * 0.2, z, R(0, 3), R(0, 3), R(0, 3), s, s * 0.7, s));
  }
  group.add(boulders);
}
