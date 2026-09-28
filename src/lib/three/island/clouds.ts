// src/lib/three/island/clouds.ts
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CLOUD_Y, PORTAL_POS } from "./chapters";
import { fogUniforms } from "./noise";
import type { QualitySettings } from "./quality";
import { mulberry32, rngFor } from "./rng";
import type { SceneContext, Unit } from "./types";

// Instanced cloud puffs (prototype lines 828–911), split into 4 zones so whole zones can be culled:
// sea (annulus under the island), path (the puffs the camera dives / climbs through), background
// (hero depth layers) and portal (cradling the portal). Detail + counts follow the quality tier.

export type CloudZone = "sea" | "path" | "background" | "portal";

export interface CloudPlan {
  detail: number;
  sea: number;
  background: number;
  portal: number;
}

/** Cluster counts per zone. The 8 camera-path clusters are never thinned (the dive/climb veil needs them). */
export function cloudPlan(q: Pick<QualitySettings, "cloudDetail" | "cloudCountScale">): CloudPlan {
  return {
    detail: q.cloudDetail,
    sea: Math.round(64 * q.cloudCountScale),
    background: Math.round(8 * q.cloudCountScale),
    portal: Math.round(11 * q.cloudCountScale),
  };
}

const PATH_CLUSTERS: readonly (readonly [number, number])[] = [
  [15, 6], [11, -3], [18, 12], [2, -44], [-6, -40], [7, -48], [0, -36], [-3, -52],
];

const CLOUD_VERTEX = /* glsl */ `
    #include <common>
    #include <fog_pars_vertex>
    uniform float uTime; varying vec3 vN; varying vec3 vW;
    void main(){
      float sd = float(gl_InstanceID);
      mat4 im = instanceMatrix;
      vec4 w = modelMatrix * im * vec4(position, 1.0);
      w.x += sin(uTime * 0.05 + sd * 1.7) * 0.8;
      w.y += sin(uTime * 0.21 + sd * 2.3) * 0.12;
      vW = w.xyz; vN = normalize(mat3(modelMatrix * im) * normal);
      vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
const CLOUD_FRAGMENT = /* glsl */ `
    #include <common>
    #include <fog_pars_fragment>
    uniform vec3 uSun, uLit, uShade, uUnder, uRimC, uCore, uPortal; varying vec3 vN; varying vec3 vW;
    void main(){
      vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
      float ndl = dot(n, uSun);
      float ramp = smoothstep(-0.35, 0.85, ndl);
      vec3 c = mix(uShade, uLit, ramp);
      c = mix(uUnder, c, smoothstep(-0.85, 0.15, n.y));
      float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      c += vec3(0.62, 0.2, 0.42) * smoothstep(0.45, 0.95, ndl) * 0.55;
      c += uRimC * fr * 0.75;
      float dc = length(vW - uCore); vec3 lc = normalize(uCore - vW);
      c += vec3(0.1, 0.7, 1.1) * exp(-dc * 0.08) * (0.25 + max(dot(n, lc), 0.0)) * 0.5;
      float dp = length(vW - uPortal); vec3 lp = normalize(uPortal - vW);
      c += vec3(0.5, 0.2, 1.0) * exp(-dp * 0.05) * max(dot(n, lp), 0.0) * 0.55;
      gl_FragColor = vec4(c, 1.0);
      #include <fog_fragment>
    }`;

function puffGeometry(detail: number): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const nz = new SimplexNoise({ random: mulberry32(77) });
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + 0.11 * nz.noise3d(v.x * 2.1, v.y * 2.1, v.z * 2.1) + 0.05 * nz.noise3d(v.x * 4.7, v.y * 4.7, v.z * 4.7));
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function createClouds({ scene, uTime, quality }: SceneContext, coreY: number): Unit {
  const plan = cloudPlan(quality);
  const rng = rngFor("clouds");
  const R = rng.range;
  const portal = new THREE.Vector3(...PORTAL_POS);
  const material = new THREE.ShaderMaterial({
    fog: true,
    uniforms: fogUniforms({
      uTime,
      uSun: { value: new THREE.Vector3(0.25, 0.5, -0.83).normalize() },
      uLit: { value: new THREE.Color(0.36, 0.17, 0.42) },
      uShade: { value: new THREE.Color(0.075, 0.036, 0.19) },
      uUnder: { value: new THREE.Color(0.035, 0.016, 0.1) },
      uRimC: { value: new THREE.Color(0.08, 0.36, 0.7) },
      uCore: { value: new THREE.Vector3(0, coreY, 0) },
      uPortal: { value: portal },
    }),
    vertexShader: CLOUD_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
  });
  const geometry = puffGeometry(plan.detail);

  const zones: Record<CloudZone, THREE.Matrix4[]> = { sea: [], path: [], background: [], portal: [] };
  const cluster = (zone: CloudZone, cx: number, cy: number, cz: number, size: number, n = 7) => {
    for (let k = 0; k < n; k++) {
      const a = R(0, Math.PI * 2);
      const d = Math.sqrt(R(0, 1)) * size * 1.25;
      const r = size * (k === 0 ? 1.0 : R(0.42, 0.8));
      const x = cx + Math.cos(a) * d * 1.3;
      const z = cz + Math.sin(a) * d;
      const dome = (1 - d / (size * 1.25)) * size * 0.45;
      zones[zone].push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, cy + r * 0.3 + dome, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R(0, 6), 0)),
          new THREE.Vector3(r * R(1.05, 1.35), r * R(0.85, 1.05), r * R(1.0, 1.25)),
        ),
      );
    }
  };

  // sea: annulus around / below the island (bounded: ≤ 2000 tries)
  for (let placed = 0, tries = 0; placed < plan.sea && tries < 2000; tries++) {
    const a = R(0, Math.PI * 2);
    const r = 9 + Math.pow(R(0, 1), 1.35) * 125;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x, z) < 17) continue;
    cluster("sea", x, CLOUD_Y + R(-1.5, 1.2), z, R(3.2, 6.2) * (r > 60 ? 1.5 : 1), 6);
    placed++;
  }
  // path: guaranteed puffs on the camera's dive & climb
  for (const [x, z] of PATH_CLUSTERS) cluster("path", x, CLOUD_Y + R(-0.6, 0.6), z, R(3.6, 4.8), 7);
  // background: high clouds behind the island (hero depth layers)
  for (let i = 0; i < plan.background; i++) {
    const a = R(-2.8, -0.35);
    const r = R(75, 150);
    cluster("background", Math.cos(a) * r, R(-2, 10), Math.sin(a) * r, R(5, 9), 8);
  }
  // portal: clouds cradling the portal (bounded: ≤ 200 tries)
  for (let i = 0, n = 0; n < plan.portal && i < 200; i++) {
    const a = R(0, Math.PI * 2);
    const r = R(15, 40);
    const x = portal.x + Math.cos(a) * r * 1.3;
    const z = portal.z + Math.sin(a) * r * 0.7 - 6;
    if (Math.abs(x) < 16 && z > portal.z - 4) continue;
    cluster("portal", x, portal.y - R(13, 18), z, R(3.5, 6.5), 6);
    n++;
  }

  const meshes = {} as Record<CloudZone, THREE.InstancedMesh>;
  for (const zone of Object.keys(zones) as CloudZone[]) {
    const list = zones[zone];
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.computeBoundingSphere();
    if (mesh.boundingSphere) mesh.boundingSphere.radius += 1.5; // the vertex shader drifts puffs by ≤ 0.8 / 0.12
    mesh.frustumCulled = true; // whole zone skipped when outside the view
    scene.add(mesh);
    meshes[zone] = mesh;
  }

  return {
    update(_frame, vis) {
      meshes.background.visible = vis.cloudBackground;
      meshes.portal.visible = vis.cloudPortal;
    },
  };
}
