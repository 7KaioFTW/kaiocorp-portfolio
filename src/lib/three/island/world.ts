// src/lib/three/island/world.ts
import * as THREE from "three";
import { createCameraRig, type CameraSample } from "./cameraPath";
import { cloudVeil, deepness, visibilityAt } from "./chapters";
import { createClouds } from "./clouds";
import { createCrystals, type Crystals } from "./crystals";
import { DisposeBag, disposeGraph } from "./dispose";
import { createGeometryKit, type GeometryKit } from "./geometry";
import { createLights } from "./lights";
import { createMapRing } from "./mapRing";
import { clamp, damp, lerp } from "./math";
import { createParticles } from "./particles";
import { createPillars } from "./pillars";
import { createPortal, type Portal } from "./portal";
import { createPost, type Post } from "./post";
import { decidePerf, PERF_WINDOW, type QualitySettings, type RenderScale } from "./quality";
import { createSky } from "./sky";
import { createMainIsland, type MainIsland } from "./terrain";
import type { FrameState, RingMapInfo, SceneContext, Unit } from "./types";
import { createVegetation } from "./vegetation";
import { createWater } from "./water";

// The 3D world (spec §3.1): renderer, scene, camera journey, atmosphere, adaptive quality and the
// frame update — prototype sections 1, 13–16 minus the DOM/UI (IslandJourney owns the page side).

export interface WorldCallbacks {
  /** The first frame is on screen — the host crossfades the poster out. */
  onFirstFrame(): void;
  /** The ring screen facing the camera changed (low frequency). */
  onFocusChange(index: number): void;
  /** Pillar rise 0..1 per stat; only called when a value changed. */
  onStatsReveal(reveal: readonly number[]): void;
  /** Still < 20 fps at the lowest render scale — the host should fall back to the poster. */
  onGiveUp(): void;
}

export interface WorldOptions extends WorldCallbacks {
  gl: WebGL2RenderingContext;
  quality: QualitySettings;
  maps: readonly RingMapInfo[];
  /** Localised "min played" unit for the screen labels. */
  minutesUnit: string;
  /**
   * 3D opted in under prefers-reduced-motion: no intro swoop, no bobbing, no speed kick, no grain, and the
   * ambient clock is frozen (no shader / idle animation) — the scene moves only with the scroll (spec §6).
   */
  reducedMotion: boolean;
  width: number;
  height: number;
  /** Progress at start (deep link / reload mid-page): the camera starts there, no fly-through. */
  startProgress: number;
}

export interface WorldStats {
  p: number;
  dpr: number;
  msaa: number;
  frames: number;
  introDone: boolean;
  tier: QualitySettings["tier"];
  /** Speed FOV kick this frame (degrees); 0 under reduced motion. */
  kick: number;
  /** Camera roll this frame (radians), idle bobbing included (none under reduced motion). */
  roll: number;
  /** Portal charge 0..1, as the portal shaders see it. */
  charge: number;
}

export interface World {
  update(targetProgress: number, rawDt: number): void;
  setSize(width: number, height: number): void;
  /** Mouse position in [-1, 1]² (y up). */
  setPointer(x: number, y: number): void;
  dispose(): void;
  readonly stats: Readonly<WorldStats>;
}

const FOG_TOP = new THREE.Color(0.15, 0.11, 0.4);
const FOG_DEEP = new THREE.Color(0.035, 0.018, 0.085);
const INTRO_SECONDS = 3.4;
const INTRO_OFFSET = new THREE.Vector3(-26, 22, 46);
const GRAIN = 0.032;
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
/** Longest wait for the shader programs (spec §5: bounded loops); past it they finish compiling on first use. */
const COMPILE_TIMEOUT_MS = 10000;

interface ProgramState {
  currentProgram?: { isReady(): boolean };
}

/**
 * renderer.compileAsync, bounded: compile every program, then wait until each one reports ready (polling every
 * 10 ms, as three does), but stop as soon as `cancelled()` (dispose, lost context) or after COMPILE_TIMEOUT_MS.
 * three's own wait has no exit: a program that never reports ready keeps it polling forever.
 */
async function compilePrograms(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, cancelled: () => boolean): Promise<void> {
  const pending = renderer.compile(scene, camera);
  const deadline = performance.now() + COMPILE_TIMEOUT_MS;
  while (pending.size > 0 && !cancelled() && performance.now() < deadline) {
    for (const material of pending) {
      const program = (renderer.properties.get(material) as ProgramState).currentProgram;
      if (!program || program.isReady()) pending.delete(material);
    }
    if (pending.size > 0) await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
}

/** Units the world reads back after the build (dev stats). */
interface BuiltUnits {
  portal?: Portal;
}

/**
 * Scene units in build order; the world yields to the main thread before each entry (short tasks) and
 * awaits an entry that returns a promise. The main island also yields inside its own build (F1).
 */
function sceneBuilders(ctx: SceneContext, opts: WorldOptions, units: Unit[], built: BuiltUnits): Array<() => void | Promise<void>> {
  let kit!: GeometryKit;
  let island!: MainIsland;
  let crystals!: Crystals;
  return [
    async () => {
      kit = createGeometryKit(ctx);
      island = await createMainIsland(ctx, yieldToMain);
      units.push(island);
    },
    () => createWater(ctx, island),
    () => createVegetation(ctx, island),
    () => {
      crystals = createCrystals(ctx, island, kit);
      units.push(crystals);
    },
    () => units.push(createClouds(ctx, island.coreY)),
    () => createParticles(ctx),
    () => units.push(createMapRing(ctx, { maps: opts.maps, minutesUnit: opts.minutesUnit, onFocusChange: opts.onFocusChange })),
    () =>
      units.push(
        createPillars(ctx, { kit, islandMaterial: island.material, debrisGeometry: crystals.debrisGeometry, debrisMaterial: crystals.debrisMaterial }, opts.onStatsReveal),
      ),
    () => {
      built.portal = createPortal(ctx, kit);
      units.push(built.portal);
    },
  ];
}

export async function createWorld(canvas: HTMLCanvasElement, opts: WorldOptions, signal: AbortSignal): Promise<World | null> {
  const bag = new DisposeBag();
  const renderer = new THREE.WebGLRenderer({ canvas, context: opts.gl, antialias: false, powerPreference: "high-performance", stencil: false });
  let scale: RenderScale = { dpr: opts.quality.dpr, msaa: opts.quality.msaa };
  let width = opts.width;
  let height = opts.height;
  renderer.setPixelRatio(scale.dpr);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(FOG_TOP.clone(), 0.0092);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 900);
  camera.position.set(0, 4.5, 34);

  const ctx: SceneContext = { scene, renderer, bag, uTime: { value: 0 }, uPixelRatio: { value: scale.dpr }, quality: opts.quality };
  // Scene graph, then the bag (PMREM environment, post render target + composer + every pass), then the context
  // — unless it is already lost (webglcontextlost → give-up): forcing it again only makes three warn.
  const release = () => {
    disposeGraph(scene);
    bag.dispose();
    renderer.dispose();
    if (!opts.gl.isContextLost()) renderer.forceContextLoss();
  };

  // A context lost mid-build (e.g. a GPU reset) ends the build like an abort: the host falls back to the poster.
  const cancelled = () => signal.aborted || opts.gl.isContextLost();
  const units: Unit[] = [];
  const built: BuiltUnits = {};
  let sky: ReturnType<typeof createSky>;
  let lights: ReturnType<typeof createLights>;
  let post: Post;
  try {
    sky = createSky(ctx);
    lights = createLights(ctx);
    for (const build of sceneBuilders(ctx, opts, units, built)) {
      await yieldToMain();
      if (cancelled()) {
        release();
        return null;
      }
      await build();
    }
    for (const unit of units) unit.resize?.(width, height); // initial layout (e.g. portrait pillars)
    post = createPost(
      renderer,
      scene,
      camera,
      {
        width,
        height,
        dpr: scale.dpr,
        msaa: scale.msaa,
        bloomScale: opts.quality.bloomScale,
        grain: opts.reducedMotion ? 0 : GRAIN,
      },
      bag,
    );
    if (cancelled()) {
      release();
      return null;
    }
    // Every program up front → no stutter on first scroll. Programs are keyed on the render target (tone
    // mapping + output colour space), and the scene is always drawn into the composer's target: compile
    // into a target too, or each program is built twice and units first seen mid-scroll compile then.
    const warmTarget = new THREE.WebGLRenderTarget(1, 1);
    renderer.setRenderTarget(warmTarget);
    try {
      await compilePrograms(renderer, scene, camera, cancelled);
    } catch {
      // Older drivers: shaders compile lazily on first render.
    }
    renderer.setRenderTarget(null);
    warmTarget.dispose();
  } catch (error) {
    release();
    throw error;
  }
  if (cancelled()) {
    release();
    return null;
  }
  const fx: Post = post;

  const rig = createCameraRig();
  const cam: CameraSample = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 38, sx: 0, sy: 0, roll: 0, md: 1 };
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const perf = { skip: 30, n: 0, sum: 0, done: false };
  let t = 0;
  let pSmooth = clamp(opts.startProgress);
  let speed = 0;
  // The intro swoop only plays from the hero, never under reduced motion.
  let introT = opts.reducedMotion || pSmooth > 0.14 ? 1 : 0;
  let firstFrame = true;
  let disposed = false;
  const stats: WorldStats = { p: pSmooth, dpr: scale.dpr, msaa: scale.msaa, frames: 0, introDone: introT >= 1, tier: opts.quality.tier, kick: 0, roll: 0, charge: 0 };
  const frame: FrameState = { t: 0, dt: 0, p: pSmooth, camera, portrait: width / height < 0.9, bob: opts.reducedMotion ? 0 : 1 };

  function setSize(w: number, h: number) {
    if (disposed || w <= 0 || h <= 0) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    fx.setSize(w, h);
    camera.aspect = w / h;
    frame.portrait = w / h < 0.9;
    for (const unit of units) unit.resize?.(w, h);
  }

  function applyScale(next: RenderScale) {
    scale = next;
    renderer.setPixelRatio(next.dpr);
    ctx.uPixelRatio.value = next.dpr;
    fx.setScale(next.dpr, next.msaa);
    setSize(width, height);
    stats.dpr = next.dpr;
    stats.msaa = next.msaa;
  }

  function measurePerf(rawDt: number) {
    if (perf.done || introT < 1 || document.visibilityState !== "visible") return;
    if (rawDt <= 0 || rawDt > 0.5) return; // tab switch / long stall: not a rendering sample
    if (perf.skip > 0) {
      perf.skip--; // warm-up after start or after a re-allocation
      return;
    }
    perf.n++;
    perf.sum += rawDt;
    if (perf.n < PERF_WINDOW) return;
    const decision = decidePerf(perf.n / perf.sum, scale);
    perf.n = 0;
    perf.sum = 0;
    if (decision.kind === "keep") perf.done = true;
    else if (decision.kind === "giveUp") {
      perf.done = true;
      opts.onGiveUp();
    } else {
      applyScale(decision.next);
      perf.skip = 30;
    }
  }

  function update(targetProgress: number, rawDt: number) {
    if (disposed) return;
    const dt = Math.min(Math.max(rawDt, 0), 1 / 20); // simulation step only — perf uses rawDt
    if (!opts.reducedMotion) t += dt; // ambient clock (shaders, idle motion): frozen under reduced motion
    ctx.uTime.value = t;
    fx.setTime(t);
    if (introT < 1) introT = Math.min(1, introT + dt / INTRO_SECONDS);

    // scroll progress → camera (prototype 1517–1547)
    const pPrev = pSmooth;
    pSmooth = damp(pSmooth, clamp(targetProgress), 4.2, dt);
    const p = pSmooth;
    speed = damp(speed, Math.min(Math.abs(p - pPrev) / Math.max(dt, 1e-3), 0.5), 6, dt);
    const aspect = width / height;
    rig.sample(p, frame.portrait, cam);
    let fov = cam.fov;
    pos.copy(cam.pos);
    look.copy(cam.look);
    if (aspect < 1) {
      // portrait framing: pull back a bit, widen the lens
      const k = 1 + (1 / aspect - 1) * 0.32 * cam.md;
      pos.sub(look).multiplyScalar(k).add(look);
      fov = Math.min(fov * (1 + (1 / aspect - 1) * 0.3), 72);
    }
    const ie = 1 - Math.pow(1 - introT, 4);
    if (ie < 1) {
      pos.addScaledVector(INTRO_OFFSET, 1 - ie);
      look.y += 6 * (1 - ie);
      fov += 10 * (1 - ie);
    }
    mouse.sx = damp(mouse.sx, mouse.x, 2.5, dt);
    mouse.sy = damp(mouse.sy, mouse.y, 2.5, dt);
    camera.position.copy(pos);
    camera.lookAt(look);
    camera.translateX(mouse.sx * 0.9);
    camera.translateY(mouse.sy * 0.55);
    camera.lookAt(look);
    const roll = cam.roll + Math.sin(t * 0.4) * 0.004 * frame.bob;
    camera.rotateZ(roll);
    const kick = opts.reducedMotion ? 0 : Math.min(speed * 55, 9);
    camera.fov = fov + kick;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    fx.setAberration(0.01 + (opts.reducedMotion ? 0 : Math.min(speed * 0.35, 0.05)));
    camera.projectionMatrix.elements[8] = -cam.sx;
    camera.projectionMatrix.elements[9] = -cam.sy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    // atmosphere: above / inside / below the cloud sea (prototype 1549–1561)
    const cy = camera.position.y;
    const deep = deepness(cy);
    sky.setDeep(deep);
    fog.color.copy(FOG_TOP).lerp(FOG_DEEP, deep);
    fog.density = lerp(0.0092, 0.0165, deep);
    fx.setVeil(cloudVeil(cy, Math.hypot(camera.position.x, camera.position.z)));
    lights.setDeep(deep);
    scene.environmentIntensity = lerp(0.55, 0.25, deep);

    frame.t = t;
    frame.dt = dt;
    frame.p = p;
    const vis = visibilityAt(p, cy);
    for (const unit of units) unit.update?.(frame, vis);

    measurePerf(rawDt);
    if (disposed) return; // onGiveUp may have torn us down synchronously
    fx.render(dt);
    stats.p = p;
    stats.frames++;
    stats.introDone = introT >= 1;
    stats.kick = kick;
    stats.roll = roll;
    stats.charge = built.portal?.charge ?? 0;
    if (firstFrame) {
      firstFrame = false;
      opts.onFirstFrame();
    }
  }

  return {
    update,
    setSize,
    setPointer(x, y) {
      mouse.x = x;
      mouse.y = y;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      release();
    },
    stats,
  };
}
