"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MutableRefObject } from "react";
import { flushSync } from "react-dom";
import { afterLoadIdle } from "@/lib/motion/idle";
import { countUpText } from "@/lib/three/island/countUp";
import { buildAnchors, progressAt, scrollForProgress, type Anchor, type ChapterBoxes } from "@/lib/three/island/progress";
import { readSignals, selectTier, settingsFor, type Preference } from "@/lib/three/island/quality";
import { islandStore, readPreference, safeStorage, type IslandStatus } from "@/lib/three/island/store";
import type { RingMapInfo } from "@/lib/three/island/types";
import type { World } from "@/lib/three/island/world";

// Mounts the 3D journey behind the homepage (spec §3.1): decides the tier, measures the chapters,
// lazy-loads the world after load + idle, drives it from the scroll position, and disposes it on
// unmount or when the visitor switches the 3D off. Only three-free modules are imported statically.

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

interface IslandJourneyProps {
  maps: RingMapInfo[];
  minutesUnit: string;
}

type AnchorsRef = MutableRefObject<Anchor[]>;

const subscribe = islandStore.subscribe;
const getPref = () => islandStore.get().pref;
const getServerPref = (): Preference => "auto";
const getActive = () => islandStore.get().status !== "off";
const getServerActive = () => true;
const getRestarts = () => islandStore.get().restarts;
const getServerRestarts = () => 0;

function setStatus(status: IslandStatus): void {
  document.documentElement.dataset.island = status;
  islandStore.set({ status });
}

function contextAttributes(pref: Preference): WebGLContextAttributes {
  return {
    alpha: false,
    antialias: false,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
    // Software-only GL (no GPU) counts as "no WebGL" unless the visitor explicitly asked for 3D.
    failIfMajorPerformanceCaveat: pref !== "on",
  };
}

/**
 * getContext("webgl2") returned null: is WebGL2 missing, or was a software-only GL refused by
 * failIfMajorPerformanceCaveat? Only the former hides the toggle; the latter can still be opted into.
 */
function webgl2Missing(pref: Preference): boolean {
  if (!contextAttributes(pref).failIfMajorPerformanceCaveat) return true;
  const probe = document.createElement("canvas").getContext("webgl2");
  probe?.getExtension("WEBGL_lose_context")?.loseContext();
  return !probe;
}

interface Measured {
  boxes: ChapterBoxes;
  stages: [HTMLElement, number][];
}

function measureChapters(): Measured | null {
  const chapter = (name: string) => document.querySelector<HTMLElement>(`[data-island-chapter="${name}"]`);
  const hero = chapter("hero");
  const ring = chapter("ring");
  const stats = chapter("stats");
  const cta = chapter("cta");
  if (!hero || !ring || !stats || !cta) return null;
  const ringStage = ring.querySelector<HTMLElement>(".island-stage");
  const statsStage = stats.querySelector<HTMLElement>(".island-stage");
  const viewport = document.documentElement.clientHeight;
  const scrollY = window.scrollY;
  const top = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY;
  const boxes: ChapterBoxes = {
    viewport,
    maxScroll: Math.max(0, document.documentElement.scrollHeight - viewport),
    heroBottom: top(hero) + hero.offsetHeight,
    ringTop: top(ring),
    ringHeight: ring.offsetHeight,
    ringStage: ringStage?.offsetHeight ?? viewport,
    statsTop: top(stats),
    statsHeight: stats.offsetHeight,
    statsStage: statsStage?.offsetHeight ?? viewport,
    ctaTop: top(cta),
    ctaHeight: cta.offsetHeight,
  };
  const stages: [HTMLElement, number][] = [];
  if (ringStage) stages.push([ringStage, boxes.ringStage]);
  if (statsStage) stages.push([statsStage, boxes.statsStage]);
  return { boxes, stages };
}

/** A stage taller than the viewport pins by its bottom (top < 0) so all of it stays reachable. */
function applyStageTops(stages: [HTMLElement, number][], viewport: number): void {
  for (const [el, height] of stages) el.style.setProperty("--island-stage-top", `${Math.min(0, viewport - height)}px`);
}

function clearStageTops(): void {
  document.querySelectorAll<HTMLElement>(".island-stage").forEach((el) => el.style.removeProperty("--island-stage-top"));
}

/** Where the reader is: the child of <main> under the viewport's top edge (its sticky stage when the edge
 *  falls inside it) and that element's offset from the viewport top. */
interface ReadingPosition {
  section: HTMLElement;
  anchor: HTMLElement;
  offset: number;
}

function readingPosition(): ReadingPosition | null {
  const main = document.querySelector("main");
  if (!main) return null;
  for (const child of Array.from(main.children)) {
    if (!(child instanceof HTMLElement) || getComputedStyle(child).position === "fixed") continue; // the 3D layer
    const box = child.getBoundingClientRect();
    if (box.top > 0 || box.bottom <= 0) continue;
    const stage = child.querySelector<HTMLElement>(".island-stage");
    const stageBox = stage?.getBoundingClientRect();
    if (stage && stageBox && stageBox.top <= 0 && stageBox.bottom > 0) return { section: child, anchor: stage, offset: stageBox.top };
    return { section: child, anchor: child, offset: box.top };
  }
  return null;
}

/**
 * After the sticky chapters collapsed: scroll so the anchor is back at its viewport offset, without leaving
 * its section (a collapsed chapter shorter than the old offset shows its end instead). The browser's own
 * scroll anchoring doesn't: a position/min-height change on the anchor's ancestors suppresses it, and none
 * was measured for a reader below the chapters either (the page just got 2–3.5 viewports shorter).
 */
function restoreReadingPosition(at: ReadingPosition): void {
  const scrollY = window.scrollY;
  const section = at.section.getBoundingClientRect();
  const sectionTop = section.top + scrollY;
  const sectionBottom = section.bottom + scrollY;
  let target = at.anchor.getBoundingClientRect().top + scrollY - at.offset;
  if (target >= sectionBottom) target = Math.max(sectionTop, sectionBottom - document.documentElement.clientHeight);
  // Round up: the scroll offset is whole pixels, and rounding down could leave the section a fraction of a
  // pixel below the top edge (the section above would then be the one "under" it).
  const top = Math.ceil(target);
  if (Math.abs(top - scrollY) < 1) return;
  window.scrollTo({ top, behavior: "instant" });
  // The motion engine's Lenis (when loaded) jumps there too: a smooth wheel scroll in flight would put the
  // old position back on its next frame.
  window.dispatchEvent(new CustomEvent("motion:scroll-to", { detail: { top } }));
}

/**
 * The 3D can't go on (slow-GPU give-up, lost WebGL context): stop rendering now, then fall back to the
 * poster / static flow with the reader kept in place — the switch collapses the sticky chapters (≈ 2–3.5
 * viewport heights) under a reader who may be mid-page (spec §1.3: the page stays usable).
 */
function fallBackToPoster(stop: () => void): void {
  stop();
  const reading = readingPosition();
  // Commit every subscriber (the focus card unmounts, the ring list re-lays out) before measuring again.
  flushSync(() => setStatus("off"));
  if (reading) restoreReadingPosition(reading);
}

interface StatsBinding {
  write(reveal: readonly number[]): void;
  restore(): void;
}

/** StatsBand numbers count up with the pillars (visible layer is aria-hidden; sr-only keeps the final value). */
function bindStats(): StatsBinding {
  const els = Array.from(document.querySelectorAll<HTMLElement>("[data-island-stat]"));
  const finals = els.map((el) => el.dataset.final ?? el.textContent ?? "");
  return {
    write(reveal) {
      els.forEach((el, i) => {
        const text = countUpText(finals[i], reveal[i] ?? 1);
        if (el.textContent !== text) el.textContent = text;
      });
    },
    restore() {
      els.forEach((el, i) => {
        el.textContent = finals[i];
      });
    },
  };
}

/** Dev-only handle for the e2e scripts (like the engine's __motion); stripped from production builds. */
function exposeDebug(world: World, anchors: AnchorsRef): () => void {
  if (process.env.NODE_ENV !== "development") return () => undefined;
  const w = window as unknown as { __island?: object };
  w.__island = {
    get stats() {
      return world.stats;
    },
    get anchors() {
      return anchors.current;
    },
    scrollFor: (p: number) => scrollForProgress(p, anchors.current),
  };
  return () => {
    delete w.__island;
  };
}

/**
 * Frame loop + pointer + canvas resize + context loss. Returns an idempotent stop() that disposes everything.
 * A lost WebGL context (iOS reclaiming a background tab, a GPU reset) calls onLost: no restore attempt.
 */
function run(world: World, canvas: HTMLCanvasElement, anchors: AnchorsRef, stats: StatsBinding, onLost: () => void): () => void {
  let raf = 0;
  let last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    world.update(progressAt(window.scrollY, anchors.current), (now - last) / 1000);
    last = now;
  };
  raf = requestAnimationFrame((now) => {
    last = now;
    frame(now);
  });
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    world.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  const resize = new ResizeObserver(() => world.setSize(canvas.clientWidth, canvas.clientHeight));
  resize.observe(canvas);
  canvas.addEventListener("webglcontextlost", onLost);
  const hideDebug = exposeDebug(world, anchors);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointer);
    resize.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    hideDebug();
    world.dispose(); // disposes every GPU resource + forceContextLoss() (unless the context is already lost)
    canvas.remove();
    stats.restore();
  };
}

interface StartOptions {
  pref: Preference;
  maps: RingMapInfo[];
  minutesUnit: string;
  anchors: AnchorsRef;
  signal: AbortSignal;
}

async function startWorld(layer: HTMLElement, o: StartOptions): Promise<(() => void) | null> {
  const signals = readSignals(window);
  const tier = selectTier({ ...signals, webgl2: true }, o.pref);
  if (tier === "off") {
    setStatus("off");
    return null;
  }
  // A fresh canvas per world: a context lost by forceContextLoss() can't be reused.
  const canvas = document.createElement("canvas");
  canvas.className = "island-canvas";
  layer.append(canvas);
  const gl = canvas.getContext("webgl2", contextAttributes(o.pref));
  if (!gl) {
    canvas.remove();
    if (webgl2Missing(o.pref)) islandStore.set({ unsupported: true });
    setStatus("off");
    return null;
  }
  setStatus("loading");
  const stats = bindStats();
  let world: World | null = null;
  let stop: (() => void) | null = null;
  // Deferred: never tear the world down from inside its own update() or an event dispatch.
  const giveUp = () =>
    queueMicrotask(() => {
      if (stop && !o.signal.aborted) fallBackToPoster(stop);
    });
  try {
    const { createWorld } = await import("@/lib/three/island/world");
    // A context already lost (GPU reset while loading) can't even build a renderer: fall back below.
    if (!o.signal.aborted && !gl.isContextLost()) {
      world = await createWorld(
        canvas,
        {
          gl,
          quality: settingsFor(tier, signals.devicePixelRatio),
          maps: o.maps,
          minutesUnit: o.minutesUnit,
          reducedMotion: signals.reducedMotion,
          width: canvas.clientWidth || window.innerWidth,
          height: canvas.clientHeight || window.innerHeight,
          startProgress: progressAt(window.scrollY, o.anchors.current),
          onFirstFrame: () => setStatus("live"),
          onFocusChange: (focus) => islandStore.set({ focus }),
          onStatsReveal: stats.write,
          onGiveUp: giveUp,
        },
        o.signal,
      );
    }
  } catch (error) {
    // three throws on a context lost mid-build — an expected fallback, not an error worth reporting.
    if (!gl.isContextLost()) console.error("[island]", error);
  }
  // Lost after the build's last check (never "live" on a dead canvas).
  if (world && gl.isContextLost()) {
    world.dispose();
    world = null;
  }
  if (!world) {
    const discard = () => {
      if (!gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      stats.restore();
    };
    // Failed or lost during the build: the same fallback as a give-up (the reader may be mid-page).
    if (o.signal.aborted) discard();
    else fallBackToPoster(discard);
    return null;
  }
  stop = run(world, canvas, o.anchors, stats, giveUp);
  return stop;
}

export function IslandJourney({ maps, minutesUnit }: IslandJourneyProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<Anchor[]>([]);
  const [rmVersion, setRmVersion] = useState(0);
  // Subscribed so a preference change re-runs the boot effects; they read the store itself (below).
  const pref = useSyncExternalStore(subscribe, getPref, getServerPref);
  const active = useSyncExternalStore(subscribe, getActive, getServerActive);
  // Explicit "3D on" (the toggle): restarts the world even when pref was already "on".
  const restarts = useSyncExternalStore(subscribe, getRestarts, getServerRestarts);

  // Mount: adopt the stored preference, follow OS reduced-motion changes. Unmount: leave no trace.
  useIsoLayoutEffect(() => {
    islandStore.set({ pref: readPreference(safeStorage()) });
    const media = window.matchMedia(REDUCED_MOTION);
    // The OS setting flips the 3D off (or back on) under a reader who may be mid-page: the sticky chapters
    // collapse (or grow back) — keep the reader in the same section, as for a give-up. flushSync commits the
    // new status and every subscriber first (allowed here: an event listener, not a React effect).
    const onChange = () => {
      const reading = readingPosition();
      flushSync(() => setRmVersion((v) => v + 1));
      if (reading) restoreReadingPosition(reading);
    };
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      delete document.documentElement.dataset.island;
      islandStore.reset();
    };
  }, []);

  // Before paint: provisional decision (WebGL2 assumed) — same rule as the inline boot script, which
  // does not run on client-side navigations. Reads the store's pref, not the render's: on mount the
  // stored preference was adopted just above, after this render (no default-preference flash).
  useIsoLayoutEffect(() => {
    const tier = selectTier({ ...readSignals(window), webgl2: !islandStore.get().unsupported }, islandStore.get().pref);
    setStatus(tier === "off" ? "off" : "pending");
  }, [pref, rmVersion, restarts]);

  // Chapter geometry → scroll anchors + sticky stage offsets, re-measured on any layout change.
  useEffect(() => {
    if (!active) return;
    let queued = 0;
    let alive = true;
    const measure = () => {
      queued = 0;
      if (!alive) return;
      const measured = measureChapters();
      if (!measured) return;
      anchorsRef.current = buildAnchors(measured.boxes);
      applyStageTops(measured.stages, measured.boxes.viewport);
    };
    const queue = () => {
      if (!queued) queued = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(queue);
    const main = document.querySelector("main");
    if (main) observer.observe(main);
    // A sticky stage can grow inside its chapter's min-height (e.g. the ring focus card on phones)
    // without resizing <main>: observe every stage too.
    document.querySelectorAll(".island-stage").forEach((stage) => observer.observe(stage));
    window.addEventListener("resize", queue);
    void document.fonts?.ready.then(queue);
    return () => {
      alive = false;
      cancelAnimationFrame(queued);
      observer.disconnect();
      window.removeEventListener("resize", queue);
      clearStageTops();
      anchorsRef.current = [];
    };
  }, [active]);

  // The world: after load + idle; torn down on unmount, preference or reduced-motion change, restarted
  // on an explicit "3D on".
  useEffect(() => {
    const layer = layerRef.current;
    const { status, pref: current } = islandStore.get(); // the store's pref, as in the decision above
    if (!layer || status === "off") return;
    const controller = new AbortController();
    let stop: (() => void) | null = null;
    const cancelIdle = afterLoadIdle(() => {
      void startWorld(layer, { pref: current, maps, minutesUnit, anchors: anchorsRef, signal: controller.signal }).then((s) => {
        if (controller.signal.aborted) s?.();
        else stop = s;
      });
    });
    return () => {
      controller.abort();
      cancelIdle();
      stop?.();
    };
  }, [pref, rmVersion, restarts, maps, minutesUnit]);

  return <div ref={layerRef} className="island-layer" aria-hidden="true" />;
}
