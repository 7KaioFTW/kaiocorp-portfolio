import * as THREE from "three";
import type { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

/** Fractal noise over a seeded SimplexNoise (prototype line 275). */
export function fbm(nz: SimplexNoise, x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * nz.noise(x * freq, y * freq);
    freq *= 2.03;
    amp *= 0.5;
  }
  return sum;
}

/** Value-noise helpers shared by the shaders (prototype lines 280–285, verbatim). */
export const GLSL_NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
`;

/** Fog for additive shaders: fades `outC` to black with the scene fog (prototype lines 286–295, verbatim). */
export const GLSL_FOG_ADD = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  outC *= 1.0 - fogF;
#endif
`;

/** Fresh fog uniforms + `extra` (kept by reference, so shared uniforms like uTime stay shared). */
export function fogUniforms(extra: Record<string, THREE.IUniform> = {}): Record<string, THREE.IUniform> {
  return Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), extra);
}
