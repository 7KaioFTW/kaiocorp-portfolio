# Motion Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give kaiocorp.com Awwwards-grade motion (smooth scroll, text reveals, HUD decode, WebGL hero, pinned gallery, pointer effects, page transitions) while keeping Lighthouse Perf ≥ 95 and A11y/BP 100.

**Architecture:** A tiny `MotionProvider` lazy-loads a vanilla-TS engine (`src/lib/motion/engine.ts`: GSAP + ScrollTrigger + SplitText + Lenis) after `load` + idle. Server components only add `data-motion` / `data-*` attributes; the engine scans the DOM, runs one focused preset per attribute, and resets/rescans on client navigation. Everything LCP-critical (hero headline entrance) is pure CSS; the hero background is a hand-written WebGL shader loaded on idle.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind 3, next-intl 4, gsap 3.15 (ScrollTrigger, SplitText — standard no-charge licence), lenis 1.3 (MIT), vitest 5 (dev, pure helpers only).

**Spec:** `specs/2026-09-26-motion-design.md` (read it first — it is the contract).

## Global Constraints

- Every task ends with `npx tsc --noEmit` = 0 errors, `npx eslint src` = 0 problems, `npm test` = all green (Rulebook R1.2).
- **No git commits** unless the user explicitly asks (harness rule). Each task ends with a verification checkpoint instead.
- Only `transform` and `opacity` are animated (plus the one-shot `filter: blur` in the hero entrance). Never animate layout properties.
- LCP text (home hero `h1` + subtitle, `PageHero` `h1` + subtitle) is **never** hidden (opacity 0) — entrance effects must keep it painted from frame 1.
- `prefers-reduced-motion: reduce` → engine and shader never load; every CSS animation in `src/app/motion.css` is disabled by a reduced-motion block.
- No CSS pre-hiding: content is only hidden by the engine at runtime (`gsap.set`), so JS failure = visible site.
- `split` is only allowed on solid-colour text — never on `bg-clip-text` gradient headings.
- Pointer effects (`magnetic`, `tilt`, `glow`, cursor) only when `(pointer: fine)`; the native cursor stays visible.
- Styling: Tailwind classes in components; custom CSS only in `src/app/motion.css` (imported after `globals.css`). No `!important`. FR apostrophes in JSX: `’`.
- Components: one per file, named exports (except Next's `template.tsx` default export), `{Name}Props` interfaces, `cn()` for conditional classes.
- Target acceptance (spec §1): Lighthouse desktop + mobile on `/`, `/realisations`, `/maps` → Perf ≥ 95, A11y 100, BP 100, CLS ≤ 0.02, zero console errors.

## Deviations from the spec (update the spec in Task 10)

1. Lenis `anchors: false` (spec said `true`): Lenis' anchor interception would stop the skip link from moving focus. Native anchor jumps keep a11y; `stopInertiaOnNavigate: true` added.
2. Hero: the CSS grid overlay fades out once the shader is live (the shader draws its own lens grid); `parallax` goes on the hero **content** instead of the grid overlay.
3. Shader renders at 0.75× CSS resolution on desktop (0.5× under 768 px), DPR still capped at 1.5 — GPU headroom.
4. **Réalisations cards become links** to their `/maps/[id]` page (stretched-link pattern) so the `↗ view` cursor is honest. *Flagged to the user for approval.*
5. `ScrollReveal` loses its `delay` prop: cascades come from `ScrollTrigger.batch` stagger.
6. `tilt` / `magnetic` replace the CSS hover lifts on those cards/buttons (GSAP inline transforms would fight CSS transform transitions).
7. Cursor and progress bar live in `src/lib/motion/{cursor,progressBar}.ts` (global, not per-page presets).
8. `parallax` supports `data-axis="x"` (FinalCta drift).
9. `vitest` added as a dev dependency for pure-helper unit tests.

## Review Focus

1. **Client navigation round-trips** (home → /maps → back, locale switch): no content stuck at opacity 0, exactly one cursor, the pinned gallery works again after returning home. → Task 9 Step 7.
2. **Resizing across 1024 px on the homepage**: the gallery switches pinned ↔ grid with no horizontal page scroll. → Task 6 Step 7.
3. **Keyboard-only use**: Tab into the pinned gallery brings the focused card on screen; focusing the header after scrolling down makes it reappear; the skip link still moves focus. → Task 6 Step 8, Task 9 Step 6.
4. **Deep link / reload mid-page** (`/#contact`): nothing in the viewport is hidden by `reveal`. → Task 2 Step 13.
5. **Long translated strings at 375 px** (DE): decoded eyebrows/stats never overflow the viewport or wrap mid-scramble. → Task 3 Step 10.

---

## File Structure

**New**
| File | Responsibility |
|---|---|
| `vitest.config.mts` | Vitest config (`@` alias) |
| `.claude/launch.json` | Dev server config for the browser pane |
| `src/app/motion.css` | All motion CSS (Lenis rules, hero entrance, pointer, marquee, transitions, reduced motion) |
| `src/lib/motion/types.ts` | `Cleanup`, `PresetEnv`, `PresetRun` |
| `src/lib/motion/geometry.ts` (+ `.test.ts`) | Pure: `shouldAnimate`, `tiltAngles` |
| `src/lib/motion/scramble.ts` (+ `.test.ts`) | Pure: `scrambleFrame` |
| `src/lib/motion/velocity.ts` (+ `.test.ts`) | Pure: `marqueeRate` |
| `src/lib/motion/header.ts` (+ `.test.ts`) | Pure: `nextHeaderHidden` |
| `src/lib/motion/idle.ts` | `afterLoadIdle` |
| `src/lib/motion/engine.ts` | Lenis + ScrollTrigger wiring, scan/reset/destroy |
| `src/lib/motion/progressBar.ts` | Global scroll progress bar |
| `src/lib/motion/cursor.ts` | Global custom cursor |
| `src/lib/motion/shader.ts` | Raw WebGL hero background |
| `src/lib/motion/presets/index.ts` | Ordered preset registry |
| `src/lib/motion/presets/{reveal,split,decode,parallax,gallery,marquee,progressLine,pointer}.ts` | One preset each (`pointer.ts` = magnetic/tilt/glow) |
| `src/components/motion/MotionProvider.tsx` | Lazy engine loader, route-change reset, progress bar element |
| `src/components/motion/HeroShader.tsx` | Canvas + idle shader start |
| `src/components/motion/Marquee.tsx` | Map-title marquee (server) |
| `src/app/[locale]/template.tsx` | Page-enter transition |

**Modified:** `package.json`, `src/lib/stats.ts` (+ `stats.test.ts`), `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/components/ui/{ScrollReveal,SectionHead,Cta}.tsx`, `src/components/sections/{Hero,PageHero,StatsBand,Realisations,Process,FinalCta,Audiences,ServicesGrid,Opportunity,WhyKaio,SectorIdeas}.tsx`, `src/components/maps/{MapRow,MapLeaderboard}.tsx`, `src/app/[locale]/maps/[id]/page.tsx`, `src/components/layout/Header.tsx`, pages/components using `ScrollReveal delay=` (see Task 2), docs.

---

### Task 1: Map verification + test harness

Sprite Pillars data is already in `maps.json` (previous session). This task confirms it renders and sets up vitest with the first test.

**Files:**
- Create: `vitest.config.mts`, `src/lib/stats.test.ts`, `.claude/launch.json`
- Modify: `package.json`, `src/lib/stats.ts`

**Interfaces:**
- Produces: `formatBillions(locale: string, minutes?: number): string` (always one decimal), `npm test` script.

- [ ] **Step 1: Confirm the thumbnail exists**

Run: `cd /c/Users/Kaio/Documents/Claude/Portfolio && node -e "require('sharp')('public/images/maps/sprite-pillars.jpg').metadata().then(m=>console.log(m.format,m.width,m.height)).catch(e=>console.log('MISSING',e.message))"`
Expected: `jpeg 1920 1080` (or another 16:9 size). If `MISSING`: **stop** and ask the user to run
`curl.exe -L -o "C:/Users/Kaio/Documents/Claude/Portfolio/public/images/maps/sprite-pillars.jpg" "https://cdn-0001.qstv.on.epicgames.com/liOghSBWVXbwXPdcdE/image/landscape_comp.jpeg"` (curl is blocked for the agent).
If the size is not 1920×1080, normalise it:
`node -e "const s=require('sharp');s('public/images/maps/sprite-pillars.jpg').resize(1920,1080,{fit:'cover'}).jpeg({quality:82}).toBuffer().then(b=>require('fs').writeFileSync('public/images/maps/sprite-pillars.jpg',b))"`

- [ ] **Step 2: Install vitest and add the script**

Run: `npm install -D vitest@^5.0.2`
Then in `package.json` `"scripts"` add after `"lint": "next lint"`:
```json
    "lint": "next lint",
    "test": "vitest run"
```

- [ ] **Step 3: Create `vitest.config.mts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
```

- [ ] **Step 4: Write the failing test `src/lib/stats.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import mapsData from "@/data/maps.json";
import { TOTAL_MAPS, TOTAL_MINUTES, formatBillions } from "@/lib/stats";

describe("formatBillions", () => {
  it("always shows one decimal with the locale separator", () => {
    expect(formatBillions("fr", 5_000_000_000)).toBe("5,0");
    expect(formatBillions("en", 5_000_000_000)).toBe("5.0");
    expect(formatBillions("de", 4_939_159_700)).toBe("4,9");
  });
  it("floors instead of rounding (never overstates)", () => {
    expect(formatBillions("en", 4_999_999_999)).toBe("4.9");
  });
  it("defaults to the computed site total", () => {
    expect(Number(formatBillions("en"))).toBe(Math.floor(TOTAL_MINUTES / 100_000_000) / 10);
  });
});

describe("TOTAL_MAPS", () => {
  it("counts every entry in maps.json", () => {
    expect(TOTAL_MAPS).toBe(mapsData.length);
  });
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npm test -- src/lib/stats.test.ts`
Expected: FAIL — `formatBillions("fr", 5_000_000_000)` returns `"4,9"` (second arg ignored) / `"5"` shapes.

- [ ] **Step 6: Implement** — replace the `formatBillions` function at the end of `src/lib/stats.ts` with:

```ts
// Milliards arrondis à la baisse, toujours 1 décimale, formatés selon la locale : "4,9" (fr) / "4.9" (en).
export function formatBillions(locale: string, minutes: number = TOTAL_MINUTES): string {
  return (Math.floor(minutes / 100_000_000) / 10).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: 4 passed.

- [ ] **Step 8: Create `.claude/launch.json`**

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }
  ]
}
```

- [ ] **Step 9: Verify the map renders (browser pane)**

`preview_start {name:"dev"}`, navigate to `http://localhost:3000/maps`, run JS:
```js
await new Promise(r => setTimeout(r, 3000));
({ row: [...document.querySelectorAll('a[href$="/maps/sprite-pillars"]')].length,
   knzi: [...document.querySelectorAll("button")].some(b => b.textContent === "Knzi") })
```
Expected: `{ row: 1, knzi: true }`. Navigate to `/maps/sprite-pillars`, run
`document.querySelector('main img').naturalWidth > 0 && document.querySelector('h1').textContent` → `"SPRITE PILLARS"`.
Navigate to `/about`, run `document.body.innerText.includes("4,9 milliards")` → `true`. Screenshot `/maps/sprite-pillars`.

- [ ] **Step 10: Checkpoint** — `npx tsc --noEmit && npx eslint src && npm test` all clean.

---

### Task 2: Engine foundation — Lenis, reveal, progress bar, route-change reset

**Files:**
- Create: `src/lib/motion/types.ts`, `src/lib/motion/geometry.ts`, `src/lib/motion/geometry.test.ts`, `src/lib/motion/idle.ts`, `src/lib/motion/presets/reveal.ts`, `src/lib/motion/presets/index.ts`, `src/lib/motion/progressBar.ts`, `src/lib/motion/engine.ts`, `src/components/motion/MotionProvider.tsx`, `src/app/motion.css`
- Modify: `package.json`, `src/app/[locale]/layout.tsx`, `src/components/ui/ScrollReveal.tsx`, every file passing `delay=` to `ScrollReveal`, `src/components/maps/MapRow.tsx`, `src/components/maps/MapLeaderboard.tsx`

**Interfaces:**
- Produces:
  - `type Cleanup = () => void`; `interface PresetEnv { animateInView: boolean; lenis: Lenis }`; `type PresetRun = (els: HTMLElement[], env: PresetEnv) => Cleanup | void` (`types.ts`)
  - `shouldAnimate(rect: {top:number;bottom:number}, viewportHeight: number, animateInView: boolean): boolean` (`geometry.ts`)
  - `afterLoadIdle(cb: () => void, timeout?: number): () => void` (`idle.ts`)
  - `PRESETS: ReadonlyArray<readonly [selector: string, run: PresetRun]>` (`presets/index.ts`) — later tasks add entries
  - `initMotion(): MotionEngine` with `scan({animateInView}) : Promise<void>`, `resetPage(): void`, `destroy(): void` (`engine.ts`)
  - Window events: `motion:rescan` (scan new nodes, animate in view), `motion:refresh` (`ScrollTrigger.refresh()`)
  - `html.motion-ready` class while the engine runs; `html[data-motion="reduced"]` when reduced motion
  - `<ScrollReveal className?>` renders `<div data-motion="reveal">` (no `delay` prop)

- [ ] **Step 1: Install runtime deps**

Run: `npm install gsap@^3.15.0 lenis@^1.3.26`
Expected: both added to `dependencies`.

- [ ] **Step 2: Create `src/lib/motion/types.ts`**

```ts
import type Lenis from "lenis";

export type Cleanup = () => void;

export interface PresetEnv {
  /** false on first load (only below-the-fold elements animate), true after navigation/rescan. */
  animateInView: boolean;
  lenis: Lenis;
}

/** A preset receives the not-yet-processed elements matching its selector. */
export type PresetRun = (els: HTMLElement[], env: PresetEnv) => Cleanup | void;
```

- [ ] **Step 3: Write the failing test `src/lib/motion/geometry.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { shouldAnimate } from "./geometry";

const VH = 800;

describe("shouldAnimate", () => {
  it("never hides elements above the viewport", () => {
    expect(shouldAnimate({ top: -400, bottom: -10 }, VH, false)).toBe(false);
    expect(shouldAnimate({ top: -400, bottom: -10 }, VH, true)).toBe(false);
  });
  it("leaves in-view elements alone on first load", () => {
    expect(shouldAnimate({ top: 100, bottom: 300 }, VH, false)).toBe(false);
    expect(shouldAnimate({ top: 700, bottom: 900 }, VH, false)).toBe(false);
  });
  it("animates in-view elements after a navigation", () => {
    expect(shouldAnimate({ top: 100, bottom: 300 }, VH, true)).toBe(true);
  });
  it("animates below-the-fold elements in both modes", () => {
    expect(shouldAnimate({ top: 800, bottom: 1000 }, VH, false)).toBe(true);
    expect(shouldAnimate({ top: 1200, bottom: 1400 }, VH, true)).toBe(true);
  });
  it("ignores zero-size (display:none) elements", () => {
    expect(shouldAnimate({ top: 0, bottom: 0 }, VH, true)).toBe(false);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npm test -- src/lib/motion/geometry.test.ts`
Expected: FAIL — cannot resolve `./geometry`.

- [ ] **Step 5: Create `src/lib/motion/geometry.ts`**

```ts
// Pure helpers (no DOM, no GSAP) — unit-tested in geometry.test.ts.

export interface VerticalRect {
  top: number;
  bottom: number;
}

/**
 * Should an element get a hidden initial state?
 * - Never if it is above the viewport (scrolled past — hiding it would strand it).
 * - On first load only if entirely below the fold: in-view content was painted before the
 *   engine arrived, re-hiding it would flicker.
 * - After a client navigation (animateInView), anything not above the viewport animates.
 */
export function shouldAnimate(rect: VerticalRect, viewportHeight: number, animateInView: boolean): boolean {
  if (rect.bottom <= 0) return false;
  if (animateInView) return true;
  return rect.top >= viewportHeight;
}
```

- [ ] **Step 6: Run tests** — `npm test` → all pass.

- [ ] **Step 7: Create `src/lib/motion/idle.ts`**

```ts
/**
 * Run `cb` once the page has fully loaded and the main thread is idle, so motion code never
 * competes with LCP / hydration. Returns a cancel function.
 */
export function afterLoadIdle(cb: () => void, timeout = 1500): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  const schedule = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => cb(), { timeout });
    } else {
      timerId = window.setTimeout(cb, 200);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}
```

- [ ] **Step 8: Create `src/lib/motion/presets/reveal.ts` and `presets/index.ts`**

`reveal.ts`:
```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldAnimate } from "../geometry";
import type { PresetRun } from "../types";

// Fade + rise. Batched so items entering together (grids) cascade automatically.
// Opacity only (not visibility) so hidden items stay focusable — focusing scrolls them in.
export const reveal: PresetRun = (els, { animateInView }) => {
  const vh = window.innerHeight;
  const targets = els.filter((el) => shouldAnimate(el.getBoundingClientRect(), vh, animateInView));
  if (targets.length === 0) return;
  gsap.set(targets, { opacity: 0, y: 32 });
  ScrollTrigger.batch(targets, {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, overwrite: true }),
  });
};
```

`index.ts`:
```ts
import type { PresetRun } from "../types";
import { reveal } from "./reveal";

// Order matters: presets that change layout (split, gallery pin) run before the ones that measure.
export const PRESETS: ReadonlyArray<readonly [selector: string, run: PresetRun]> = [
  ['[data-motion="reveal"]', reveal],
];
```

- [ ] **Step 9: Create `src/lib/motion/progressBar.ts`**

```ts
import { gsap } from "gsap";
import type Lenis from "lenis";
import type { Cleanup } from "./types";

/** Drives the fixed top bar rendered by MotionProvider ([data-motion-progress]). */
export function initProgressBar(lenis: Lenis): Cleanup {
  const bar = document.querySelector<HTMLElement>("[data-motion-progress]");
  if (!bar) return () => undefined;
  const setScale = gsap.quickSetter(bar, "scaleX");
  const update = (l: Lenis) => setScale(Number.isFinite(l.progress) ? l.progress : 0);
  const off = lenis.on("scroll", update);
  update(lenis);
  return () => {
    off();
    gsap.set(bar, { clearProps: "transform" });
  };
}
```

- [ ] **Step 10: Create `src/lib/motion/engine.ts`**

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { PRESETS } from "./presets";
import { initProgressBar } from "./progressBar";
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

export function initMotion(): MotionEngine {
  const root = document.documentElement;
  // anchors:false keeps native anchor jumps, so the skip link still moves focus.
  const lenis = new Lenis({ autoRaf: false, anchors: false, stopInertiaOnNavigate: true });
  const offScrollTrigger = lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const globalCleanups: Cleanup[] = [offScrollTrigger, initProgressBar(lenis)];
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
    const ctx = (pageCtx ??= gsap.context(() => undefined));
    for (const [selector, run] of PRESETS) {
      if (gen !== generation) return; // a navigation reset happened mid-scan
      const done = seenFor(run);
      const els = Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((el) => !done.has(el));
      if (els.length === 0) continue;
      els.forEach((el) => done.add(el));
      ctx.add(() => {
        const cleanup = run(els, { animateInView, lenis });
        if (cleanup) pageCleanups.push(cleanup);
      });
      await yieldToMain();
    }
    if (gen === generation) ScrollTrigger.refresh();
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
  const onRefresh = () => ScrollTrigger.refresh();
  window.addEventListener("motion:rescan", onRescan);
  window.addEventListener("motion:refresh", onRefresh);
  root.classList.add("motion-ready");

  function destroy() {
    resetPage();
    window.removeEventListener("motion:rescan", onRescan);
    window.removeEventListener("motion:refresh", onRefresh);
    globalCleanups.forEach((cleanup) => cleanup());
    gsap.ticker.remove(tick);
    lenis.destroy();
    root.classList.remove("motion-ready");
  }

  return { scan, resetPage, destroy };
}
```

- [ ] **Step 11: Create `src/components/motion/MotionProvider.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { afterLoadIdle } from "@/lib/motion/idle";
import type { MotionEngine } from "@/lib/motion/engine";

// Loads the motion engine after `load` + idle (never on the critical path) and resets it on
// every client navigation. Also renders the scroll progress bar the engine drives.
export function MotionProvider() {
  const pathname = usePathname();
  const engine = useRef<MotionEngine | null>(null);
  const firstPath = useRef(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.dataset.motion = "reduced";
      return;
    }
    let cancelled = false;
    const cancelIdle = afterLoadIdle(async () => {
      const { initMotion } = await import("@/lib/motion/engine");
      if (cancelled) return;
      engine.current = initMotion();
      await engine.current.scan({ animateInView: false });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const current = engine.current;
    if (!current) return;
    current.resetPage();
    const id = requestAnimationFrame(() => void current.scan({ animateInView: true }));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      data-motion-progress
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent"
    />
  );
}
```

- [ ] **Step 12: Create `src/app/motion.css` and wire the layout**

`src/app/motion.css`:
```css
/* Motion system styles — spec: specs/2026-09-26-motion-design.md.
   Imported after globals.css so these rules win over Tailwind utilities of equal specificity. */

/* Lenis smooth scroll (replaces lenis/dist/lenis.css, without !important) */
html.lenis,
html.lenis body { height: auto; }
html.lenis.lenis-smooth { scroll-behavior: auto; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: clip; }
.lenis.lenis-smooth iframe { pointer-events: none; }
```

In `src/app/[locale]/layout.tsx`:
- add `import { MotionProvider } from "@/components/motion/MotionProvider";` after the `JsonLd` import;
- replace `import "../globals.css";` with:
```tsx
import "../globals.css";
import "../motion.css";
```
- insert `<MotionProvider />` right after the skip-link `</a>`:
```tsx
          </a>
          <MotionProvider />
          <JsonLd data={personSchema} />
```

- [ ] **Step 13: Convert `ScrollReveal` and drop the `delay` prop everywhere**

Replace `src/components/ui/ScrollReveal.tsx` with:
```tsx
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
}

// Server-compatible marker: the motion engine (src/lib/motion) animates [data-motion="reveal"]
// once loaded. Without it (reduced motion / JS off) the content is simply visible.
export function ScrollReveal({ children, className }: ScrollRevealProps) {
  return (
    <div data-motion="reveal" className={className}>
      {children}
    </div>
  );
}
```
Remove the `delay` attributes:
```bash
grep -rl "<ScrollReveal" src --include=*.tsx | xargs sed -i -E 's/ delay=\{`[^`]*`\}//g; s/ delay="[^"]*"//g'
grep -rn "ScrollReveal[^>]*delay" src ; echo "exit=$?"
```
Expected: no matches (`exit=1`).
In `src/components/maps/MapRow.tsx` change the signature to `export function MapRow({ map, rank }: { map: FortniteMap; rank: number })`; in `MapLeaderboard.tsx` change `<MapRow key={map.id} map={map} rank={i + 1} index={i} />` to `<MapRow key={map.id} map={map} rank={i + 1} />`.

- [ ] **Step 14: Typecheck, lint, test** — `npx tsc --noEmit && npx eslint src && npm test` → clean.

- [ ] **Step 15: Verify in the browser pane (dev server)**

Navigate `http://localhost:3000/`, run:
```js
await new Promise(r => setTimeout(r, 4000));
const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
({ ready: document.documentElement.classList.contains("motion-ready"),
   lenis: document.documentElement.classList.contains("lenis"),
   hiddenBelow: [...document.querySelectorAll('[data-motion="reveal"]')].filter(e => !inView(e) && getComputedStyle(e).opacity === "0").length,
   hiddenInView: [...document.querySelectorAll('[data-motion="reveal"]')].filter(e => inView(e) && getComputedStyle(e).opacity === "0").length })
```
Expected: `ready: true, lenis: true, hiddenBelow > 0, hiddenInView: 0`.
Then `window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 2500));` and re-run the `hiddenInView` filter → `0`; `getComputedStyle(document.querySelector("[data-motion-progress]")).transform` → a matrix with scaleX ≈ 1 (`matrix(1, 0, 0, 1, 0, 0)` or close).
**Review Focus 4:** navigate `http://localhost:3000/#contact`, wait 4 s, run the `hiddenInView` check → `0`.
Click the header "Réalisations" link (client navigation), wait 2.5 s, run `hiddenInView` → `0`.

- [ ] **Step 16: Checkpoint** — tsc / eslint / tests clean; note results for CACHE.md.

---

### Task 3: Text presets — split + decode, SectionHead, StatsBand

**Files:**
- Create: `src/lib/motion/scramble.ts`, `src/lib/motion/scramble.test.ts`, `src/lib/motion/presets/split.ts`, `src/lib/motion/presets/decode.ts`
- Modify: `src/lib/motion/presets/index.ts`, `src/components/ui/SectionHead.tsx`, `src/components/sections/StatsBand.tsx`, `src/app/motion.css`

**Interfaces:**
- Consumes: `PresetRun`, `shouldAnimate`, `PRESETS`.
- Produces: `scrambleFrame(final: string, progress: number, rand?: () => number): string`; attributes `data-motion="split"` (solid text only) and `data-motion="decode"` (single-line text); CSS `.motion-decode`, `.motion-scan`.

- [ ] **Step 1: Write the failing test `src/lib/motion/scramble.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { scrambleFrame } from "./scramble";

const first = () => 0; // always the first glyph of each pool: "0", "A", "a"

describe("scrambleFrame", () => {
  it("returns the final text at progress 1", () => {
    expect(scrambleFrame("4,9 Md+", 1, first)).toBe("4,9 Md+");
  });
  it("keeps length, spaces and punctuation at progress 0", () => {
    expect(scrambleFrame("4,9 Md+", 0, first)).toBe("0,0 Aa+");
  });
  it("maps digits to digits and letters to same-case letters, accents included", () => {
    expect(scrambleFrame("ÉTÉ 24", 0, first)).toBe("AAA 00");
    expect(scrambleFrame("kaio", 0, first)).toBe("aaaa");
  });
  it("resolves left to right", () => {
    expect(scrambleFrame("WXYZ", 0.5, first)).toBe("WXAA");
  });
  it("clamps progress outside 0..1", () => {
    expect(scrambleFrame("WXYZ", 2, first)).toBe("WXYZ");
    expect(scrambleFrame("WXYZ", -1, first)).toBe("AAAA");
  });
});
```

- [ ] **Step 2: Run it to verify it fails** — `npm test -- src/lib/motion/scramble.test.ts` → FAIL (module missing).

- [ ] **Step 3: Create `src/lib/motion/scramble.ts`**

```ts
// Pure: one frame of the HUD "decode" effect — unit-tested in scramble.test.ts.
const DIGITS = "0123456789";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";

function pool(ch: string): string | null {
  if (ch >= "0" && ch <= "9") return DIGITS;
  if (ch !== ch.toLowerCase()) return UPPER;
  if (ch !== ch.toUpperCase()) return LOWER;
  return null; // spaces, punctuation, symbols stay as-is
}

/**
 * Letters/digits resolve left→right as `progress` goes 0→1; unresolved ones show a random glyph
 * of the same class (digit→digit, upper→upper, lower→lower). Length never changes.
 */
export function scrambleFrame(final: string, progress: number, rand: () => number = Math.random): string {
  const chars = Array.from(final);
  const slots = chars.flatMap((ch, i) => (pool(ch) ? [i] : []));
  const p = Math.min(Math.max(progress, 0), 1);
  const resolved = Math.floor(p * slots.length);
  for (let k = resolved; k < slots.length; k++) {
    const i = slots[k];
    const glyphs = pool(chars[i]) ?? "";
    chars[i] = glyphs[Math.floor(rand() * glyphs.length)] ?? chars[i];
  }
  return chars.join("");
}
```

- [ ] **Step 4: Run tests** — `npm test` → all pass.

- [ ] **Step 5: Create `src/lib/motion/presets/decode.ts`**

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrambleFrame } from "../scramble";
import type { PresetRun } from "../types";

// HUD scramble on short single-line text. Screen readers get the final text (sr-only copy);
// the animated layer is aria-hidden and width-locked so nothing reflows. Never hides text.
export const decode: PresetRun = (els) => {
  const vh = window.innerHeight;
  for (const el of els) {
    if (el.hasAttribute("data-decoded")) continue;
    const final = el.textContent ?? "";
    const rect = el.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || rect.height;
    if (final.trim() === "" || rect.height > lineHeight * 1.5) continue; // multi-line: skip
    el.setAttribute("data-decoded", "");

    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = final;
    const layer = document.createElement("span");
    layer.className = "motion-decode";
    layer.setAttribute("aria-hidden", "true");
    layer.style.width = `${rect.width}px`;
    layer.textContent = final;
    el.replaceChildren(sr, layer);

    const state = { p: 0 };
    const play = () =>
      gsap.fromTo(
        state,
        { p: 0 },
        {
          p: 1,
          duration: 1.1,
          ease: "power2.out",
          onUpdate: () => {
            layer.textContent = scrambleFrame(final, state.p);
          },
          onComplete: () => {
            layer.textContent = final;
          },
        },
      );

    if (rect.bottom <= 0) continue; // above the viewport: stays resolved
    if (rect.top < vh) play(); // visible now: "boot" effect
    else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: play });
  }
};
```

- [ ] **Step 6: Create `src/lib/motion/presets/split.ts`**

```ts
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { shouldAnimate } from "../geometry";
import type { PresetRun } from "../types";

// Masked word reveal for SOLID-colour headings only (bg-clip-text gradients break when split).
// SplitText keeps the heading accessible (aria-label on the parent, aria-hidden pieces).
export const split: PresetRun = (els, { animateInView }) => {
  const vh = window.innerHeight;
  for (const el of els) {
    if (!shouldAnimate(el.getBoundingClientRect(), vh, animateInView)) continue;
    let played = false;
    SplitText.create(el, {
      type: "lines,words",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) => {
        if (played) return undefined; // re-split after a resize: words stay in place
        return gsap.from(self.words, {
          yPercent: 110,
          duration: 1,
          ease: "expo.out",
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onComplete: () => {
            played = true;
          },
        });
      },
    });
  }
};
```

- [ ] **Step 7: Register the presets** — replace `src/lib/motion/presets/index.ts` with:

```ts
import type { PresetRun } from "../types";
import { decode } from "./decode";
import { reveal } from "./reveal";
import { split } from "./split";

// Order matters: presets that change layout (split, gallery pin) run before the ones that measure.
export const PRESETS: ReadonlyArray<readonly [selector: string, run: PresetRun]> = [
  ['[data-motion="split"]', split],
  ['[data-motion="reveal"]', reveal],
  ['[data-motion="decode"]', decode],
];
```

- [ ] **Step 8: Update `SectionHead` and `StatsBand`**

`src/components/ui/SectionHead.tsx` — replace the component body:
```tsx
export function SectionHead({ eyebrow, title, lead, center }: SectionHeadProps) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <p data-motion="decode" className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 data-motion="split" className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h2>
      {lead && (
        <ScrollReveal>
          <p className={cn("mt-4 text-base leading-relaxed text-slate-400 md:text-lg", center && "mx-auto")}>{lead}</p>
        </ScrollReveal>
      )}
    </div>
  );
}
```
`src/components/sections/StatsBand.tsx` — section and number markup become:
```tsx
    <section className="relative border-y border-white/5 bg-gradient-to-b from-primary/[0.07] to-transparent">
      <div aria-hidden="true" className="motion-scan pointer-events-none absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-center lg:grid-cols-4">
        {STATS.map((s) => (
          <ScrollReveal key={s.lbl}>
            <div data-motion="decode" className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl lg:text-5xl">
              {s.num}
            </div>
```
(the rest of the file is unchanged; `delay` was already removed in Task 2).

- [ ] **Step 9: Append to `src/app/motion.css`**

```css
/* decode: fixed-width scramble layer (width set inline by the engine) */
.motion-decode { display: inline-block; vertical-align: top; white-space: nowrap; }

/* StatsBand neon scan — scroll-driven CSS, no JS; hidden where unsupported */
.motion-scan {
  opacity: 0;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent) no-repeat -30% 0 / 30% 100%;
}
@supports (animation-timeline: view()) {
  .motion-scan {
    opacity: 1;
    animation: motion-scan linear both;
    animation-timeline: view();
    animation-range: entry 10% cover 50%;
  }
}
@keyframes motion-scan { to { background-position: 130% 0; } }

@media (prefers-reduced-motion: reduce) {
  .motion-scan { display: none; }
}
```

- [ ] **Step 10: Verify (browser pane)**

On `/` (desktop), wait 4 s, scroll to the Services section (`document.querySelector("#services").scrollIntoView()`), wait 2 s, run:
```js
({ splitHeadings: document.querySelectorAll("h2[aria-label]").length,
   decoded: document.querySelectorAll("[data-decoded]").length,
   statsText: [...document.querySelectorAll("section .motion-decode")].map(e => e.textContent).slice(0, 4) })
```
Expected: `splitHeadings ≥ 1`, `decoded ≥ 5`, stats texts equal the final values (e.g. `"4,9 Md+"`, `"16+"`). Screenshot the Services heading mid-reveal and the StatsBand.
**Review Focus 5:** `resize_window {preset:"mobile"}`, navigate `http://localhost:3000/de`, wait 4 s, scroll to bottom slowly (`for (let y=0;y<document.body.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}`), then:
```js
[...document.querySelectorAll(".motion-decode")].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length
```
Expected: `0`. Also `document.documentElement.scrollWidth <= innerWidth` → `true`. Reset with `resize_window {preset:"desktop"}`.

- [ ] **Step 11: Checkpoint** — tsc / eslint / tests clean.

---

### Task 4: Hero — WebGL shader, CSS entrance, parallax; PageHero entrance

**Files:**
- Create: `src/lib/motion/shader.ts`, `src/components/motion/HeroShader.tsx`, `src/lib/motion/presets/parallax.ts`
- Modify: `src/lib/motion/presets/index.ts`, `src/components/sections/Hero.tsx`, `src/components/sections/PageHero.tsx`, `src/app/motion.css`

**Interfaces:**
- Consumes: `afterLoadIdle`, `PresetRun`.
- Produces: `startShader(canvas: HTMLCanvasElement): (() => void) | null`; `<HeroShader />`; `data-motion="parallax"` with `data-speed` (default `0.2`) and `data-axis="x"|"y"`; CSS classes `hero-rise`, `hero-fade-rise` (delay via Tailwind `[--d:XXXms]`), `hero-glitch` (+ `data-text`), `hero-sweep`, `motion-shader`, `hero-grid`.

- [ ] **Step 1: Create `src/lib/motion/presets/parallax.ts`**

```ts
import { gsap } from "gsap";
import type { PresetRun } from "../types";

// Scrubbed drift. data-speed = fraction of the element's own size travelled across its trigger
// (default 0.2); data-axis="x" drifts horizontally. Trigger = enclosing <section>, else parent.
export const parallax: PresetRun = (els) => {
  const vh = window.innerHeight;
  for (const el of els) {
    const speed = Number(el.dataset.speed ?? "0.2");
    const prop = el.dataset.axis === "x" ? "xPercent" : "yPercent";
    const trigger = el.closest("section") ?? el.parentElement ?? el;
    // Triggers inside the first screen start at scroll 0 so nothing jumps when the engine arrives.
    const nearTop = trigger.getBoundingClientRect().top + window.scrollY < vh;
    gsap.to(el, {
      [prop]: speed * 100,
      ease: "none",
      scrollTrigger: { trigger, start: nearTop ? 0 : "top bottom", end: "bottom top", scrub: true },
    });
  }
};
```
Add to `presets/index.ts`: import `{ parallax } from "./parallax"` and append `['[data-motion="parallax"]', parallax],` after the decode entry.

- [ ] **Step 2: Create `src/lib/motion/shader.ts`**

```ts
// Hand-written WebGL hero background (no library): domain-warped fbm plasma in the brand
// colours, a grid that bends like a lens around the lerped mouse, and a faint scanline.
const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  vec2 dm = p - m;
  float d2 = dot(dm, dm);
  float t = uTime * 0.06;
  vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 4.2));
  float n = fbm(p * 1.8 + 2.2 * q + vec2(t * 1.3, -t) - dm * 0.35 * exp(-d2 * 4.0));
  vec3 col = vec3(0.039, 0.039, 0.059);
  col = mix(col, vec3(0.482, 0.184, 0.745), smoothstep(0.35, 0.85, n) * 0.55);
  col = mix(col, vec3(0.0, 0.831, 1.0), smoothstep(0.45, 0.9, q.y * n * 1.7) * 0.32);
  col += vec3(0.0, 0.831, 1.0) * 0.09 * exp(-d2 * 7.0);
  vec2 g = abs(fract((p + dm * 0.12 * exp(-d2 * 6.0)) * 11.0) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.04, min(g.x, g.y));
  col += line * 0.03 * smoothstep(1.1, 0.2, length(p - vec2(0.0, 0.25)));
  col += 0.01 * sin(gl_FragCoord.y * 1.4 + uTime * 6.0);
  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

/** Starts the render loop; returns a stop function, or null when WebGL is unavailable. */
export function startShader(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uMouse = gl.getUniformLocation(program, "uMouse");

  // DPR capped at 1.5, then 0.75× (desktop) / 0.5× (< 768 px) internal resolution.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (window.innerWidth < 768 ? 0.5 : 0.75);
  const resize = () => {
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const target = { x: 0.7, y: 0.6 };
  const mouse = { x: 0.7, y: 0.6 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = 1 - (e.clientY - r.top) / r.height;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  let visible = true;
  let raf = 0;
  let live = false;
  const start = performance.now();

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    mouse.x += (target.x - mouse.x) * 0.06;
    mouse.y += (target.y - mouse.y) * 0.06;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uMouse, mouse.x * canvas.width, mouse.y * canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!live) {
      live = true;
      canvas.classList.add("is-live");
    }
    loop();
  };
  const loop = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) loop();
  });
  io.observe(canvas);
  const onVisibility = () => {
    if (!document.hidden) loop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const stop = () => {
    visible = false;
    cancelAnimationFrame(raf);
    raf = 0;
    ro.disconnect();
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.classList.remove("is-live");
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    stop(); // CSS gradients underneath take over
  };
  canvas.addEventListener("webglcontextlost", onLost);

  loop();
  return stop;
}
```

- [ ] **Step 3: Create `src/components/motion/HeroShader.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { afterLoadIdle } from "@/lib/motion/idle";

// Decorative WebGL background. Loaded after `load` + idle; fades in on its first frame.
// The hero's CSS gradients stay underneath as the fallback (no WebGL / reduced motion).
export function HeroShader() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    const cancelIdle = afterLoadIdle(async () => {
      const { startShader } = await import("@/lib/motion/shader");
      if (!cancelled) stop = startShader(canvas);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      stop?.();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="motion-shader absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-1000"
    />
  );
}
```

- [ ] **Step 4: Rewrite `src/components/sections/Hero.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { HeroShader } from "@/components/motion/HeroShader";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export async function Hero() {
  const t = await getTranslations("b2b.hero");
  const title = t("title");
  return (
    <section className="relative overflow-hidden bg-surface-dark pb-20 pt-36 md:pt-44">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 75% 15%, rgba(123,47,190,0.32), transparent 70%), radial-gradient(50% 45% at 12% 85%, rgba(0,212,255,0.18), transparent 70%)",
        }}
      />
      <HeroShader />
      <div className="hero-grid absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />

      <div data-motion="parallax" data-speed="0.15" className="relative z-10 mx-auto max-w-6xl px-6">
        <p data-motion="decode" className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {t("eyebrow")}
        </p>
        {/* LCP: painted opaque from frame 1 — entrance is transform/blur + decorative glitch only */}
        <div data-text={title} className="hero-glitch hero-rise mt-5 max-w-[14ch] font-heading text-4xl font-extrabold leading-[1.08] sm:text-5xl md:text-6xl">
          <h1 className="hero-sweep bg-clip-text text-transparent">{title}</h1>
        </div>
        <p className="hero-rise mt-5 max-w-2xl text-base leading-relaxed text-slate-400 [--d:120ms] md:text-xl">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="hero-fade-rise inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400 [--d:350ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            <b data-motion="decode" className="font-heading font-bold text-white">{TOTAL_MINUTES_LABEL}</b> {t("badgeMinutes")}
          </span>
          <span className="hero-fade-rise inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400 [--d:430ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            {PROOF.collaborators.join(" · ")}
          </span>
          <span className="hero-fade-rise inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400 [--d:510ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            {t("badgeActivations")} {PROOF.brands.join(" · ")}
          </span>
        </div>

        <div className="hero-fade-rise mt-8 flex flex-wrap gap-3 [--d:600ms]">
          <Cta href="/contact" event="cta_discuter_projet" eventParams={{ from: "hero" }}>{t("ctaPrimary")} →</Cta>
          <Cta href="/realisations" variant="ghost" event="cta_voir_realisations" eventParams={{ from: "hero" }}>{t("ctaSecondary")}</Cta>
        </div>
        <p className="hero-fade-rise mt-5 flex items-center gap-2 text-sm text-slate-500 [--d:700ms]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-light shadow-[0_0_8px] shadow-primary-light" />
          {t("tagline")}
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Update `src/components/sections/PageHero.tsx`** — replace the inner content block (eyebrow → proof line) with:

```tsx
        <p data-motion="decode" className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        <div data-text={title} className="hero-glitch hero-rise mt-4 font-heading text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-5xl">
          <h1 className="hero-sweep bg-clip-text text-transparent">{title}</h1>
        </div>
        <p className="hero-rise mt-5 max-w-2xl text-base leading-relaxed text-slate-400 [--d:120ms] md:text-lg">{subtitle}</p>
        {(primaryCta || secondaryCta) && (
          <div className="hero-fade-rise mt-7 flex flex-wrap gap-3 [--d:300ms]">
            {primaryCta && <Cta href={primaryCta.href} event="cta_discuter_projet">{primaryCta.label} →</Cta>}
            {secondaryCta && <Cta href={secondaryCta.href} variant="ghost">{secondaryCta.label}</Cta>}
          </div>
        )}
        {showProof && (
          <p className="hero-fade-rise mt-7 text-sm text-slate-500 [--d:420ms]">
            <span data-motion="decode" className="font-heading font-bold text-white">{TOTAL_MINUTES_LABEL}</span> {t("hero.badgeMinutes")} · {PROOF.collaborators.join(" · ")}
          </p>
        )}
```

- [ ] **Step 6: Append the hero CSS to `src/app/motion.css`**

```css
/* ---- Hero entrance: CSS only (never waits for JS). LCP text stays opaque from frame 1. ---- */
@keyframes hero-rise { from { transform: translateY(24px); filter: blur(8px); } to { transform: none; filter: none; } }
@keyframes hero-fade-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.hero-rise { animation: hero-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0ms) both; }
.hero-fade-rise { animation: hero-fade-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0ms) both; }

/* Gradient headline (replaces Tailwind's bg-gradient on the h1) + one-shot light sweep */
.hero-sweep {
  background-image:
    linear-gradient(100deg, transparent 42%, rgba(255, 255, 255, 0.9) 50%, transparent 58%),
    linear-gradient(to right, #ffffff, #cdb6ff, #00d4ff);
  background-size: 250% 100%, 100% 100%;
  background-repeat: no-repeat;
  background-position: 150% 0, 0 0;
  animation: hero-sweep 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;
}
@keyframes hero-sweep { from { background-position: 150% 0, 0 0; } to { background-position: -60% 0, 0 0; } }

/* One-shot RGB-split glitch drawn by the wrapper's pseudo-elements (data-text = headline) */
.hero-glitch { position: relative; }
.hero-glitch::before,
.hero-glitch::after {
  content: attr(data-text);
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
}
.hero-glitch::before { color: #00d4ff; animation: hero-glitch-a 0.6s steps(1) 0.35s both; }
.hero-glitch::after { color: #ff3ea5; animation: hero-glitch-b 0.6s steps(1) 0.35s both; }
@keyframes hero-glitch-a {
  0% { opacity: 0.85; transform: translate(-5px, 0); clip-path: inset(8% 0 62% 0); }
  20% { transform: translate(4px, 0); clip-path: inset(48% 0 22% 0); }
  40% { transform: translate(-3px, 0); clip-path: inset(28% 0 50% 0); }
  60% { transform: translate(5px, 0); clip-path: inset(70% 0 6% 0); }
  80% { transform: translate(-2px, 0); clip-path: inset(15% 0 70% 0); }
  100% { opacity: 0; transform: none; clip-path: inset(0 0 100% 0); }
}
@keyframes hero-glitch-b {
  0% { opacity: 0.8; transform: translate(5px, 0); clip-path: inset(60% 0 12% 0); }
  20% { transform: translate(-4px, 0); clip-path: inset(18% 0 58% 0); }
  40% { transform: translate(3px, 0); clip-path: inset(40% 0 36% 0); }
  60% { transform: translate(-5px, 0); clip-path: inset(5% 0 78% 0); }
  80% { transform: translate(2px, 0); clip-path: inset(66% 0 10% 0); }
  100% { opacity: 0; transform: none; clip-path: inset(0 0 100% 0); }
}

/* WebGL background: fades in on first frame; the CSS grid overlay fades out (the shader draws its own) */
.motion-shader.is-live { opacity: 1; }
.hero-grid { transition: opacity 1s ease; }
.motion-shader.is-live ~ .hero-grid { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .hero-rise,
  .hero-fade-rise,
  .hero-sweep,
  .hero-glitch::before,
  .hero-glitch::after { animation: none; }
}
```

- [ ] **Step 7: Checkpoint** — `npx tsc --noEmit && npx eslint src && npm test` → clean.

- [ ] **Step 8: Verify (browser pane)**

Reload `/` at desktop size; take a screenshot at ~0.4 s (glitch/sweep in flight) and one at 4 s. Run:
```js
await new Promise(r => setTimeout(r, 4000));
({ live: !!document.querySelector(".motion-shader.is-live"),
   gridHidden: getComputedStyle(document.querySelector(".hero-grid")).opacity === "0",
   h1Opacity: getComputedStyle(document.querySelector("h1")).opacity,
   lcp: await new Promise(r => new PerformanceObserver(l => r(l.getEntries().at(-1)?.element?.tagName)).observe({ type: "largest-contentful-paint", buffered: true })) })
```
Expected: `live: true, gridHidden: true, h1Opacity: "1", lcp: "H1"` or `"P"` (hero text — never a late element). Scroll 600 px and screenshot (content drifts, canvas pauses when off-screen). Navigate to `/services`: screenshot the PageHero glitch/sweep. Mobile preset: screenshot `/` hero.

---

### Task 5: Pointer layer — magnetic, tilt, glow, cursor

**Files:**
- Create: `src/lib/motion/presets/pointer.ts`, `src/lib/motion/cursor.ts`
- Modify: `src/lib/motion/geometry.ts`, `src/lib/motion/geometry.test.ts`, `src/lib/motion/presets/index.ts`, `src/lib/motion/engine.ts`, `src/components/ui/Cta.tsx`, `src/components/sections/Audiences.tsx`, `src/components/sections/ServicesGrid.tsx`, `src/app/motion.css`

**Interfaces:**
- Consumes: `PresetRun`, `initMotion` internals (`globalCleanups`).
- Produces: `tiltAngles(px: number, py: number, max?: number): { rotationX: number; rotationY: number }`; presets `magnetic` (`[data-magnetic]`), `tilt` (`[data-tilt]`), `glow` (`[data-glow]`); `initCursor(): Cleanup`; cursor states from `[data-cursor="view"]` and links/buttons; CSS vars `--mx/--my` on tilt/glow elements.

- [ ] **Step 1: Add the failing tests** — append to `src/lib/motion/geometry.test.ts` (and add `tiltAngles` to its import):

```ts
describe("tiltAngles", () => {
  it("is flat at the centre", () => {
    const a = tiltAngles(0.5, 0.5);
    expect(a.rotationX).toBeCloseTo(0);
    expect(a.rotationY).toBeCloseTo(0);
  });
  it("reaches ±max at the corners", () => {
    expect(tiltAngles(0, 0)).toEqual({ rotationX: 8, rotationY: -8 });
    expect(tiltAngles(1, 1, 10)).toEqual({ rotationX: -10, rotationY: 10 });
  });
  it("clamps pointer positions outside the element", () => {
    expect(tiltAngles(2, -1)).toEqual(tiltAngles(1, 0));
  });
});
```
Update the import line to `import { shouldAnimate, tiltAngles } from "./geometry";`.

- [ ] **Step 2: Run to verify failure** — `npm test -- src/lib/motion/geometry.test.ts` → FAIL (`tiltAngles` not exported).

- [ ] **Step 3: Implement** — append to `src/lib/motion/geometry.ts`:

```ts
/** Pointer position inside an element (0..1 per axis) → 3D tilt in degrees, clamped to ±max. */
export function tiltAngles(px: number, py: number, max = 8): { rotationX: number; rotationY: number } {
  const cx = Math.min(Math.max(px, 0), 1) - 0.5;
  const cy = Math.min(Math.max(py, 0), 1) - 0.5;
  return { rotationX: -cy * 2 * max, rotationY: cx * 2 * max };
}
```
Run `npm test` → pass.

- [ ] **Step 4: Create `src/lib/motion/presets/pointer.ts`**

```ts
import { gsap } from "gsap";
import { tiltAngles } from "../geometry";
import type { Cleanup, PresetRun } from "../types";

const finePointer = () => window.matchMedia("(pointer: fine)").matches;

// Shared pointer tracking: exposes --mx/--my (for the CSS glare/border) and normalised coords.
function trackPointer(el: HTMLElement, onMove: (px: number, py: number) => void, onLeave: () => void): Cleanup {
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    onMove(px, py);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", onLeave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", onLeave);
  };
}

/** Button pulled toward the pointer (strength 0.3), springs back on leave. */
export const magnetic: PresetRun = (els) => {
  if (!finePointer()) return;
  const cleanups = els.map((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    return trackPointer(
      el,
      (px, py) => {
        const r = el.getBoundingClientRect();
        x((px - 0.5) * r.width * 0.3);
        y((py - 0.5) * r.height * 0.3);
      },
      () => {
        x(0);
        y(0);
      },
    );
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};

/** 3D tilt (max 8°) + glare + neon border (CSS .motion-tilt). */
export const tilt: PresetRun = (els) => {
  if (!finePointer()) return;
  const cleanups = els.map((el) => {
    el.classList.add("motion-tilt");
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
    const off = trackPointer(
      el,
      (px, py) => {
        const a = tiltAngles(px, py);
        rx(a.rotationX);
        ry(a.rotationY);
      },
      () => {
        rx(0);
        ry(0);
      },
    );
    return () => {
      off();
      el.classList.remove("motion-tilt");
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};

/** Pointer spotlight only (wide rows where tilt would look wrong). */
export const glow: PresetRun = (els) => {
  if (!finePointer()) return;
  const cleanups = els.map((el) => {
    el.classList.add("motion-glow");
    const off = trackPointer(el, () => undefined, () => undefined);
    return () => {
      off();
      el.classList.remove("motion-glow");
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};
```
Register in `presets/index.ts`: `import { glow, magnetic, tilt } from "./pointer";` and append
```ts
  ["[data-magnetic]", magnetic],
  ["[data-tilt]", tilt],
  ["[data-glow]", glow],
```

- [ ] **Step 5: Create `src/lib/motion/cursor.ts`**

```ts
import { gsap } from "gsap";
import type { Cleanup } from "./types";

const LINKS = "a, button, [role='button'], input, textarea, select, label";

/** Dot + trailing ring. Mouse only; the native cursor stays visible (decorative, aria-hidden). */
export function initCursor(): Cleanup {
  if (!window.matchMedia("(pointer: fine)").matches) return () => undefined;
  const dot = document.createElement("div");
  dot.className = "motion-cursor motion-cursor-dot is-hidden";
  const ring = document.createElement("div");
  ring.className = "motion-cursor motion-cursor-ring is-hidden";
  const arrow = document.createElement("span");
  arrow.textContent = "↗";
  ring.append(arrow);
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.append(dot, ring);

  const dx = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    dot.classList.remove("is-hidden");
    ring.classList.remove("is-hidden");
    dx(e.clientX);
    dy(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
  };
  const over = (e: PointerEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const view = Boolean(target?.closest("[data-cursor='view']"));
    ring.classList.toggle("is-view", view);
    ring.classList.toggle("is-link", !view && Boolean(target?.closest(LINKS)));
  };
  const hide = () => {
    dot.classList.add("is-hidden");
    ring.classList.add("is-hidden");
  };
  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", over);
  document.documentElement.addEventListener("pointerleave", hide);

  return () => {
    window.removeEventListener("pointermove", move);
    document.removeEventListener("pointerover", over);
    document.documentElement.removeEventListener("pointerleave", hide);
    dot.remove();
    ring.remove();
  };
}
```
In `engine.ts`: add `import { initCursor } from "./cursor";` and change the globals line to
`const globalCleanups: Cleanup[] = [offScrollTrigger, initProgressBar(lenis), initCursor()];`

- [ ] **Step 6: Apply the attributes**

Replace `src/components/ui/Cta.tsx` with:
```tsx
"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";

type Variant = "primary" | "ghost" | "micro";

interface CtaProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  event?: string;
  eventParams?: Record<string, string>;
  external?: boolean;
  className?: string;
}

// No transform transition / hover lift: the motion engine owns transform (data-magnetic).
const base = "inline-flex items-center justify-center gap-2 font-heading font-bold uppercase tracking-wider transition-[color,background-color,border-color,box-shadow]";
const styles: Record<Variant, string> = {
  primary:
    "h-12 rounded-md bg-gradient-to-r from-primary to-accent px-7 text-[13px] text-surface-dark shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30",
  ghost:
    "h-12 rounded-md border border-white/15 bg-white/[0.02] px-7 text-[13px] text-white hover:border-accent hover:text-accent",
  micro: "text-[13px] normal-case tracking-normal text-accent hover:text-accent-dark",
};

export function Cta({ href, children, variant = "primary", event, eventParams, external, className }: CtaProps) {
  function onClick() {
    if (event) track(event, eventParams);
  }
  const cls = cn(base, styles[variant], className);
  const magnetic = variant === "micro" ? undefined : "";

  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} onClick={onClick} data-magnetic={magnetic} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href as never} onClick={onClick} data-magnetic={magnetic} className={cls}>
      {children}
    </Link>
  );
}
```

`src/components/sections/Audiences.tsx` — the article becomes:
```tsx
              <article data-tilt className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-surface to-surface/40 p-6 transition-colors hover:border-accent/45">
```
`src/components/sections/ServicesGrid.tsx` — the card div becomes:
```tsx
              <div data-tilt className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-accent/40 hover:bg-accent/[0.04]">
```

- [ ] **Step 7: Append the pointer CSS to `src/app/motion.css`**

```css
/* ---- Pointer layer (classes added by the engine on fine pointers only) ---- */
.motion-tilt,
.motion-glow { position: relative; }
.motion-tilt::after,
.motion-glow::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(0, 212, 255, 0.13), transparent 45%);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.motion-tilt::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 1px;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(0, 212, 255, 0.9), transparent 60%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.motion-tilt:hover::before,
.motion-tilt:hover::after,
.motion-glow:hover::after { opacity: 1; }

/* Cursor (dot + ring, positioned by GSAP x/y) */
.motion-cursor { position: fixed; left: 0; top: 0; z-index: 80; pointer-events: none; border-radius: 9999px; transition: opacity 0.2s ease; }
.motion-cursor.is-hidden { opacity: 0; }
.motion-cursor-dot { width: 6px; height: 6px; margin: -3px 0 0 -3px; background: #00d4ff; }
.motion-cursor-ring {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: -18px 0 0 -18px;
  border: 1px solid rgba(0, 212, 255, 0.6);
  color: #0a0a0f;
  font: 700 20px/1 var(--font-orbitron), sans-serif;
  transition: width 0.3s ease, height 0.3s ease, margin 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, opacity 0.2s ease;
}
.motion-cursor-ring span { opacity: 0; transition: opacity 0.2s ease; }
.motion-cursor-ring.is-link { width: 56px; height: 56px; margin: -28px 0 0 -28px; border-color: transparent; background: #ffffff; mix-blend-mode: difference; }
.motion-cursor-ring.is-view { width: 84px; height: 84px; margin: -42px 0 0 -42px; border-color: #00d4ff; background: #00d4ff; }
.motion-cursor-ring.is-view span { opacity: 1; }
```

- [ ] **Step 8: Checkpoint** — tsc / eslint / tests clean.

- [ ] **Step 9: Verify (browser pane)**

Desktop, `/`, wait 4 s, `document.querySelector("#pour-qui").scrollIntoView()`, then `computer {action:"hover"}` over the centre-left of the first audience card; screenshot (tilt + glare + neon edge + cursor ring). Hover the hero primary CTA edge → screenshot (button pulled, ring in difference mode).
```js
({ cursors: document.querySelectorAll(".motion-cursor").length,
   tilted: document.querySelectorAll(".motion-tilt").length,
   magnetic: document.querySelectorAll("[data-magnetic]").length })
```
Expected: `cursors: 2, tilted ≥ 4, magnetic ≥ 3`.
Touch check: `resize_window {preset:"mobile"}`, reload, wait 4 s → `document.querySelectorAll(".motion-cursor, .motion-tilt").length` → `0`. Reset to desktop.

---

### Task 6: Réalisations — pinned horizontal gallery

**Files:**
- Create: `src/lib/motion/presets/gallery.ts`
- Modify: `src/lib/motion/presets/index.ts`, `src/components/sections/Realisations.tsx`

**Interfaces:**
- Consumes: `PresetRun` (uses `env.lenis`), `data-tilt`, `data-cursor="view"`.
- Produces: `ProjectGrid({ items, variant?: "grid" | "gallery" })`; markup contract `[data-motion="gallery"] > [data-gallery-track] > [data-motion="reveal"] … [data-gallery-img]`; class `.is-pinned` on the gallery wrapper while pinned.

- [ ] **Step 1: Create `src/lib/motion/presets/gallery.ts`**

```ts
import { gsap } from "gsap";
import type { PresetRun } from "../types";

// Pinned horizontal gallery on desktop (≥ 1024 px). Below that the grid is untouched; without the
// engine the wrapper is a native horizontal scroller of the same height (no layout shift on upgrade).
export const gallery: PresetRun = (els, { lenis }) => {
  const mm = gsap.matchMedia();
  for (const el of els) {
    const track = el.querySelector<HTMLElement>("[data-gallery-track]");
    const section = el.closest("section");
    if (!track || !section) continue;
    mm.add("(min-width: 1024px)", () => {
      el.scrollLeft = 0;
      el.classList.add("is-pinned");
      const distance = () => Math.max(0, track.scrollWidth - el.clientWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      track.querySelectorAll<HTMLElement>("[data-gallery-img]").forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          },
        );
      });
      // Keyboard: a focused card that is translated off-screen gets scrolled into view.
      const onFocus = (e: FocusEvent) => {
        const st = tween.scrollTrigger;
        const card = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>("[data-motion='reveal']") : null;
        if (!st || !card) return;
        const offset = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
        const progress = Math.min(Math.max(offset / Math.max(distance(), 1), 0), 1);
        lenis.scrollTo(st.start + (st.end - st.start) * progress, { immediate: true });
      };
      track.addEventListener("focusin", onFocus);
      return () => {
        track.removeEventListener("focusin", onFocus);
        el.classList.remove("is-pinned");
      };
    });
  }
  return () => mm.revert();
};
```
Register in `presets/index.ts` **between split and reveal**: `import { gallery } from "./gallery";` and `['[data-motion="gallery"]', gallery],`.

- [ ] **Step 2: Rewrite `ProjectGrid` + `Realisations` in `src/components/sections/Realisations.tsx`**

```tsx
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { REALISATIONS_META, type ProjectCardMeta } from "@/content/realisations";
import { cn } from "@/lib/utils";

type ProjectText = { type: string; objective: string };

interface ProjectGridProps {
  items: ProjectCardMeta[];
  /** "gallery" = pinned horizontal scroll on desktop (homepage only). */
  variant?: "grid" | "gallery";
}

export async function ProjectGrid({ items, variant = "grid" }: ProjectGridProps) {
  const t = await getTranslations("b2b.realisations");
  const projects = t.raw("projects") as Record<string, ProjectText>;
  const minU = t("units.minutes");
  const favU = t("units.favorites");
  const isGallery = variant === "gallery";

  const cards = items.map((p) => {
    const tx = projects[p.id];
    const result = `${p.minutesPlayed} ${minU} · ${p.favorites} ${favU} · v${p.version}`;
    return (
      <ScrollReveal key={p.id} className={cn(isGallery && "lg:w-[26rem] lg:shrink-0 lg:snap-start")}>
        <article data-tilt data-cursor="view" className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-surface transition-colors hover:border-accent/45">
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1b1430] to-[#0c1730]">
            <div data-gallery-img={isGallery ? "" : undefined} className={cn("absolute inset-0", isGallery && "lg:inset-x-[-10%]")}>
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                sizes={isGallery ? "(max-width: 1024px) 100vw, 500px" : "(max-width: 768px) 100vw, 380px"}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/10 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-surface-dark/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent backdrop-blur-sm">{tx.type}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="font-heading text-base font-bold text-white">
              {/* Stretched link: the whole card opens the map page, link name = title */}
              <Link
                href={`/maps/${p.id}` as `/maps/${string}`}
                className="after:absolute after:inset-0 after:z-[2] after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent"
              >
                {p.title}
              </Link>
            </h3>
            <p className="text-sm text-slate-400">{tx.objective}</p>
            <p className="mt-auto flex items-center gap-2 pt-2 text-sm font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
              {result}
            </p>
          </div>
        </article>
      </ScrollReveal>
    );
  });

  if (!isGallery) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>;
  return (
    <div data-motion="gallery" className="lg:snap-x lg:snap-mandatory lg:overflow-x-auto lg:pb-4 lg:[&.is-pinned]:overflow-visible">
      <div data-gallery-track className="grid gap-4 sm:grid-cols-2 lg:flex lg:w-max lg:gap-6">
        {cards}
      </div>
    </div>
  );
}

export async function Realisations() {
  const t = await getTranslations("b2b.realisations");
  return (
    <section id="realisations" className="overflow-x-clip bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="mt-12">
          <ProjectGrid items={REALISATIONS_META} variant="gallery" />
        </div>
        <div className="mt-9">
          <Cta href="/realisations" variant="micro" event="cta_voir_realisations">{t("ctaAll")} →</Cta>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Checkpoint** — tsc / eslint / tests clean.

- [ ] **Step 4: Verify pinning (browser pane, desktop 1440-ish)**

`/`, wait 4 s, `document.querySelector("#realisations").scrollIntoView()`, wait 1 s:
```js
({ pinned: document.querySelector('[data-motion="gallery"]').classList.contains("is-pinned"),
   spacers: document.querySelectorAll(".pin-spacer").length,
   x0: getComputedStyle(document.querySelector("[data-gallery-track]")).transform })
```
Expected: `pinned: true, spacers: 1`. Scroll 800 px further, wait 1.5 s, read `transform` again → translateX negative (matrix 5th value < 0). Screenshot mid-gallery.

- [ ] **Step 5: Verify card links** — `document.querySelectorAll('#realisations a[href*="/maps/"]').length` → `6`; click the first card's image area → URL ends with `/maps/clutch-realistics-1v2`. Go back.

- [ ] **Step 6: Verify `/realisations` keeps the grid** — navigate `/realisations`, wait 2 s: `document.querySelectorAll('[data-motion="gallery"]').length` → `0`, and 6 card links exist.

- [ ] **Step 7: Review Focus 2 — resize across 1024 px**

On `/`, `resize_window {width: 800, height: 900}`, wait 1.5 s:
```js
({ spacers: document.querySelectorAll(".pin-spacer").length,
   pinned: document.querySelector('[data-motion="gallery"]').classList.contains("is-pinned"),
   overflow: document.documentElement.scrollWidth > innerWidth })
```
Expected: `{ spacers: 0, pinned: false, overflow: false }`. `resize_window {preset:"desktop"}`, wait 1.5 s → `spacers: 1, pinned: true, overflow: false`.

- [ ] **Step 8: Review Focus 3 — keyboard into the gallery**

```js
const links = document.querySelectorAll('#realisations a[href*="/maps/"]');
links[links.length - 1].focus();
await new Promise(r => setTimeout(r, 800));
const r = links[links.length - 1].getBoundingClientRect();
r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight
```
Expected: `true`.

---

### Task 7: Marquee, Process progress line, FinalCta drift

**Files:**
- Create: `src/lib/motion/velocity.ts`, `src/lib/motion/velocity.test.ts`, `src/lib/motion/presets/marquee.ts`, `src/lib/motion/presets/progressLine.ts`, `src/components/motion/Marquee.tsx`
- Modify: `src/lib/motion/presets/index.ts`, `src/app/[locale]/page.tsx`, `src/components/sections/Process.tsx`, `src/components/sections/FinalCta.tsx`, `src/app/motion.css`

**Interfaces:**
- Consumes: `PresetRun` (`env.lenis.velocity`), `parallax` (`data-axis="x"`).
- Produces: `marqueeRate(velocity: number, prevDirection: 1 | -1): { rate: number; direction: 1 | -1 }`; `<Marquee />`; markup contracts `[data-motion="marquee"] .motion-marquee-track` and `[data-steps] [data-motion="progress-line"] … [data-step]` (`.is-active` toggled).

- [ ] **Step 1: Write the failing test `src/lib/motion/velocity.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { marqueeRate } from "./velocity";

describe("marqueeRate", () => {
  it("idles at base speed in the last direction", () => {
    expect(marqueeRate(0, 1)).toEqual({ rate: 1, direction: 1 });
    expect(marqueeRate(0, -1)).toEqual({ rate: -1, direction: -1 });
  });
  it("follows the scroll direction and speeds up with velocity", () => {
    expect(marqueeRate(16, -1)).toEqual({ rate: 3, direction: 1 });
    expect(marqueeRate(-16, 1)).toEqual({ rate: -3, direction: -1 });
  });
  it("caps the boost at 5× base speed", () => {
    expect(marqueeRate(1000, 1).rate).toBe(5);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/lib/motion/velocity.test.ts` → FAIL (module missing).

- [ ] **Step 3: Create `src/lib/motion/velocity.ts`**

```ts
// Pure: scroll velocity (Lenis px/frame) → marquee playback rate — unit-tested in velocity.test.ts.
export function marqueeRate(velocity: number, prevDirection: 1 | -1): { rate: number; direction: 1 | -1 } {
  const direction: 1 | -1 = velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : prevDirection;
  const boost = Math.min(Math.abs(velocity) / 8, 4);
  return { rate: direction * (1 + boost), direction };
}
```
Run `npm test` → pass.

- [ ] **Step 4: Create the presets**

`src/lib/motion/presets/marquee.ts`:
```ts
import { gsap } from "gsap";
import { marqueeRate } from "../velocity";
import type { PresetRun } from "../types";

// The loop is a CSS animation (.motion-marquee-track); the engine only bends its speed and
// direction with the scroll velocity, easing toward the target so reversals glide through 0.
export const marquee: PresetRun = (els, { lenis }) => {
  const anims = els.flatMap((el) => el.querySelector(".motion-marquee-track")?.getAnimations() ?? []);
  if (anims.length === 0) return;
  let direction: 1 | -1 = 1;
  let current = 1;
  const update = () => {
    const next = marqueeRate(lenis.velocity, direction);
    direction = next.direction;
    current += (next.rate - current) * 0.1;
    anims.forEach((anim) => {
      anim.playbackRate = current;
    });
  };
  gsap.ticker.add(update);
  return () => {
    gsap.ticker.remove(update);
    anims.forEach((anim) => {
      anim.playbackRate = 1;
    });
  };
};
```
`src/lib/motion/presets/progressLine.ts`:
```ts
import { gsap } from "gsap";
import type { PresetRun } from "../types";

// Scrubbed scaleX line across a [data-steps] block; [data-step] children light up in order.
export const progressLine: PresetRun = (els) => {
  for (const line of els) {
    const scope = line.closest<HTMLElement>("[data-steps]");
    if (!scope) continue;
    const steps = Array.from(scope.querySelectorAll<HTMLElement>("[data-step]"));
    gsap.fromTo(
      line,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          start: "top 75%",
          end: "bottom 60%",
          scrub: true,
          onUpdate: ({ progress }) => {
            steps.forEach((step, i) => step.classList.toggle("is-active", progress >= (i + 0.5) / steps.length));
          },
        },
      },
    );
  }
};
```
Final `src/lib/motion/presets/index.ts`:
```ts
import type { PresetRun } from "../types";
import { decode } from "./decode";
import { gallery } from "./gallery";
import { marquee } from "./marquee";
import { parallax } from "./parallax";
import { glow, magnetic, tilt } from "./pointer";
import { progressLine } from "./progressLine";
import { reveal } from "./reveal";
import { split } from "./split";

// Order matters: presets that change layout (split, gallery pin) run before the ones that measure.
export const PRESETS: ReadonlyArray<readonly [selector: string, run: PresetRun]> = [
  ['[data-motion="split"]', split],
  ['[data-motion="gallery"]', gallery],
  ['[data-motion="reveal"]', reveal],
  ['[data-motion="decode"]', decode],
  ['[data-motion="parallax"]', parallax],
  ['[data-motion="marquee"]', marquee],
  ['[data-motion="progress-line"]', progressLine],
  ["[data-magnetic]", magnetic],
  ["[data-tilt]", tilt],
  ["[data-glow]", glow],
];
```

- [ ] **Step 5: Create `src/components/motion/Marquee.tsx` and add it to the homepage**

```tsx
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";
import { cn } from "@/lib/utils";

const TITLES = (mapsData as FortniteMap[]).map((m) => m.title);

// Decorative marquee of every map title (duplicates real content → aria-hidden). The CSS loop
// runs without JS; the motion engine bends its speed/direction with scroll velocity.
export function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {TITLES.map((title, i) => (
        <span
          key={`${i}-${title}`}
          className={cn(
            "font-heading text-3xl font-extrabold uppercase md:text-5xl",
            i % 2 === 0 ? "text-white/85" : "text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)]",
          )}
        >
          {title}
          <span className="mx-6 text-accent md:mx-10">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div data-motion="marquee" aria-hidden="true" className="overflow-hidden border-y border-white/5 bg-surface-dark py-6 md:py-8">
      <div className="motion-marquee-track flex w-max whitespace-nowrap">
        {row}
        {row}
      </div>
    </div>
  );
}
```
In `src/app/[locale]/page.tsx`: add `import { Marquee } from "@/components/motion/Marquee";` and render `<Marquee />` between `<StatsBand />` and `<Realisations />`.

- [ ] **Step 6: Process progress line** — in `src/components/sections/Process.tsx` replace the grid block with:

```tsx
        <div data-steps className="relative mt-12">
          <div aria-hidden="true" className="absolute inset-x-0 -top-6 hidden h-px bg-white/10 lg:block">
            <div data-motion="progress-line" className="h-full origin-left bg-gradient-to-r from-primary to-accent shadow-[0_0_12px] shadow-accent/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s, i) => (
              <ScrollReveal key={s.title}>
                <div data-step className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors duration-500 [&.is-active]:border-accent/30">
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent font-heading text-sm font-extrabold text-surface-dark transition-shadow duration-500 [.is-active_&]:shadow-[0_0_24px_rgba(0,212,255,0.55)]">{i + 1}</div>
                  <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{s.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
```

- [ ] **Step 7: FinalCta drift** — in `src/components/sections/FinalCta.tsx` replace the two opening lines
```tsx
    <section id={id} className="border-t border-white/5 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(123,47,190,0.16),transparent_70%)] py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-2">
```
with
```tsx
    <section id={id} className="relative overflow-hidden border-t border-white/5 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(123,47,190,0.16),transparent_70%)] py-20 md:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex select-none items-center">
        <div data-motion="parallax" data-axis="x" data-speed="-0.3" className="whitespace-nowrap font-heading text-[22vw] font-extrabold leading-none text-transparent [-webkit-text-stroke:1px_rgba(123,47,190,0.28)]">
          KAIOCORP KAIOCORP
        </div>
      </div>
      <div className="relative z-10 mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-2">
```

- [ ] **Step 8: Append to `src/app/motion.css`**

```css
/* ---- Marquee: CSS loop, speed/direction bent by the engine ---- */
.motion-marquee-track { animation: motion-marquee 45s linear infinite; }
@keyframes motion-marquee { to { transform: translateX(-50%); } }

@media (prefers-reduced-motion: reduce) {
  .motion-marquee-track { animation: none; }
}
```

- [ ] **Step 9: Checkpoint** — tsc / eslint / tests clean.

- [ ] **Step 10: Verify (browser pane)** — `/`, wait 4 s, scroll to the marquee; read `document.querySelector(".motion-marquee-track").getAnimations()[0].playbackRate` while idle (≈ 1), then immediately after `window.scrollBy(0, 1500)` (> 1), then after `window.scrollBy(0, -1500)` (< 0). Scroll to `#process` + 300 px: `document.querySelectorAll("[data-step].is-active").length` → between 1 and 6; screenshot. Scroll to `#contact`: screenshot the outlined KAIOCORP drift behind the form; `document.documentElement.scrollWidth <= innerWidth` → `true`.

---

### Task 8: Maps pages — leaderboard + map detail

**Files:**
- Modify: `src/components/maps/MapRow.tsx`, `src/components/maps/MapLeaderboard.tsx`, `src/app/[locale]/maps/[id]/page.tsx`, `src/app/motion.css`

**Interfaces:**
- Consumes: `data-glow`, `data-cursor="view"`, `data-motion="decode"|"parallax"`, `motion:rescan`.
- Produces: CSS `.motion-kenburns`.

- [ ] **Step 1: MapRow** — in `src/components/maps/MapRow.tsx`:
- the row link opening tag becomes:
```tsx
      <Link href={`/maps/${map.id}` as `/maps/${string}`} data-glow data-cursor="view" className={cn("group relative flex items-center gap-4 overflow-hidden rounded-lg border px-4 py-3 transition-all hover:scale-[1.01] hover:shadow-lg md:px-6 md:py-4", map.featured ? "border-yellow-500/15 bg-surface-light hover:border-yellow-500/30 hover:shadow-yellow-500/5" : "border-white/5 bg-surface-light hover:border-accent/20 hover:shadow-accent/5")}>
```
- the three stat values get `data-motion="decode"`:
```tsx
          <div className="text-end"><p data-motion="decode" className="font-heading text-xs font-bold text-white">{map.stats.minutesPlayed}</p><p className="text-[10px] text-slate-400">{t("played")}</p></div>
          <div className="text-end"><p data-motion="decode" className="font-heading text-xs font-bold text-white">{map.stats.favorites}</p><p className="text-[10px] text-slate-400">{t("favorites")}</p></div>
          <div className="text-end"><p data-motion="decode" className="font-heading text-xs font-bold text-white">{map.stats.allTimePeak.toLocaleString("en-US")}</p><p className="text-[10px] text-slate-400">{t("peakCcu")}</p></div>
```

- [ ] **Step 2: MapLeaderboard rescan on filter change** — in `src/components/maps/MapLeaderboard.tsx`: import `useEffect, useRef` alongside `useMemo, useState`, and inside the component after the `maps` memo:

```tsx
  // New rows mounted by a filter change → ask the motion engine to animate them.
  const firstFilter = useRef(true);
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    window.dispatchEvent(new Event("motion:rescan"));
  }, [filter]);
```

- [ ] **Step 3: Map detail page** — in `src/app/[locale]/maps/[id]/page.tsx`:
- thumbnail frame:
```tsx
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface">
            <div data-motion="parallax" data-speed="0.12" className="absolute inset-[-8%]">
              <Image src={map.thumbnail} alt={map.title} fill sizes="(max-width:1024px) 100vw,640px" priority className="motion-kenburns object-cover" />
            </div>
          </div>
```
- stat tile value: `<p data-motion="decode" className="font-heading text-lg font-bold text-white">{s.v}</p>`;
- related-map link opening tag becomes:
```tsx
                <Link key={r.id} href={`/maps/${r.id}` as `/maps/${string}`} data-glow className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-white/5 bg-surface-light/30 p-3 transition-all hover:border-accent/20">
```

- [ ] **Step 4: Append to `src/app/motion.css`**

```css
/* ---- Map detail: slow Ken Burns (transform only — LCP-safe, painted from frame 1) ---- */
.motion-kenburns { animation: motion-kenburns 12s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes motion-kenburns { from { transform: scale(1.08); } to { transform: scale(1); } }

@media (prefers-reduced-motion: reduce) {
  .motion-kenburns { animation: none; }
}
```

- [ ] **Step 5: Checkpoint** — tsc / eslint / tests clean.

- [ ] **Step 6: Verify (browser pane)** — `/maps`, wait 4 s: `document.querySelectorAll(".motion-glow").length` → `16`; `document.querySelectorAll("main [data-decoded]").length` ≥ 9 (visible rows at 1440 px). Click the "Knzi" filter, wait 1.5 s: exactly 1 row, its computed opacity `"1"`. Click "All", wait 1.5 s, run the Task 2 `hiddenInView` check → `0`. Hover a row → screenshot (spotlight + ring). Open `/maps/sprite-pillars`: screenshot at 0.5 s and 6 s (Ken Burns), stat tiles decoded.

---

### Task 9: Site chrome — header hide/show + page transitions

**Files:**
- Create: `src/lib/motion/header.ts`, `src/lib/motion/header.test.ts`, `src/app/[locale]/template.tsx`
- Modify: `src/components/layout/Header.tsx`, `src/app/motion.css`

**Interfaces:**
- Consumes: `motion:refresh` (engine listener from Task 2).
- Produces: `nextHeaderHidden(s: { y: number; lastY: number; hidden: boolean; locked: boolean }): boolean`; CSS `.motion-curtain`, `.motion-page-enter`.

- [ ] **Step 1: Write the failing test `src/lib/motion/header.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { nextHeaderHidden } from "./header";

const base = { y: 500, lastY: 480, hidden: false, locked: false };

describe("nextHeaderHidden", () => {
  it("hides when scrolling down past the threshold", () => {
    expect(nextHeaderHidden(base)).toBe(true);
  });
  it("shows when scrolling up", () => {
    expect(nextHeaderHidden({ ...base, y: 460, lastY: 480, hidden: true })).toBe(false);
  });
  it("never hides near the top of the page", () => {
    expect(nextHeaderHidden({ ...base, y: 100, lastY: 60 })).toBe(false);
  });
  it("never hides while locked (menu open or focus inside)", () => {
    expect(nextHeaderHidden({ ...base, locked: true })).toBe(false);
  });
  it("keeps its state on tiny scroll jitter", () => {
    expect(nextHeaderHidden({ ...base, y: 482, lastY: 480, hidden: true })).toBe(true);
    expect(nextHeaderHidden({ ...base, y: 482, lastY: 480, hidden: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test -- src/lib/motion/header.test.ts` → FAIL.

- [ ] **Step 3: Create `src/lib/motion/header.ts`**

```ts
// Pure: should the fixed header be hidden after this scroll step? — unit-tested in header.test.ts.
export interface HeaderScrollState {
  y: number;
  lastY: number;
  hidden: boolean;
  /** true while the mobile menu is open or focus is inside the header */
  locked: boolean;
}

const TOP_ZONE = 120; // px from the top where the header always shows
const JITTER = 4; // px of movement ignored

export function nextHeaderHidden({ y, lastY, hidden, locked }: HeaderScrollState): boolean {
  if (locked || y < TOP_ZONE) return false;
  const dy = y - lastY;
  if (dy > JITTER) return true;
  if (dy < -JITTER) return false;
  return hidden;
}
```
Run `npm test` → pass.

- [ ] **Step 4: Header** — in `src/components/layout/Header.tsx`:
- imports: `import { useState, useEffect, useRef } from "react";` and `import { nextHeaderHidden } from "@/lib/motion/header";`
- state/refs after `const [open, setOpen] = useState(false);`:
```tsx
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const openRef = useRef(false);
  const lastY = useRef(0);
```
- replace the scroll effect with:
```tsx
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const locked = openRef.current || Boolean(headerRef.current?.contains(document.activeElement));
      setHidden((h) => nextHeaderHidden({ y, lastY: lastY.current, hidden: h, locked }));
      lastY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    openRef.current = open;
    if (open) setHidden(false);
  }, [open]);
```
- the `<header>` opening tag:
```tsx
    <header
      ref={headerRef}
      onFocus={() => setHidden(false)}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-300 motion-reduce:transition-none",
        hidden && "-translate-y-full",
        scrolled ? "border-b border-white/5 bg-surface-dark/85 backdrop-blur-md" : "bg-transparent",
      )}
    >
```

- [ ] **Step 5: Page transition** — create `src/app/[locale]/template.tsx`:

```tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Module scope survives client navigations but not a full load → the first render (the one
// Lighthouse measures) never plays the transition.
let hasMounted = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [enter, setEnter] = useState(false);
  const [curtain, setCurtain] = useState(false);
  const ran = useRef(false); // StrictMode runs layout effects twice in dev

  useIsoLayoutEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (hasMounted && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnter(true);
      setCurtain(true);
    }
    hasMounted = true;
  }, []);

  return (
    <>
      {curtain && <div aria-hidden="true" className="motion-curtain" onAnimationEnd={() => setCurtain(false)} />}
      <div
        className={enter ? "motion-page-enter" : undefined}
        onAnimationEnd={(e) => {
          // Re-measure ScrollTriggers once the entering page stops moving.
          if (e.target === e.currentTarget) window.dispatchEvent(new Event("motion:refresh"));
        }}
      >
        {children}
      </div>
    </>
  );
}
```
Append to `src/app/motion.css`:
```css
/* ---- Page transition (client navigations only — see app/[locale]/template.tsx) ---- */
.motion-curtain {
  position: fixed;
  inset: 0;
  z-index: 70;
  pointer-events: none;
  background: linear-gradient(120deg, #7b2fbe, #00d4ff);
  transform-origin: 50% 0;
  animation: motion-curtain 0.65s cubic-bezier(0.76, 0, 0.24, 1) both;
}
@keyframes motion-curtain { from { transform: scaleY(1); } to { transform: scaleY(0); } }
.motion-page-enter { animation: motion-page-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s backwards; }
@keyframes motion-page-enter { from { opacity: 0; transform: translateY(24px); } }

@media (prefers-reduced-motion: reduce) {
  .motion-curtain,
  .motion-page-enter { animation: none; }
}
```

- [ ] **Step 6: Checkpoint + Review Focus 3 (header/skip link)**

`npx tsc --noEmit && npx eslint src && npm test` → clean. Browser: `/`, wait 4 s, `window.scrollTo(0, 1500)`, wait 0.6 s → `document.querySelector("header").getBoundingClientRect().bottom <= 0` → `true` (hidden). Then `document.querySelector("header a").focus()`, wait 0.4 s → `getBoundingClientRect().top === 0` → `true`. Skip link: `window.scrollTo(0,0)`, focus the "Skip to content" link and press Enter (`computer {action:"key", text:"Return"}`), then `document.activeElement.id` or `location.hash` → focus/hash is `main-content`.

- [ ] **Step 7: Review Focus 1 — navigation round-trips**

Fresh load `/` (no curtain: `document.querySelectorAll(".motion-curtain").length` → `0` right after load). Click header "Réalisations" → screenshot at ~0.2 s (curtain wiping), wait 2 s. `history.back()`, wait 2.5 s, then:
```js
const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
({ cursors: document.querySelectorAll(".motion-cursor").length,
   hiddenInView: [...document.querySelectorAll('[data-motion="reveal"]')].filter(e => inView(e) && getComputedStyle(e).opacity === "0").length })
```
Expected: `cursors: 2, hiddenInView: 0`. Scroll to `#realisations`, wait 1 s → `document.querySelectorAll(".pin-spacer").length` → `1` and pinned. Switch locale via the LanguageSwitcher to EN → repeat the object check → same expectations.

---

### Task 10: Final verification, Lighthouse, docs

**Files:**
- Create: `reports/lighthouse/motion-*.json` (gitignored raw), scratch `rm-check.mjs` in the scratchpad (not in the repo)
- Modify: `specs/2026-09-26-motion-design.md`, `.claude/rules/components.md`, `CLAUDE.md`, `CACHE.md`

- [ ] **Step 1: Production build** — stop the dev server (`preview_stop`), then `npm run build`. Expected: exit 0, no type/lint errors, page count ≥ 125.

- [ ] **Step 2: Serve** — `npx next start -p 3100` (run in background). Check the debug Chrome: `node -e "fetch('http://127.0.0.1:9222/json/version').then(r=>r.json()).then(j=>console.log(j.Browser)).catch(()=>console.log('NO CHROME'))"`. If `NO CHROME`, ask the user to start `launch_chrome_debug.bat` and wait.

- [ ] **Step 3: Reduced-motion check** — write `<scratchpad>/rm-check.mjs`:

```js
// Usage: node rm-check.mjs <url>  — opens a tab in the debug Chrome with prefers-reduced-motion: reduce
const base = "http://127.0.0.1:9222";
const tab = await (await fetch(`${base}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
};
await new Promise((r) => (ws.onopen = r));
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Page.navigate", { url: process.argv[2] });
await new Promise((r) => setTimeout(r, 6000));
const { result } = await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `(() => { window.scrollTo(0, document.body.scrollHeight); return ({
    reduced: document.documentElement.dataset.motion,
    ready: document.documentElement.classList.contains("motion-ready"),
    lenis: document.documentElement.classList.contains("lenis"),
    liveCanvas: !!document.querySelector(".motion-shader.is-live"),
    hidden: [...document.querySelectorAll("main *")].filter(e => e.tagName !== "CANVAS" && getComputedStyle(e).opacity === "0" && e.getBoundingClientRect().height > 0).length
  }); })()`,
});
console.log(JSON.stringify(result.value));
await fetch(`${base}/json/close/${tab.id}`);
ws.close();
```
Run for `/`, `/realisations`, `/maps` on `http://localhost:3100`. Expected each: `{"reduced":"reduced","ready":false,"lenis":false,"liveCanvas":false,"hidden":0}`.

- [ ] **Step 4: Lighthouse (6 runs)**

```bash
for p in "" realisations maps; do n=${p:-home}
  npx lighthouse "http://localhost:3100/$p" --port=9222 --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="reports/lighthouse/motion-$n-desktop.json" --quiet
  npx lighthouse "http://localhost:3100/$p" --port=9222 --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="reports/lighthouse/motion-$n-mobile.json" --quiet
done
node -e "for (const f of require('fs').readdirSync('reports/lighthouse').filter(f=>f.startsWith('motion-'))) { const j=require('./reports/lighthouse/'+f); const c=j.categories; const a=j.audits; console.log(f.padEnd(34), ['performance','accessibility','best-practices','seo'].map(k=>Math.round(c[k].score*100)).join('/'), 'LCP', a['largest-contentful-paint'].displayValue, 'TBT', a['total-blocking-time'].displayValue, 'CLS', a['cumulative-layout-shift'].displayValue) }"
```
Expected: every line Perf ≥ 95, A11y 100, BP 100, CLS ≤ 0.02. **If any threshold misses:** stop and use superpowers:systematic-debugging on that JSON (LCP element, long tasks, layout-shift elements) — likely levers: longer idle timeout, lower shader scale, lazier SplitText. Do not relax the thresholds without asking the user.

- [ ] **Step 5: Console** — in the browser pane against `http://localhost:3100`, visit `/`, `/realisations`, `/maps`, `/maps/sprite-pillars`, scroll each to the bottom, then `read_console_messages {onlyErrors:true}` → none.

- [ ] **Step 6: Final screenshots** — desktop + mobile of: hero, StatsBand/marquee, pinned gallery mid-scroll, Process, FinalCta, `/maps`, `/maps/sprite-pillars`, a page transition mid-curtain. Send them to the user (SendUserFile).

- [ ] **Step 7: Docs**
- `specs/2026-09-26-motion-design.md`: apply the 9 "Deviations from the spec" (plan header) to §3.4 (anchors false + stopInertiaOnNavigate), §4 (grid overlay fade, parallax on content, 0.75× scale), §5 (card links, cascades via batch), §3.2 (parallax `data-axis`), §7 (hover lifts replaced), §9 (file list incl. `cursor.ts`, `progressBar.ts`, pure helpers, vitest). Status → "implemented".
- `.claude/rules/components.md`: replace the Framer Motion line with: `- Motion: add data-motion / data-* attributes (reveal, split, decode, parallax, gallery, marquee, progress-line, data-magnetic, data-tilt, data-glow, data-cursor) — the engine in src/lib/motion animates them. Never import gsap in components; hero entrance = CSS classes in src/app/motion.css.`
- `CLAUDE.md`: Status line → `16 maps`; Tech Stack line `Framer Motion` → `GSAP (ScrollTrigger, SplitText) + Lenis via the data-motion engine (src/lib/motion)`; Data section "15 entries" → "16 entries"; add Gotcha: `Motion: LCP text (hero h1/subtitle) must never start at opacity 0; split only on solid-colour text; reduced motion = engine never loads.`
- `CACHE.md`: new top entry (date 2026-09-26) — what shipped, Lighthouse table, deviations, anything left open.

- [ ] **Step 8: Whole-branch review** — dispatch the project's `code-reviewer` agent on `git diff` (all changes since `68a979c`) with the spec + this plan; fix confirmed findings, re-run tsc / eslint / tests / build.

- [ ] **Step 9: Hand-off** — report results to the user (scores table, screenshots, deviations incl. the card-links change). Do **not** commit or push unless asked.
