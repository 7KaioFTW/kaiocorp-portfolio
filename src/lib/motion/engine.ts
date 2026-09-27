import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { initCursor } from "./cursor";
import { PRESETS } from "./presets";
import { initProgressBar } from "./progressBar";
import { safely } from "./safely";
import type { Cleanup, PresetRun } from "./types";

gsap.registerPlugin(ScrollTrigger, SplitText);

export interface ScanOptions {
  /** true after a client navigation / dynamic insert: in-view elements animate too. */
  animateInView: boolean;
}

export interface MotionEngine {
  scan: (opts: ScanOptions) => Promise<void>;
  resetPage: () => void;
  destroy: () => void;
}

// Yield between preset groups so no single task blocks the main thread (TBT on mobile).
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// First load with a #hash (deep link): presets grow the layout above the target (pin spacer), and
// ScrollTrigger keeps the numeric scroll position — so re-align on the target once they're in place.
// Reload / back-forward restoration is left to the browser (it re-applies the saved position as the
// page grows; correcting on top of it would overshoot).
function hashTarget(): HTMLElement | null {
  if (!window.location.hash) return null;
  try {
    return document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  } catch {
    return null;
  }
}

export function initMotion(): MotionEngine {
  const root = document.documentElement;
  // anchors:false keeps native anchor jumps, so the skip link still moves focus.
  // allowNestedScroll: wheel over a scrollable child (e.g. the brief textarea) scrolls that child.
  const lenis = new Lenis({ autoRaf: false, anchors: false, stopInertiaOnNavigate: true, allowNestedScroll: true });
  const offScrollTrigger = lenis.on("scroll", ScrollTrigger.update);
  // Dev-only debugging/test handle — `next build` replaces NODE_ENV, so this is stripped in production.
  if (process.env.NODE_ENV === "development") {
    (window as unknown as { __motion?: object }).__motion = { ScrollTrigger };
  }
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Content height changes (blog/leaderboard filters, FAQ <details>, font swaps) → re-measure triggers.
  // Only real changes since the last refresh count: the observer's first callback and the growth our
  // own scan causes (pin spacer) must not queue extra full refreshes during load (TBT on mobile).
  let measuredHeight = document.body.scrollHeight;
  let refreshTimer: number | undefined;
  const refresh = () => {
    ScrollTrigger.refresh();
    measuredHeight = document.body.scrollHeight;
  };
  const ro = new ResizeObserver(() => {
    if (Math.abs(document.body.scrollHeight - measuredHeight) < 2) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refresh, 200);
  });
  ro.observe(document.body);

  const globalCleanups: Cleanup[] = [
    offScrollTrigger,
    initProgressBar(lenis),
    initCursor(),
    () => {
      ro.disconnect();
      window.clearTimeout(refreshTimer);
    },
  ];
  let pageCtx: gsap.Context | null = null;
  let pageCleanups: Cleanup[] = [];
  let seen = new WeakMap<PresetRun, WeakSet<Element>>();
  let generation = 0;

  const seenFor = (run: PresetRun) => {
    let set = seen.get(run);
    if (!set) {
      set = new WeakSet();
      seen.set(run, set);
    }
    return set;
  };

  async function scan({ animateInView }: ScanOptions) {
    const gen = generation;
    const target = animateInView ? null : hashTarget();
    const ctx = (pageCtx ??= gsap.context(() => undefined));
    for (const [selector, run] of PRESETS) {
      if (gen !== generation) return; // a navigation reset happened mid-scan
      const done = seenFor(run);
      const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => !done.has(el));
      if (els.length === 0) continue;
      els.forEach((el) => done.add(el));
      ctx.add(() => {
        const cleanup = safely(() => run(els, { animateInView, lenis })); // one failing preset must not stop the rest
        if (cleanup) pageCleanups.push(cleanup);
      });
      await yieldToMain();
    }
    if (gen !== generation) return;
    refresh();
    if (target?.isConnected) {
      lenis.resize(); // the page just grew (pin spacer): refresh Lenis' scroll limit before scrolling
      lenis.scrollTo(target, { immediate: true, force: true });
    }
  }

  function resetPage() {
    generation++;
    pageCleanups.forEach((cleanup) => cleanup());
    pageCleanups = [];
    pageCtx?.revert();
    pageCtx = null;
    seen = new WeakMap();
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }

  const onRescan = () => void scan({ animateInView: true });
  const onRefresh = () => refresh();
  window.addEventListener("motion:rescan", onRescan);
  window.addEventListener("motion:refresh", onRefresh);
  root.classList.add("motion-ready");

  function destroy() {
    resetPage();
    window.removeEventListener("motion:rescan", onRescan);
    window.removeEventListener("motion:refresh", onRefresh);
    globalCleanups.forEach((cleanup) => cleanup());
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33); // restore the GSAP default we overrode for Lenis
    lenis.destroy();
    root.classList.remove("motion-ready");
  }

  return { scan, resetPage, destroy };
}
