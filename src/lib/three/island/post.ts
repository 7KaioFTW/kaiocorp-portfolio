// src/lib/three/island/post.ts
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { DisposeBag } from "./dispose";
import { GLSL_NOISE } from "./noise";

// Post-processing (prototype lines 1366–1394): MSAA half-float target → bloom → output → grade
// (chromatic aberration, cloud veil, vignette, grain). Changes: MSAA samples and bloom resolution
// follow the render scale; grain is a uniform (0 under reduced motion). The render target, every pass
// and the composer are registered in the world's DisposeBag, which releases them (no dispose() here).

export interface PostOptions {
  width: number;
  height: number;
  dpr: number;
  msaa: number;
  /** Bloom resolution relative to the drawing buffer (0.5 on the medium tier). */
  bloomScale: number;
  grain: number;
}

export interface Post {
  render(dt: number): void;
  setSize(width: number, height: number): void;
  /** Adaptive step-down: new DPR + MSAA samples (render targets are re-allocated). */
  setScale(dpr: number, msaa: number): void;
  setTime(t: number): void;
  setVeil(value: number): void;
  setAberration(value: number): void;
}

const GRADE_VERTEX = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const GRADE_FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse; uniform float uTime, uVeil, uAb, uAspect, uGrain; uniform vec2 uRes; varying vec2 vUv;
  ${GLSL_NOISE}
  void main(){
    vec2 c = vUv - 0.5; float r2 = dot(c, c);
    vec2 off = c * r2 * uAb;
    vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
    float n = fbm(vec2(vUv.x * uAspect, vUv.y) * 2.6 + vec2(uTime * 0.04, -uTime * 0.16));
    float veil = clamp(uVeil * (0.7 + 0.6 * n), 0.0, 1.0);
    vec3 vc = mix(vec3(0.62, 0.52, 0.86), vec3(0.97, 0.88, 0.96), smoothstep(0.3, 0.8, n));
    col = mix(col, vc, veil);
    col *= mix(1.0, smoothstep(1.05, 0.28, length(c * vec2(1.0, 0.9))), 0.55);
    col += (hash12(vUv * uRes + fract(uTime * 7.0) * 311.0) - 0.5) * uGrain;
    gl_FragColor = vec4(col, 1.0);
  }`;

export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, o: PostOptions, bag: DisposeBag): Post {
  let { width, height, dpr } = o;
  const target = bag.add(new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: o.msaa }));
  const composer = new EffectComposer(renderer, target); // renderer already has pixelRatio = dpr
  composer.addPass(bag.add(new RenderPass(scene, camera)));
  const bloom = bag.add(new UnrealBloomPass(new THREE.Vector2(width, height), 0.75, 0.5, 0.9));
  bag.add(bloom.materialHighPassFilter); // three r170's UnrealBloomPass.dispose() forgets this one (its program leaked)
  composer.addPass(bloom);
  composer.addPass(bag.add(new OutputPass()));
  const grade = bag.add(
    new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uVeil: { value: 0 },
        uAb: { value: 0.012 },
        uAspect: { value: width / height },
        uRes: { value: new THREE.Vector2(width, height) },
        uGrain: { value: o.grain },
      },
      vertexShader: GRADE_VERTEX,
      fragmentShader: GRADE_FRAGMENT,
    }),
  );
  composer.addPass(grade);
  bag.add(composer); // renderTarget1 (= target), its renderTarget2 clone and the internal copy pass
  const u = grade.uniforms; // ShaderPass cloned the uniforms: always write through grade.uniforms

  const setSize = (w: number, h: number) => {
    width = w;
    height = h;
    composer.setSize(w, h);
    bloom.setSize(w * dpr * o.bloomScale, h * dpr * o.bloomScale);
    u.uAspect.value = w / h;
    (u.uRes.value as THREE.Vector2).set(w * dpr, h * dpr);
  };
  setSize(width, height);

  return {
    render: (dt) => composer.render(dt),
    setSize,
    setScale(nextDpr, msaa) {
      dpr = nextDpr;
      composer.setPixelRatio(nextDpr);
      for (const rt of [composer.renderTarget1, composer.renderTarget2]) {
        if (rt.samples === msaa) continue;
        rt.samples = msaa;
        rt.dispose(); // re-allocated with the new sample count on next use
      }
      setSize(width, height);
    },
    setTime(t) {
      u.uTime.value = t;
    },
    setVeil(value) {
      u.uVeil.value = value;
    },
    setAberration(value) {
      u.uAb.value = value;
    },
  };
}
