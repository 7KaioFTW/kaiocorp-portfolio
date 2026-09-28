// src/lib/three/island/sky.ts
import * as THREE from "three";
import type { SceneContext } from "./types";

// Sky dome (stars, horizon band, deep mode below the cloud sea) + image-based lighting from it.
const SUN_DIR = new THREE.Vector3(0.3, 0.045, -1).normalize();

const SKY_VERTEX = /* glsl */ `
      varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;

const SKY_FRAGMENT = /* glsl */ `
      uniform float uTime; uniform float uDeep; uniform vec3 uSun; varying vec3 vDir;
      float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        vec3 d = normalize(vDir); float h = d.y;
        vec3 zenith = vec3(0.004, 0.003, 0.024);
        vec3 upper  = vec3(0.028, 0.009, 0.11);
        vec3 mid    = vec3(0.105, 0.024, 0.31);
        vec3 low    = vec3(0.18, 0.06, 0.46);
        vec3 horiz  = vec3(0.02, 0.40, 0.70);
        vec3 c = mix(horiz, low, smoothstep(0.0, 0.085, h));
        c = mix(c, mid, smoothstep(0.06, 0.22, h));
        c = mix(c, upper, smoothstep(0.18, 0.5, h));
        c = mix(c, zenith, smoothstep(0.45, 0.95, h));
        float band = exp(-abs(h - 0.004) * 32.0);
        c += vec3(0.05, 0.42, 0.72) * band * 0.45;
        float s = max(dot(d, uSun), 0.0);
        c += vec3(0.7, 0.14, 0.48) * pow(s, 10.0) * 0.24;
        c += vec3(0.9, 0.5, 0.75) * pow(s, 70.0) * 0.3;
        // under the horizon: into the violet abyss
        vec3 under = mix(vec3(0.15, 0.11, 0.4), vec3(0.012, 0.006, 0.035), smoothstep(-0.02, -0.5, h));
        c = mix(c, under, smoothstep(0.0, -0.06, h));
        // stars
        vec3 p = d * 240.0; vec3 cell = floor(p); float r = h3(cell);
        float st = smoothstep(0.3, 0.0, length(fract(p) - 0.5)) * step(0.9935, r);
        st *= (0.55 + 0.45 * sin(uTime * (1.5 + r * 3.0) + r * 60.0)) * smoothstep(0.1, 0.45, h);
        c += vec3(0.85, 0.9, 1.0) * st * 1.6;
        // deep mode (below the cloud sea)
        vec3 deep = mix(vec3(0.05, 0.02, 0.13), vec3(0.008, 0.004, 0.022), smoothstep(0.1, -0.7, h));
        deep += vec3(0.03, 0.14, 0.24) * exp(-abs(h) * 9.0) * 0.55;
        deep += vec3(0.16, 0.05, 0.34) * smoothstep(0.05, 0.8, h) * 0.8;
        c = mix(c, deep, uDeep);
        gl_FragColor = vec4(c, 1.0);
      }`;

function skyMaterial(uTime: THREE.IUniform<number>): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { uTime, uDeep: { value: 0 }, uSun: { value: SUN_DIR } },
    vertexShader: SKY_VERTEX,
    fragmentShader: SKY_FRAGMENT,
  });
}

export interface Sky {
  /** 0 above the cloud sea → 1 below it. */
  setDeep(value: number): void;
}

export function createSky({ scene, renderer, bag, uTime }: SceneContext): Sky {
  const material = skyMaterial(uTime);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 32), material);
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  scene.add(dome);

  // One-off PMREM environment rendered from our own sky (prototype 382–390).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envDome = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMaterial(uTime));
  envScene.add(envDome);
  const envTarget = bag.add(pmrem.fromScene(envScene, 0.04, 0.1, 200));
  scene.environment = envTarget.texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();
  envDome.geometry.dispose();
  envDome.material.dispose();

  return {
    setDeep(value) {
      material.uniforms.uDeep.value = value;
    },
  };
}
