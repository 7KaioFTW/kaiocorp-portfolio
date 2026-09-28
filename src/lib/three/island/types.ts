// src/lib/three/island/types.ts
import type * as THREE from "three";
import type { Visibility } from "./chapters";
import type { DisposeBag } from "./dispose";
import type { QualitySettings } from "./quality";

/** One map screen of the ring chapter (built from maps.json by src/content/realisations.ts). */
export interface RingMapInfo {
  id: string;
  title: string;
  creator: string;
  /** maps.json `stats.minutesPlayed`, e.g. "1.6B". */
  minutes: string;
  /** One of the map's maps.json tags. */
  tag: string;
  /** maps.json `thumbnail`, e.g. "/images/maps/the-box.jpg". */
  thumbnail: string;
}

/** Shared by every scene module while the world is built. */
export interface SceneContext {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  /** Non-graph resources (render targets, env map, loads). Graph resources are released by disposeGraph. */
  bag: DisposeBag;
  /** Shared shader clock (seconds). */
  uTime: THREE.IUniform<number>;
  /** Current device-pixel ratio, for point sizes. */
  uPixelRatio: THREE.IUniform<number>;
  quality: QualitySettings;
}

/** Per-frame state handed to every unit after the camera has been placed. */
export interface FrameState {
  /** Ambient clock (seconds) for shaders and idle motion; frozen under reduced motion. */
  t: number;
  /** Simulation step, clamped to ≤ 1/20 s. */
  dt: number;
  /** Smoothed camera progress. */
  p: number;
  camera: THREE.PerspectiveCamera;
  portrait: boolean;
  /** Idle-motion factor (bobbing, idle spins): 1, or 0 under reduced motion. */
  bob: number;
}

/** A scene module's per-frame / resize hooks. */
export interface Unit {
  update?(frame: FrameState, vis: Visibility): void;
  resize?(width: number, height: number): void;
}
