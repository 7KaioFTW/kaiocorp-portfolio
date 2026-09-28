// src/lib/three/island/lights.ts
import * as THREE from "three";
import { lerp } from "./math";
import type { SceneContext } from "./types";

// Lights (prototype lines 392–412). Point lights are created through addPointLight(): they live at
// the scene root and are dimmed to 0 instead of hidden, so the light count — and therefore every
// compiled shader program — never changes after compileAsync (no recompile stutter on first scroll).

export interface Lights {
  /** 0 above the cloud sea → 1 below (key + hemi dim, prototype 1559–1560). */
  setDeep(deep: number): void;
}

export function createLights({ scene }: SceneContext): Lights {
  const hemi = new THREE.HemisphereLight(0x9b86ff, 0x241640, 0.55);
  const key = new THREE.DirectionalLight(0xffc7b4, 2.3);
  key.position.set(-26, 34, 26);
  const rim = new THREE.DirectionalLight(0x57e2ff, 1.9);
  rim.position.set(22, 10, -40);
  const rim2 = new THREE.DirectionalLight(0xc462ff, 1.6);
  rim2.position.set(-36, -4, -18);
  const bounce = new THREE.DirectionalLight(0xb35cff, 1.1);
  bounce.position.set(4, -30, 12);
  scene.add(hemi, key, rim, rim2, bounce);
  return {
    setDeep(deep) {
      hemi.intensity = lerp(0.55, 0.3, deep);
      key.intensity = lerp(2.3, 0.6, deep);
    },
  };
}

export interface PointLightHandle {
  setOn(on: boolean): void;
  /** Intensity as a fraction 0..1 of the nominal one (fades). */
  setLevel(level: number): void;
}

export function addPointLight(scene: THREE.Scene, color: THREE.ColorRepresentation, intensity: number, distance: number, decay: number, position: readonly [number, number, number]): PointLightHandle {
  const light = new THREE.PointLight(color, intensity, distance, decay);
  light.position.set(position[0], position[1], position[2]);
  scene.add(light);
  return {
    setOn(on) {
      light.intensity = on ? intensity : 0;
    },
    setLevel(level) {
      light.intensity = intensity * level;
    },
  };
}

/** Fresnel rim injected into a standard material so silhouettes read against the sky (prototype 403–412). */
export function withRim<T extends THREE.MeshStandardMaterial>(material: T, color = new THREE.Color(0.32, 0.5, 1.0), power = 3.2, strength = 0.55): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRimC = { value: color };
    shader.uniforms.uRimP = { value: power };
    shader.uniforms.uRimS = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uRimC; uniform float uRimP; uniform float uRimS;")
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n{ float rf = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), uRimP); totalEmissiveRadiance += uRimC * rf * uRimS; }",
      );
  };
  material.customProgramCacheKey = () => `rim${power}${strength}`;
  return material;
}
