// src/lib/three/island/water.ts
import * as THREE from "three";
import { lerp } from "./math";
import { fogUniforms, GLSL_NOISE } from "./noise";
import { WATERFALL_PHI, type MainIsland } from "./terrain";
import type { SceneContext } from "./types";

// Pond, stream ribbon and waterfall (prototype lines 519–614).

const WATER_VS = /* glsl */ `
    #include <common>
    #include <fog_pars_vertex>
    varying vec3 vW; varying vec2 vUv;
    void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
const WATER_FS = /* glsl */ `
    #include <common>
    #include <fog_pars_fragment>
    uniform float uTime; varying vec3 vW; varying vec2 vUv;
    ${GLSL_NOISE}
    void main(){
      vec3 v = normalize(cameraPosition - vW);
      float fres = pow(1.0 - clamp(v.y, 0.0, 1.0), 2.5);
      float n = fbm(vW.xz * 1.1 + vec2(uTime * 0.22, -uTime * 0.31));
      float sp = smoothstep(0.74, 0.86, fbm(vW.xz * 3.6 + vec2(-uTime * 0.5, uTime * 0.4)));
      vec3 c = mix(vec3(0.0, 0.16, 0.30), vec3(0.42, 0.34, 0.95), fres * 0.85);
      c += vec3(0.05, 0.75, 1.0) * n * 0.45 + vec3(1.2, 1.35, 1.5) * sp * 0.8;
      gl_FragColor = vec4(c, 0.93);
      #include <fog_fragment>
    }`;
const FALL_VS = /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
const FALL_FS = /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime; varying vec2 vUv;
      ${GLSL_NOISE}
      void main(){
        float n = fbm(vec2(vUv.x * 7.0, vUv.y * 9.0 - uTime * 2.6));
        float streak = fbm(vec2(vUv.x * 22.0, vUv.y * 3.0 - uTime * 3.4));
        float edge = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        float fade = smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.0, 0.02, vUv.y);
        vec3 c = mix(vec3(0.15, 0.6, 1.0), vec3(1.15, 1.35, 1.5), smoothstep(0.4, 0.75, n + streak * 0.35));
        float a = edge * fade * (0.45 + 0.55 * smoothstep(0.25, 0.7, n)) * mix(1.0, 0.6, vUv.y);
        gl_FragColor = vec4(c * 0.85, a * 0.9);
        #include <fog_fragment>
      }`;

function ribbon(verts: number[], uvs: number[], index: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  return g;
}

export function createWater({ uTime }: SceneContext, island: MainIsland): void {
  const { pond, waterfall, shape, group } = island;
  const waterMaterial = new THREE.ShaderMaterial({ transparent: true, fog: true, depthWrite: false, uniforms: fogUniforms({ uTime }), vertexShader: WATER_VS, fragmentShader: WATER_FS });
  const pondLevel = shape.topAt(pond.x, pond.z) + 0.74;
  const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(2.35, 40).rotateX(-Math.PI / 2), waterMaterial);
  pondMesh.position.set(pond.x, pondLevel, pond.z);
  group.add(pondMesh);

  // Stream ribbon following the carved channel down to the rim (prototype 551–568)
  const N = 36;
  const wid = 0.62;
  const dx = waterfall.x - pond.x;
  const dz = waterfall.z - pond.z;
  const L = Math.hypot(dx, dz);
  const px = -dz / L;
  const pz = dx / L;
  const verts: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  let end = new THREE.Vector3();
  for (let k = 0; k <= N; k++) {
    const t = lerp(0.3, 1.0, k / N);
    const x = pond.x + dx * t;
    const z = pond.z + dz * t;
    const y = Math.min(pondLevel, shape.topAt(x, z) + 0.24);
    end = new THREE.Vector3(x, y, z);
    verts.push(x + px * wid, y, z + pz * wid, x - px * wid, y, z - pz * wid);
    uvs.push(0, k / N, 1, k / N);
    if (k < N) {
      const a = k * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  group.add(new THREE.Mesh(ribbon(verts, uvs, index), waterMaterial));

  // Waterfall: ballistic arc from the rim down into the cloud sea (prototype 570–613)
  const dirx = Math.cos(WATERFALL_PHI);
  const dirz = Math.sin(WATERFALL_PHI);
  const M = 60;
  const fv: number[] = [];
  const fu: number[] = [];
  const fi: number[] = [];
  for (let k = 0; k <= M; k++) {
    const s = k / M;
    const out = 0.35 + 3.4 * s;
    const y = end.y - 25 * Math.pow(s, 1.75);
    const w = 0.62 + 1.9 * s;
    const cx = end.x + dirx * out;
    const cz = end.z + dirz * out;
    fv.push(cx + px * w, y, cz + pz * w, cx - px * w, y, cz - pz * w);
    fu.push(0, s, 1, s);
    if (k < M) {
      const a = k * 2;
      fi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const fallMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: fogUniforms({ uTime }),
    vertexShader: FALL_VS,
    fragmentShader: FALL_FS,
  });
  group.add(new THREE.Mesh(ribbon(fv, fu, fi), fallMaterial));
}
