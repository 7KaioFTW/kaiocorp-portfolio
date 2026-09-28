// src/lib/three/island/geometry.ts
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "./rng";
import type { SceneContext } from "./types";

/** Noise-displaced icosahedron (prototype 617–624). Seeded locally, independent of the module RNGs. */
export function blobGeometry(detail = 1, amp = 0.2, seed = 3, freq = 1.7): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const nz = new SimplexNoise({ random: mulberry32(seed) });
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + amp * nz.noise3d(v.x * freq, v.y * freq, v.z * freq));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();

/** TRS matrix (prototype 626). Returns a SHARED scratch matrix: use it (setMatrixAt) or .clone() it before the next call. */
export function composeMatrix(x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy = sx, sz = sx): THREE.Matrix4 {
  return _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

export interface GeometryKit {
  /** Shared octahedron for every crystal (prototype 739). */
  crystalGeometry: THREE.OctahedronGeometry;
  /** Radial glow sprite texture (prototype 766–771). */
  glowTexture: THREE.CanvasTexture;
  glowSprite(color: THREE.Color, scale: number, opacity?: number): THREE.Sprite;
}

export function createGeometryKit({ bag }: SceneContext): GeometryKit {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d");
  if (g) {
    const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.22, "rgba(255,255,255,.5)");
    gradient.addColorStop(0.55, "rgba(255,255,255,.1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 128, 128);
  }
  const glowTexture = bag.add(new THREE.CanvasTexture(canvas));
  const crystalGeometry = bag.add(new THREE.OctahedronGeometry(1, 0));
  return {
    crystalGeometry,
    glowTexture,
    glowSprite(color, scale, opacity = 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTexture, color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity }),
      );
      sprite.scale.setScalar(scale);
      return sprite;
    },
  };
}
