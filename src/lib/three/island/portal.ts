// src/lib/three/island/portal.ts
import * as THREE from "three";
import { PORTAL_POS, portalCharge } from "./chapters";
import { blobGeometry, composeMatrix, type GeometryKit } from "./geometry";
import { addPointLight, withRim } from "./lights";
import { GLSL_NOISE } from "./noise";
import { rngFor } from "./rng";
import type { SceneContext, Unit } from "./types";

// Chapter 4 — the portal: ring, frame, swirl disc, gyroscope arcs, shards, swirling particles
// (prototype lines 1214–1318). The charge follows the camera progress.

const RING_VS = /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const RING_FS = /* glsl */ `
      uniform float uTime, uCharge; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      ${GLSL_NOISE}
      void main(){
        float fl = fbm(vec2(vUv.x * 70.0 - uTime * 3.0, vUv.y * 5.0 + uTime * 0.6));
        float st = pow(0.5 + 0.5 * sin(vUv.x * 6.2831 * 18.0 - uTime * 5.0), 10.0);
        float h = 0.5 + 0.5 * sin(vUv.x * 6.2831 * 2.0 + uTime * 0.7);
        vec3 c = mix(mix(vec3(0.0, 0.8, 1.2), vec3(0.62, 0.18, 1.25), h), vec3(1.2, 0.4, 0.9), fl * 0.35);
        vec3 v = normalize(cameraPosition - vW); float fr = pow(1.0 - abs(dot(normalize(vN), v)), 2.0);
        float I = (0.6 + fl * 0.85 + st * 0.9 + fr * 0.7) * (0.7 + uCharge * 0.45);
        gl_FragColor = vec4(c * I, 1.0);
      }`;
const DISC_VS = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DISC_FS = /* glsl */ `
      uniform float uTime, uCharge; varying vec2 vUv;
      ${GLSL_NOISE}
      void main(){
        vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a = atan(p.y, p.x);
        float lr = log(r + 0.001);
        float sw = a + lr * 1.9 + uTime * 0.32;
        float n = fbm(vec2(a * 1.8 + uTime * 0.15, lr * 3.5 - uTime * 0.8));
        float arms = pow(0.5 + 0.5 * sin(sw * 5.0 + n * 3.2), 5.0);
        vec2 sp = vec2((a + 3.14159) * 9.0 / 3.14159, lr * 5.0 + uTime * 1.3);
        vec2 f = fract(sp); float h = hash12(floor(sp));
        float star = step(0.84, h) * smoothstep(0.1, 0.0, abs(f.x - 0.5)) * smoothstep(0.5, 0.0, abs(f.y - 0.5));
        vec3 armC = mix(vec3(0.42, 0.1, 1.05), vec3(0.03, 0.75, 1.2), smoothstep(0.3, 0.7, n));
        float radial = smoothstep(0.12, 0.98, r);
        vec3 c = vec3(0.01, 0.004, 0.035);
        c += armC * arms * radial * 1.25 + armC * n * 0.22 * radial;
        c += vec3(0.75, 0.9, 1.1) * star * smoothstep(0.08, 0.7, r) * 1.6;
        float rim = exp(-(1.0 - r) * 11.0);
        c += mix(vec3(0.05, 0.85, 1.3), vec3(0.85, 0.3, 1.3), 0.5 + 0.5 * sin(a * 2.0 + uTime)) * rim * 0.8;
        c *= 0.75 + uCharge * 0.5;
        gl_FragColor = vec4(c, smoothstep(1.0, 0.965, r));
      }`;
const SWIRL_VS = /* glsl */ `
      uniform float uTime, uCharge, uPR; attribute float aAng, aSeed, aSp; varying float vA; varying float vS;
      void main(){
        float ph = fract(aSeed * 7.13 + uTime * aSp * (0.8 + uCharge * 1.2));
        float r = mix(17.0, 0.6, pow(ph, 0.75));
        float an = aAng + ph * 5.5;
        vec3 p = vec3(cos(an) * r, sin(an) * r, (1.0 - ph) * (aSeed - 0.3) * 10.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min((1.2 + 2.6 * fract(aSeed * 13.7)) * uPR * (48.0 / max(-mv.z, 0.1)), 24.0 * uPR);
        vA = smoothstep(0.0, 0.2, ph) * smoothstep(1.0, 0.8, ph); vS = aSeed;
      }`;
const SWIRL_FS = /* glsl */ `
      varying float vA; varying float vS;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); a *= a;
        vec3 c = mix(vec3(0.1, 0.9, 1.4), vec3(0.9, 0.35, 1.6), step(0.5, vS));
        gl_FragColor = vec4(c * a * vA * 2.2, 1.0); }`;

export interface Portal extends Unit {
  /** Current charge 0..1 — the value the portal shaders read (uCharge). */
  readonly charge: number;
}

export function createPortal({ scene, uTime, uPixelRatio, quality }: SceneContext, kit: GeometryKit): Portal {
  const rng = rngFor("portal");
  const R = rng.range;
  const portal = new THREE.Group();
  portal.position.set(...PORTAL_POS);
  scene.add(portal);
  const uCharge = { value: 0 };
  const shared = { uTime, uCharge };

  portal.add(new THREE.Mesh(new THREE.TorusGeometry(7, 0.3, 24, 260), new THREE.ShaderMaterial({ uniforms: shared, vertexShader: RING_VS, fragmentShader: RING_FS })));
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(7.85, 0.5, 6, 48),
    withRim(new THREE.MeshStandardMaterial({ color: 0x1b1330, metalness: 0.8, roughness: 0.35, flatShading: true, envMapIntensity: 1.2 }), new THREE.Color(0.5, 0.3, 1.2), 2.4, 0.8),
  );
  frame.position.z = -0.45;
  portal.add(frame);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(7.05, 128), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: shared, vertexShader: DISC_VS, fragmentShader: DISC_FS }));
  disc.position.z = -0.05;
  portal.add(disc);

  // Gyroscope arcs (prototype 1271–1277)
  const arcMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.2, 1.9), fog: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const arcMaterial2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 0.35, 1.9), fog: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const arcs = [
    new THREE.Mesh(new THREE.TorusGeometry(9.6, 0.05, 6, 200, Math.PI * 1.25), arcMaterial),
    new THREE.Mesh(new THREE.TorusGeometry(10.6, 0.035, 6, 200, Math.PI * 0.8), arcMaterial2),
    new THREE.Mesh(new THREE.TorusGeometry(12.2, 0.025, 6, 200, Math.PI * 0.5), arcMaterial),
  ] as const;
  portal.add(...arcs);

  // Orbiting shards (prototype 1279–1285)
  const shards = new THREE.InstancedMesh(
    blobGeometry(0, 0.3, 31),
    withRim(new THREE.MeshStandardMaterial({ color: 0x3a2b5c, flatShading: true, roughness: 0.6, metalness: 0.3 }), new THREE.Color(0.6, 0.35, 1.3), 2.2, 0.9),
    22,
  );
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + R(-0.08, 0.08);
    const r = R(9.2, 11.8);
    shards.setMatrixAt(i, composeMatrix(Math.cos(a) * r, Math.sin(a) * r, R(-1.5, 1.5), R(0, 6), R(0, 6), a, R(0.25, 0.7), R(0.5, 1.2), R(0.25, 0.6)));
  }
  const shardGroup = new THREE.Group();
  shardGroup.add(shards);
  portal.add(shardGroup);

  // Swirling particles (prototype 1287–1315) — count follows the tier.
  const N = Math.round(1800 * quality.particleScale);
  const ang = new Float32Array(N);
  const seed = new Float32Array(N);
  const sp = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    ang[i] = R(0, Math.PI * 2);
    seed[i] = rng.next();
    sp[i] = R(0.05, 0.14);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  pg.setAttribute("aAng", new THREE.BufferAttribute(ang, 1));
  pg.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  pg.setAttribute("aSp", new THREE.BufferAttribute(sp, 1));
  const swirl = new THREE.Points(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...shared, uPR: uPixelRatio }, vertexShader: SWIRL_VS, fragmentShader: SWIRL_FS }));
  swirl.frustumCulled = false;
  portal.add(swirl, kit.glowSprite(new THREE.Color(0.5, 0.25, 1.2), 22, 0.14));
  const light = addPointLight(scene, 0x9d5cff, 220, 60, 1.6, [PORTAL_POS[0], PORTAL_POS[1], PORTAL_POS[2] + 3]);

  return {
    get charge() {
      return uCharge.value;
    },
    // Charge + slow sway / arc spin (prototype 1630–1637)
    update(frame, vis) {
      light.setOn(vis.portal);
      portal.visible = vis.portal;
      uCharge.value = portalCharge(frame.p); // kept current while hidden too (cheap; read by the dev stats)
      if (!vis.portal) return;
      const { t, bob } = frame;
      portal.rotation.z = Math.sin(t * 0.2) * 0.04 * bob;
      arcs[0].rotation.set(0.32 + Math.sin(t * 0.3) * 0.08, 0.18, t * 0.3);
      arcs[1].rotation.set(-0.28, 0.4 + Math.sin(t * 0.25) * 0.08, -t * 0.2);
      arcs[2].rotation.set(0.12, -0.3, t * 0.12);
      shardGroup.rotation.z = t * 0.05;
    },
  };
}
