// src/lib/three/island/pillars.ts
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { pillarReveal, STAT_BASE_Y, STAT_COUNT, STAT_Z } from "./chapters";
import { crystalMaterial, CYAN, PINK, VIOLET } from "./crystals";
import { composeMatrix, type GeometryKit } from "./geometry";
import { addPointLight } from "./lights";
import { lerp, sstep } from "./math";
import { fbm, fogUniforms } from "./noise";
import { rngFor } from "./rng";
import { makeIsland } from "./terrain";
import type { SceneContext, Unit } from "./types";

// Chapter 3 — stat crystals rising from floating rocks (prototype lines 1137–1212).

const PILLAR_VS = /* glsl */ `
        #include <common>
        #include <fog_pars_vertex>
        varying vec3 vW; varying vec3 vL;
        void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`;
const PILLAR_FS = /* glsl */ `
        #include <common>
        #include <fog_pars_fragment>
        uniform float uTime, uReveal, uH; uniform vec3 uC; varying vec3 vW; varying vec3 vL;
        void main(){
          float yN = vL.y / uH;
          if (yN > uReveal) discard;
          vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
          vec3 v = normalize(cameraPosition - vW);
          float fr = pow(1.0 - abs(dot(n, v)), 2.2);
          float facet = 0.5 + 0.5 * dot(n, normalize(vec3(-0.5, 0.6, 0.6)));
          float grad = mix(0.25, 1.35, yN * yN);
          float ec = fract(atan(vL.x, vL.z) / 1.0471976 + 1.0);
          float edges = smoothstep(0.07, 0.0, min(ec, 1.0 - ec));
          float scan = smoothstep(0.035, 0.0, abs(fract(vL.y * 0.11 - uTime * 0.22) - 0.5)) * 1.4;
          float inner = 0.5 + 0.5 * sin(vL.y * 1.3 + uTime * 0.8 + vW.x);
          vec3 c = uC * (0.06 + 0.22 * facet + 0.1 * inner) * grad + uC * fr * 2.4 * grad;
          c += (uC + 0.35) * edges * (0.6 + 1.4 * yN) + uC * scan * grad + vec3(1.0) * pow(fr, 6.0) * 0.6;
          float edge = smoothstep(0.035, 0.0, uReveal - yN) * step(uReveal, 0.999);
          c += (vec3(1.0) + uC) * edge * 4.0;
          gl_FragColor = vec4(c, 1.0);
          #include <fog_fragment>
        }`;

/** One per StatsBand stat, tallest first (prototype 1144–1146). */
const SPECS: readonly { x: number; h: number; color: THREE.Color }[] = [
  { x: -10.5, h: 8.6, color: CYAN },
  { x: -3.5, h: 7.0, color: VIOLET },
  { x: 3.5, h: 5.8, color: new THREE.Color(0.3, 0.55, 1.4) },
  { x: 10.5, h: 4.8, color: PINK },
];

export interface PillarDeps {
  kit: GeometryKit;
  islandMaterial: THREE.MeshStandardMaterial;
  debrisGeometry: THREE.BufferGeometry;
  debrisMaterial: THREE.MeshStandardMaterial;
}

interface Pillar {
  g: THREE.Group;
  material: THREE.ShaderMaterial;
  ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  glow: THREE.Sprite;
  H: number;
  phase: number;
  y0: number;
  x0: number;
  z0: number;
}

export function createPillars({ scene, uTime }: SceneContext, deps: PillarDeps, onStatsReveal: (reveal: readonly number[]) => void): Unit {
  const rng = rngFor("pillars");
  const R = rng.range;
  const group = new THREE.Group();
  scene.add(group);
  const smallTop = (x: number, z: number, rn: number, nz: Parameters<typeof fbm>[0]) => 0.3 + 0.35 * fbm(nz, x * 0.3, z * 0.3, 2) - 1.0 * Math.pow(sstep(0.6, 1, rn), 1.5);

  const pillars: Pillar[] = SPECS.slice(0, STAT_COUNT).map((sp, i) => {
    const g = new THREE.Group();
    g.position.set(sp.x, STAT_BASE_Y + Math.sin(i * 1.9) * 0.6, STAT_Z + Math.abs(sp.x) * 0.25);
    const rock = makeIsland({ radius: 2.7, depth: 4.2, detail: 10, seed: 40 + i, top: smallTop, outline: 0.16 });
    g.add(new THREE.Mesh(rock.geometry, deps.islandMaterial));
    const body = new THREE.CylinderGeometry(0.9, 1.05, sp.h, 6, 1).translate(0, sp.h / 2, 0);
    const tip = new THREE.ConeGeometry(0.9, 1.7, 6, 1).translate(0, sp.h + 0.85, 0);
    const geometry = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]);
    body.dispose();
    tip.dispose();
    const H = sp.h + 1.7;
    const shards = new THREE.InstancedMesh(deps.kit.crystalGeometry, crystalMaterial(uTime, 1.2), 4);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + R(0, 1);
      const s = R(0.35, 0.6);
      shards.setMatrixAt(k, composeMatrix(Math.cos(a) * 1.9, R(0.2, 0.9), Math.sin(a) * 1.9, R(-0.4, 0.4), 0, R(-0.4, 0.4), s * 0.3, s * 1.1, s * 0.3));
      shards.setColorAt(k, sp.color);
    }
    g.add(shards);
    const material = new THREE.ShaderMaterial({ fog: true, uniforms: fogUniforms({ uTime, uReveal: { value: 0 }, uH: { value: H }, uC: { value: sp.color } }), vertexShader: PILLAR_VS, fragmentShader: PILLAR_FS });
    const pillar = new THREE.Mesh(geometry, material);
    pillar.position.y = 0.2;
    g.add(pillar);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.025, 4, 90),
      new THREE.MeshBasicMaterial({ color: sp.color.clone().multiplyScalar(2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    ring.rotation.x = Math.PI / 2 + 0.25;
    g.add(ring);
    const glow = deps.kit.glowSprite(sp.color.clone().multiplyScalar(1.3), 7, 0);
    g.add(glow);
    group.add(g);
    return { g, material, ring, glow, H, phase: R(0, 6), y0: g.position.y, x0: sp.x, z0: g.position.z };
  });
  const light = addPointLight(scene, 0x6a8cff, 70, 40, 1.6, [0, -40, -46]);

  // Drifting rocks in the deep for parallax (prototype 1203–1211) — shares the debris geometry/material.
  const rockColors = ["#4a3d62", "#5a4a70", "#3a2f52"].map((c) => new THREE.Color(c));
  const rocks = new THREE.InstancedMesh(deps.debrisGeometry, deps.debrisMaterial, 26);
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1;
    const s = R(0.25, 1.3);
    rocks.setMatrixAt(i, composeMatrix(side * R(15, 34), R(-58, -34), R(-80, -30), R(0, 6), R(0, 6), R(0, 6), s, s * R(0.6, 1), s));
    rocks.setColorAt(i, rockColors[i % 3]);
  }
  group.add(rocks);

  const reveal = pillars.map(() => 0);
  let reported = false;

  return {
    update(frame, vis) {
      light.setOn(vis.stats);
      group.visible = vis.stats;
      // Count-up source: report only real changes (≈ p 0.6 → 0.72), plus the first frame.
      let changed = !reported;
      for (let i = 0; i < pillars.length; i++) {
        const r = pillarReveal(frame.p, i);
        if (r !== reveal[i] && (Math.abs(r - reveal[i]) > 1e-3 || r === 0 || r === 1)) {
          reveal[i] = r;
          changed = true;
        }
      }
      if (changed) {
        reported = true;
        onStatsReveal(reveal);
      }
      if (!vis.stats) return;
      pillars.forEach((pl, i) => {
        const r = pillarReveal(frame.p, i); // exact (the count-up source above is throttled to 1e-3 steps)
        pl.material.uniforms.uReveal.value = r;
        pl.g.position.y = pl.y0 + Math.sin(frame.t * 0.7 + pl.phase) * 0.18 * frame.bob;
        pl.ring.position.y = lerp(0.5, pl.H * 0.78, r);
        pl.ring.rotation.z += frame.dt * 0.5 * frame.bob; // idle spin: none under reduced motion
        pl.ring.material.opacity = r;
        pl.glow.position.y = pl.H * r;
        pl.glow.material.opacity = 0.35 * r;
      });
    },
    // Portrait: pillars closer together and slightly smaller (prototype 1496–1497)
    resize(width, height) {
      const portrait = width / height < 0.9;
      for (const pl of pillars) {
        pl.g.position.x = pl.x0 * (portrait ? 0.5 : 1);
        pl.g.position.z = portrait ? STAT_Z + Math.abs(pl.x0) * 0.1 : pl.z0;
        pl.g.scale.setScalar(portrait ? 0.85 : 1);
      }
    },
  };
}
