// src/lib/three/island/particles.ts
import * as THREE from "three";
import { rngFor, type Rng } from "./rng";
import type { SceneContext } from "./types";

// Fireflies around the island + dust drifting along the camera path (prototype lines 913–960).
// Counts scale with the quality tier (medium: −50 %).

const PARTICLE_VS = /* glsl */ `
      uniform float uTime, uPR, uFog; attribute float aSeed, aSize; varying float vTw, vS, vF;
      void main(){
        vec3 p = position;
        p.x += sin(uTime * 0.35 + aSeed * 21.0) * 0.7;
        p.y += sin(uTime * 0.27 + aSeed * 13.0) * 0.55;
        p.z += cos(uTime * 0.31 + aSeed * 17.0) * 0.7;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = min(aSize * uPR * (55.0 / max(d, 0.1)), 36.0 * uPR);
        vTw = 0.45 + 0.55 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 40.0);
        vS = aSeed; vF = exp(-uFog * d * d);
      }`;
const PARTICLE_FS = /* glsl */ `
      uniform float uHdr; uniform vec3 uA, uB; varying float vTw, vS, vF;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d); a = a * a;
        vec3 c = mix(uA, uB, step(0.55, vS));
        gl_FragColor = vec4(c * a * vTw * uHdr * vF, 1.0);
      }`;

interface ParticleStyle {
  size: number;
  hdr: number;
  colA: readonly [number, number, number];
  colB: readonly [number, number, number];
  fog: number;
}

function makeParticles({ uTime, uPixelRatio }: SceneContext, rng: Rng, count: number, spawn: (i: number) => [number, number, number], style: ParticleStyle): THREE.Points {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set(spawn(i), i * 3);
    seed[i] = rng.next();
    size[i] = style.size * rng.range(0.5, 1.3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime, uPR: uPixelRatio, uHdr: { value: style.hdr }, uA: { value: new THREE.Vector3(...style.colA) }, uB: { value: new THREE.Vector3(...style.colB) }, uFog: { value: style.fog } },
    vertexShader: PARTICLE_VS,
    fragmentShader: PARTICLE_FS,
  });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  return points;
}

export function createParticles(ctx: SceneContext): void {
  const rng = rngFor("particles");
  const R = rng.range;
  const scale = ctx.quality.particleScale;
  const fireflies = makeParticles(ctx, rng, Math.round(420 * scale), () => {
    const a = R(0, Math.PI * 2);
    const r = R(4, 22);
    return [Math.cos(a) * r, R(-8, 9), Math.sin(a) * r];
  }, { size: 3.2, hdr: 2.4, colA: [1.0, 0.78, 0.45], colB: [0.2, 0.85, 1.2], fog: 0.0001 });
  const dust = makeParticles(ctx, rng, Math.round(1500 * scale), (i) => {
    const zone = i % 3;
    if (zone === 0) {
      const a = R(0, Math.PI * 2);
      const r = R(0, 26);
      return [Math.cos(a) * r, R(-48, -30), Math.sin(a) * r];
    }
    if (zone === 1) return [R(-24, 24), R(-56, -30), R(-60, -18)];
    return [R(-30, 30), R(-10, 36), R(-100, -40)];
  }, { size: 2.0, hdr: 1.6, colA: [0.55, 0.45, 1.2], colB: [0.2, 0.9, 1.2], fog: 0.00025 });
  ctx.scene.add(fireflies, dust);
}
