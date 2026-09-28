// src/lib/three/island/crystals.ts
import * as THREE from "three";
import { blobGeometry, composeMatrix, type GeometryKit } from "./geometry";
import { addPointLight, withRim } from "./lights";
import { fbm, fogUniforms } from "./noise";
import { rngFor } from "./rng";
import { makeIsland, type MainIsland } from "./terrain";
import { sstep } from "./math";
import type { SceneContext, Unit } from "./types";

// Crystals (instanced, emissive, flat-shaded via derivatives), glowing core, satellite islands and
// orbiting debris (prototype lines 696–826).

export const CYAN = new THREE.Color(0.05, 0.85, 1.25);
export const VIOLET = new THREE.Color(0.75, 0.22, 1.35);
export const PINK = new THREE.Color(1.2, 0.35, 0.95);

const CRYSTAL_VS = /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vW; varying vec3 vCol; varying float vH;
      void main(){
        mat4 im = mat4(1.0);
        #ifdef USE_INSTANCING
          im = instanceMatrix;
        #endif
        vCol = vec3(0.2, 0.8, 1.0);
        #ifdef USE_INSTANCING_COLOR
          vCol = instanceColor;
        #endif
        vH = position.y;
        vec4 w = modelMatrix * im * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
const CRYSTAL_FS = /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime; uniform float uInt; varying vec3 vW; varying vec3 vCol; varying float vH;
      void main(){
        vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
        vec3 v = normalize(cameraPosition - vW);
        float fr = pow(1.0 - abs(dot(n, v)), 2.0);
        float facet = 0.5 + 0.5 * dot(n, normalize(vec3(-0.4, 0.8, 0.35)));
        vec3 c = vCol * (0.18 + 0.55 * facet) + vCol * fr * 1.8 + vec3(1.0) * pow(fr, 5.0) * 0.9;
        c += vCol * smoothstep(-1.0, 1.0, vH) * 0.7;
        c *= uInt * (0.9 + 0.1 * sin(uTime * 2.0 + vW.x));
        gl_FragColor = vec4(c, 1.0);
        #include <fog_fragment>
      }`;

export function crystalMaterial(uTime: THREE.IUniform<number>, intensity = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ fog: true, uniforms: fogUniforms({ uTime, uInt: { value: intensity } }), vertexShader: CRYSTAL_VS, fragmentShader: CRYSTAL_FS });
}

export interface Crystals extends Unit {
  /** Shared with the pillars' drifting rocks. */
  debrisGeometry: THREE.BufferGeometry;
  debrisMaterial: THREE.MeshStandardMaterial;
}

interface Debris {
  r: number;
  a: number;
  y: number;
  s: number;
  w: number;
  ph: number;
  rx: number;
  ry: number;
}

export function createCrystals({ scene, uTime }: SceneContext, island: MainIsland, kit: GeometryKit): Crystals {
  const rng = rngFor("crystals");
  const R = rng.range;
  const { shape, group, coreY } = island;
  const up = new THREE.Vector3(0, 1, 0);

  // Clusters on the island top + veins out of the underside (prototype 740–764)
  const spots: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  ([[-6.8, -1.2], [2.8, -6.4], [-2.6, 6.9]] as const).forEach(([cx, cz], ci) => {
    const n = ci === 0 ? 6 : 4;
    for (let k = 0; k < n; k++) {
      const x = cx + R(-0.9, 0.9);
      const z = cz + R(-0.9, 0.9);
      const h = R(0.8, 1.9) * (k === 0 ? 1.4 : 1);
      spots.push({ m: composeMatrix(x, shape.topAt(x, z) + h * 0.55, z, R(-0.35, 0.35), R(0, 3), R(-0.35, 0.35), h * 0.28, h, h * 0.28).clone(), c: ci === 1 ? VIOLET : CYAN });
    }
  });
  for (let k = 0; k < 18; k++) {
    const a = R(0, Math.PI * 2);
    const f = R(0.18, 0.72);
    const Rp = shape.Rof(a) * Math.pow(1 - Math.pow(f, 1.7), 0.82) * 0.92;
    const y = shape.topAt(Math.cos(a) * shape.Rof(a), Math.sin(a) * shape.Rof(a)) - 10.5 * Math.pow(f, 1.12);
    const q = new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(Math.cos(a), -0.6, Math.sin(a)).normalize());
    const s = R(0.4, 1.0);
    spots.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * Rp, y, Math.sin(a) * Rp), q, new THREE.Vector3(s * 0.3, s * 1.2, s * 0.3)), c: rng.next() < 0.5 ? CYAN : VIOLET });
  }
  const crystals = new THREE.InstancedMesh(kit.crystalGeometry, crystalMaterial(uTime, 1.0), spots.length);
  spots.forEach((s, i) => {
    crystals.setMatrixAt(i, s.m);
    crystals.setColorAt(i, s.c);
  });
  group.add(crystals);

  // Glowing core under the island (prototype 776–796) — its point light lives at the scene root.
  const core = new THREE.Group();
  core.position.set(0, coreY, 0);
  const coreCrystals = new THREE.InstancedMesh(kit.crystalGeometry, crystalMaterial(uTime, 1.5), 7);
  coreCrystals.setMatrixAt(0, composeMatrix(0, -1.6, 0, 0, 0.4, 0, 1.2, 3.8, 1.2));
  coreCrystals.setColorAt(0, CYAN);
  for (let k = 1; k < 7; k++) {
    const a = (k / 6) * Math.PI * 2;
    const q = new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(Math.cos(a) * 0.7, -1, Math.sin(a) * 0.7).normalize());
    const s = R(0.5, 0.85);
    coreCrystals.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * 0.8, 0.2, Math.sin(a) * 0.8), q, new THREE.Vector3(0.32 * s, 1.9 * s, 0.32 * s)));
    coreCrystals.setColorAt(k, k % 2 ? VIOLET : CYAN);
  }
  core.add(coreCrystals, kit.glowSprite(new THREE.Color(0.2, 0.9, 1.6), 13, 0.9), kit.glowSprite(new THREE.Color(0.8, 0.25, 1.4), 26, 0.35));
  group.add(core);
  const coreLight = addPointLight(scene, 0x4fd2ff, 85, 30, 1.7, [0, coreY + 1.5, 0]);

  // Satellite islands for depth (prototype 798–813)
  const smallTop = (x: number, z: number, rn: number, nz: Parameters<typeof fbm>[0]) => 0.35 + 0.5 * fbm(nz, x * 0.25, z * 0.25, 2) - 1.1 * Math.pow(sstep(0.62, 1, rn), 1.5);
  const satellites = ([[-19, -1.5, -7, 2.6, 5], [17.5, 5.5, -13, 2.1, 7], [-12, 8.5, -27, 3.0, 9], [24, -6, 4, 1.6, 12]] as const).map(([x, y, z, r, seed]) => {
    const isl = makeIsland({ radius: r, depth: r * 1.6, detail: 9, seed, top: smallTop, outline: 0.18 });
    const mesh = new THREE.Mesh(isl.geometry, island.material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = R(0, 6);
    const cr = new THREE.InstancedMesh(kit.crystalGeometry, crystalMaterial(uTime, 1.1), 2);
    cr.setMatrixAt(0, composeMatrix(0.2, 0.9, 0.1, 0.2, 0, 0.1, 0.25, 0.9, 0.25));
    cr.setColorAt(0, CYAN);
    cr.setMatrixAt(1, composeMatrix(-0.3, 0.6, 0.35, -0.3, 0, -0.2, 0.18, 0.6, 0.18));
    cr.setColorAt(1, VIOLET);
    mesh.add(cr);
    group.add(mesh);
    return { mesh, y0: y, phase: R(0, 6) };
  });

  // Orbiting debris (prototype 815–826)
  const debrisGeometry = blobGeometry(1, 0.32, 5, 1.3);
  const debrisMaterial = withRim(new THREE.MeshStandardMaterial({ vertexColors: false, flatShading: true, roughness: 0.92 }), new THREE.Color(0.35, 0.4, 1.0), 2.6, 0.45);
  const debrisMesh = new THREE.InstancedMesh(debrisGeometry, debrisMaterial, 46);
  debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const debrisColors = ["#7d6a8e", "#6a5680", "#9b7a6a", "#574870"].map((c) => new THREE.Color(c));
  const debris: Debris[] = [];
  for (let i = 0; i < 46; i++) {
    debris.push({ r: R(13, 28), a: R(0, Math.PI * 2), y: R(-11, 5), s: R(0.16, i < 8 ? 1.0 : 0.55), w: R(0.015, 0.05) * (rng.next() < 0.5 ? 1 : -1), ph: R(0, 6), rx: R(0, 6), ry: R(0, 6) });
    debrisMesh.setColorAt(i, debrisColors[i % debrisColors.length]);
  }
  group.add(debrisMesh);

  return {
    debrisGeometry,
    debrisMaterial,
    // Island life (prototype 1570–1579): core spin, satellite bob, debris orbit.
    update(frame, vis) {
      coreLight.setOn(vis.island);
      if (!vis.island) return;
      const { t, dt, bob } = frame;
      core.rotation.y += dt * 0.25 * bob;
      for (const s of satellites) {
        s.mesh.position.y = s.y0 + Math.sin(t * 0.6 + s.phase) * 0.35 * bob;
        s.mesh.rotation.y += dt * 0.03 * bob;
      }
      debris.forEach((d, i) => {
        const a = d.a + t * d.w;
        debrisMesh.setMatrixAt(i, composeMatrix(Math.cos(a) * d.r, d.y + Math.sin(t * 0.7 + d.ph) * 0.3 * bob, Math.sin(a) * d.r, d.rx + t * 0.2, d.ry + t * 0.13, 0, d.s));
      });
      debrisMesh.instanceMatrix.needsUpdate = true;
    },
  };
}
