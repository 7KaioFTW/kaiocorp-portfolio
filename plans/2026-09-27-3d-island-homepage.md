# 3D "Floating Island" Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the kaiocorp.com homepage into a scroll-driven, real-time three.js journey (island → map ring → stat pillars → portal) that carries the real B2B sections, with a poster/static fallback, an "Expérience 3D" toggle and full disposal. SEO, accessibility and the other pages must not regress.

**Architecture:** Vanilla three.js 0.170 modules in `src/lib/three/island/` port `playground/3d-proto-a-island.html` block by block. Each scene module is a small `Unit` (`update(frame, vis)` / `resize()`) that `world.ts` builds (yielding between modules) and drives from a camera progress `p`. `IslandJourney.tsx` is a thin client component. It decides the quality tier, measures the real homepage sections into scroll anchors, and lazy-loads `world.ts` after `load` + idle with the motion engine's `afterLoadIdle`. It runs the rAF loop and disposes everything on unmount or toggle-off. It imports only three-free modules statically. The homepage sections get a `variant="over3d"` (transparent background, dark glass panel). Réalisations and Stats become CSS-sticky chapters, and a pre-paint inline boot script sets `html[data-island]` so those heights never pop in.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind 3, next-intl 4 (defaultLocale `fr`), three `^0.170.0` + `@types/three` `^0.170.0` (addons from `three/examples/jsm/...`), existing motion engine (GSAP + Lenis, `src/lib/motion`), Vitest 4 (`npm test`, node env), sharp (poster), headless Chromium via CDP (verification only).

**Spec:** `specs/2026-09-27-3d-island-homepage.md` (binding contract; read it first). Visual source of truth: `playground/3d-proto-a-island.html` (1677 lines, read it fully). Motion system this integrates with: `specs/2026-09-26-motion-design.md` §12.

## Global Constraints

- Dependency: `three@^0.170.0` (resolves to 0.170.0) + `@types/three@^0.170.0`. Addons are imported from `three/examples/jsm/...js`. No React Three Fiber. No model or texture files other than the existing map thumbnails and `public/images/island-poster.webp` (≤ 80 KB).
- Everything 3D is client-only. There is no module-level `window`/`document` access in `src/lib/three/**` (DOM use happens inside functions). `world.ts` and everything importing three is reached **only** through `await import("@/lib/three/island/world")`, called inside `afterLoadIdle`. `IslandJourney`, `Toggle3D` and `MapFocusCard` statically import only three-free modules: `progress`, `quality`, `store`, `countUp`, `motion/idle`, and `import type`.
- Lighthouse on home: **desktop Perf ≥ 90, mobile Perf ≥ 80, A11y 100, BP 100, CLS ≤ 0.02**. Other pages stay unchanged (≥ 95 mobile). The known exception is BP 96 on `/maps`, caused by the missing `sprite-pillars.jpg` thumbnail returning 400.
- No WebGL, reduced motion with the toggle off, or a low-end tier → poster + readable static homepage, nothing hidden, **zero console errors or warnings**.
- Navigating away from home disposes everything: no WebGL context, rAF loop or listener is left behind.
- Every task ends with `npx tsc --noEmit` = 0 errors, `npx eslint src` = 0 problems, and `npm test` all green. The final task also requires `npm run build` = 0 errors (Rulebook R1.2).
- **No git commits** unless the user explicitly asks. Each task ends with a verification checkpoint instead of a commit.
- Lenis is owned by the motion engine; never create or destroy it here. Also forbidden: `history.scrollRestoration`, global `scrollTo` from app code, `body` class toggles, and rewriting real content text. The stat count-up only writes to an `aria-hidden` layer, and an `sr-only` sibling keeps the final value.
- Canvas: `position: fixed; inset: 0; aria-hidden; pointer-events: none` (z-index −1, see Ruling 1).
- Reduced motion defaults to tier `off`. The toggle choice persists in `localStorage` key `kc-island-3d`, with every access wrapped in try/catch.
- Copy, locales and data are unchanged, except the homepage section order and the new toggle/list strings (Ruling 12).
- Styling: Tailwind classes in components; custom CSS only in `src/app/motion.css` (imported after `globals.css`); no `!important` in project CSS (test-injected styles are fine). FR apostrophes in raw JSX use `’`.
- Components: one per file, named exports, `{Name}Props` interfaces, `cn()` for conditional classes.
- This Windows machine reports `prefers-reduced-motion: reduce`. Every motion/3D check **must emulate `no-preference`** (the CDP `session({ reducedMotion: "no-preference" })` default).
- GLSL port convention: `⟪prototype Lx–Ly⟫` inside a template literal means "paste the text between the backticks of the prototype template literal spanning lines x–y, verbatim". Keep its `${GLSL_NOISE}` / `${GLSL_FOG_ADD}` / `${GLSL_SDF}` / `${SCR_W…}` interpolations exactly as written. Every port task ends with `grep -rn "⟪" src/lib/three` → **no output**.

## Rulings on spec ambiguities (report these to the user; update the spec in Task 14)

1. **Canvas layer uses z-index −1, not 0.** The body background propagates to the viewport because `<html>` has none. So a fixed layer at z-index −1 paints above it and below every in-flow section **and the footer**, and no shared layout component has to change. At z-index 0 the canvas would cover the non-positioned footer.
2. **Poster location:** the poster is the Hero's background image (`next/image`, `priority`). It fades out once the first 3D frame is live and stays in place for the static fallback. Over3d sections are always transparent over the dark body, and their glass panels carry the content. The spec's "those remain … for the fallback" is read as: the components' **default** variants keep their gradients, the HeroShader and the gallery for other pages.
3. **The 10 ring maps** are a fixed list in `src/content/realisations.ts` (`RING_MAPS`, the prototype's 10 in prototype order), with every field taken from `maps.json`. Each `tag` must be one of that map's `maps.json` tags. `boxfight-2v2-ranked` uses `BOXFIGHT` because the prototype's "Ranked" is not a data tag. `sprite-pillars` is excluded because its thumbnail file is missing.
4. **Pillar heights:** the prototype's descending heights 8.6 / 7.0 / 5.8 / 4.8 are kept, one pillar per StatsBand stat. The numbers come from `stats.ts`. The four stats have incompatible units, so data-proportional heights would be meaningless. *(User may override.)*
5. **Stats labels:** the StatsBand HTML sits under the pillars as a glass grid (4 columns on desktop, 2×2 on mobile), and each number counts up with its pillar's reveal. They are **not** projected onto the pillar tips every frame, which removes a class of resize bugs. At 1440 px the grid columns line up with the pillars.
6. **Prototype chrome is not ported:** the loader, chapter rail, progress bar, ALT/CAP readout, scroll hint and scrims. The site header, the motion progress bar and the glass panels replace them. "Readouts" in spec §4 = MapFocusCard + stat numbers.
7. **Toggle "on"** overrides reduced motion, saveData and deviceMemory < 4, giving tier `medium` on constrained devices. It never overrides missing WebGL2. A software-only GL context (`failIfMajorPerformanceCaveat`) counts as "no WebGL" unless the visitor opted in.
8. **Adaptive step-down ladder** (the prototype stepped down once): the scale goes DPR 1.5 → 1 → 0.85, MSAA is capped at 2 once stepping (samples follow DPR down), then MSAA goes to 0. Below 20 fps the world jumps straight to the floor. If it is still below 20 fps at the floor, it gives up and shows the poster. Measurement uses **unclamped** frame times over 150 frames, after a 30-frame warm-up.
9. **Cloud zones:** each of the 4 zone InstancedMeshes gets a computed bounding sphere (+1.5 for the vertex drift) and automatic frustum culling. Two zones also have p-gates: background (`p < 0.25 || p > 0.8`) and portal (`p > 0.55`). The medium tier's −40 % applies to the sea, background and portal clusters. The 8 camera-path clusters (the dive and climb veil) are never thinned.
10. **Reduced motion with 3D opted in:** the intro swoop, speed-FOV kick, the speed-driven chromatic-aberration kick and the grain are all off. The idle bob amplitude is 0: island, satellites, screens, pillars, portal sway and camera roll wobble. Pointer parallax stays because it is user-driven.
11. **Count-up accessibility:** the visible count-up layer is `aria-hidden`, with the final value in an `sr-only` sibling (the same pattern as `decode`).
12. **New i18n keys** `b2b.island.{toggle,on,off,ringList}` go into the 4 routed locales only (fr/en/es/de), consistent with the earlier `{billions}` change. They are needed by spec §6, even though §2 says "no copy change".
13. **Helper modules beyond the spec's 18:** `math`, `chapters`, `types`, `dispose`, `geometry`, `store`, `boot`, `countUp`, plus `src/components/ui/Glass.tsx`.
14. **Thumbnails no longer block the first frame** (the prototype waited up to 9 s). Screens stay dark until their image arrives.
15. **A dev-only `window.__island` handle** (`stats`, `anchors`, `scrollFor(p)`) exists for the e2e scripts, like the engine's `__motion`. It is stripped from production by `process.env.NODE_ENV`. The prototype's debug hooks are not ported.
16. **`<html suppressHydrationWarning>`** is added in `app/[locale]/layout.tsx`, because the boot script sets `data-island` before hydration.
17. **Home Hero becomes full height** (`min-h-[100svh]`). In over3d, the Hero tagline and the FinalCta note use slate-400 (contrast over the sky). FinalCta over3d drops the outlined KAIOCORP drift because the portal replaces it.
18. **"Turning it on loads the world immediately" (spec §6)** goes through the same `afterLoadIdle`. After load, that fires on the next idle period (≤ 1.5 s timeout), so the world starts right away without competing with the click handler.

## Review Focus

1. **Resize / orientation change while pinned in the ring chapter.** Canvas size, camera aspect, anchors, sticky offsets and MapFocusCard must follow. No stretched frame, no horizontal scroll, and the focus link must stay valid. → Task 10 Step 9.
2. **Long FR/DE copy or late height changes** (FAQ `<details>` opened, font swap) after the first measurement: the camera must stay in sync with the sections, with p at each chapter start within ±0.01. → Task 6 Step 12.
3. **Client navigation home → /maps → home (×5), including navigating away mid-load:** no leaked WebGL context, rAF loop, window listener or heap growth; exactly one canvas on home. → Task 6 Step 13.
4. **Low-end GPU / slow frames:** the step-down ladder runs, then the poster fallback, with no console errors, and the page stays usable. The user can force 3D back on. → Task 7 Step 7.
5. **Reduced motion × stored preference × toggle combinations**, including rapid toggling and an OS setting change mid-visit: correct state and label, poster or 3D, a fresh canvas each time, no layout shift. → Task 7 Step 5.

---

## Verification toolkit (read once, used from Task 5 on)

- **Existing tools** (previous session's scratchpad, referred to as `$TOOLS`): `C:\Users\Kaio\AppData\Local\Temp\claude\C--Users-Kaio-Documents-Claude-Portfolio\e32a3b64-a8d6-4aac-bd21-46ffd09a8edc\scratchpad`
  - `cdp.mjs`: minimal CDP driver. It reads `CDP_PORT`, and `session({ width, height, mobile, reducedMotion })` → `goto / eval(body) / shot / mouse / click / wheel / key / send / on / close / logs`. `eval` wraps `body` in an async function, so use `return …`.
  - `record-proto.mjs`: CDP screencast + ffmpeg video recorder.
  - `static-server.mjs`: serves the repo root on :4000 (for the prototype).
  - `lh/lh-run.mjs` (+ `lh/node_modules` with lighthouse and puppeteer-core): Lighthouse Node API runner.
- **Your scratchpad** (`$S`, from your system prompt) is where every e2e script goes (`$S/island/*.mjs`). At the start of Task 5, copy the tools:
  ```bash
  mkdir -p "$S/island/ref" && cp "$TOOLS"/{cdp.mjs,record-proto.mjs,static-server.mjs} "$S/" && cp -r "$TOOLS/lh" "$S/lh"
  ```
  If `$TOOLS` is gone, recreate `cdp.mjs` from **Appendix A**, and run `cd "$S/lh" && npm i lighthouse puppeteer-core` (Task 13 gives `lh-run.mjs` in full). `static-server.mjs` is a 20-line `node:http` file server rooted at `C:/Users/Kaio/Documents/Claude/Portfolio`; rewrite it if missing.
- **Browser:** the debug Chrome on :9222 is **not** running. Use Playwright's Chromium, headless, on the real GPU (Bash, `run_in_background: true`):
  ```bash
  "/c/Users/Kaio/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe" --headless=new --remote-debugging-port=9333 --user-data-dir="$S/chromium-prof" --ignore-gpu-blocklist --no-first-run --no-default-browser-check about:blank
  ```
  Check it with `curl -s http://127.0.0.1:9333/json/version` (JSON with `"Browser"`). If 9333 is taken, pick another free port and use it for `CDP_PORT` everywhere. Every script runs as `CDP_PORT=9333 node "$S/island/<script>.mjs"`.
- **Servers:** dev = `npm run dev` (background, http://localhost:3000; the functional e2e runs on dev because it needs the `__island` handle). Prod = `npm run build && npm start` (Lighthouse, video, bundle). Stop one before starting the other; both use port 3000.
- **Motion:** `session()` defaults to `reducedMotion: "no-preference"`. Pass `"reduce"` only to test the fallback.
- **Screenshots:** read the PNGs with the Read tool to look at them. Compare against the prototype reference frames captured in Task 6 (`$S/island/ref/proto-<w>-<p>.png`).

## File Structure

**New — `src/lib/three/island/`** (pure = no three and no DOM; safe in the initial bundle)

| File | Responsibility | Task |
|---|---|---|
| `math.ts` (+ `math.test.ts`) | pure: `clamp, lerp, sstep, easeOutCubic, damp, DEG` | 1 |
| `rng.ts` (+ test) | pure: `mulberry32`, `hashName`, `rngFor(name)`, one seeded stream per module | 1 |
| `noise.ts` (+ test) | `fbm`, `GLSL_NOISE`, `GLSL_FOG_ADD`, `fogUniforms()` | 1 |
| `progress.ts` (+ test) | pure: `ChapterBoxes` → `buildAnchors` → `progressAt` / `scrollForProgress` | 2 |
| `quality.ts` (+ test) | pure: `Preference`, `selectTier`, `settingsFor`, `stepDown`, `decidePerf`, `readSignals` | 3 |
| `store.ts` (+ test) | pure: `islandStore` (pref/status/focus/unsupported), `readPreference` / `writePreference` / `safeStorage` | 3 |
| `boot.ts` (+ test) | pure: `ISLAND_BOOT_SCRIPT`, the pre-paint `html[data-island]` decision (parity with `selectTier`) | 3 |
| `countUp.ts` (+ test) | pure: `countUpText(final, t)` | 3 |
| `chapters.ts` (+ test) | pure: world-layout constants, `visibilityAt`, `pillarReveal`, `portalCharge`, `deepness`, `cloudVeil` | 4 |
| `cameraPath.ts` (+ test) | `CAMERA_KEYS`, `segmentAt`, `sampleScalars` (pure); `createCameraRig` (CatmullRom) | 4 |
| `dispose.ts` (+ test) | `DisposeBag`, `disposeGraph(root)` | 4 |
| `types.ts` | `RingMapInfo`, `SceneContext`, `FrameState`, `Unit` | 4 |
| `lights.ts` | lights, `addPointLight` (constant light count), `withRim` | 6 |
| `sky.ts` | sky dome + PMREM environment | 6 |
| `post.ts` | composer, bloom, grade (MSAA/bloom follow the render scale; grain uniform) | 6 |
| `world.ts` | `createWorld(canvas, opts, signal)` → `World`: build, camera, atmosphere, perf ladder, resize, dispose | 6 (+8–11) |
| `geometry.ts` | `blobGeometry`, `composeMatrix`, `createGeometryKit` (crystal geometry, glow sprite) | 8 |
| `terrain.ts` | `makeIsland`, `segDist`, `createMainIsland` | 8 |
| `water.ts` | pond, stream, waterfall | 8 |
| `vegetation.ts` | trees, flowers (bounded loop), boulders | 8 |
| `crystals.ts` | crystal material, clusters, core, satellites, debris | 8 |
| `clouds.ts` (+ test) | `cloudPlan` (tiers), 4 zone InstancedMeshes | 9 |
| `particles.ts` | fireflies + dust (tiered counts) | 9 |
| `mapRing.ts` | 10 screens, tracks, floor, label/thumbnail loaders, focus callback | 10 |
| `pillars.ts` | 4 stat pillars, reveal callback, portrait layout | 11 |
| `portal.ts` | ring, frame, disc, arcs, shards, swirl | 11 |

**New — components, content, assets**

| File | Responsibility | Task |
|---|---|---|
| `src/components/ui/Glass.tsx` | `SectionVariant` type + `Glass` panel wrapper | 5 |
| `src/components/three/IslandJourney.tsx` | tier decision, chapter measurement, lazy world, rAF loop, stats count-up binding, dispose | 6 |
| `src/components/three/Toggle3D.tsx` | "Expérience 3D" `aria-pressed` switch | 7 |
| `src/components/three/MapFocusCard.tsx` | focused ring map card with a real `/maps/[id]` link | 10 |
| `src/content/realisations.test.ts` | `RING_MAPS` contract | 5 |
| `public/images/island-poster.webp` | placeholder (Task 5), real render ≤ 80 KB (Task 12) | 5, 12 |

**Modified:** `package.json` / `package-lock.json` (1); `src/content/realisations.ts` (`RING_MAPS`) (5); `src/messages/{fr,en,es,de}.json` (5); `src/app/motion.css` (5); `src/app/[locale]/layout.tsx` (5); `src/app/[locale]/page.tsx` (5, 6); `src/components/sections/{Hero,Opportunity,Audiences,ServicesGrid,Realisations,StatsBand,Process,WhyKaio,SectorIdeas,FaqB2B,FinalCta}.tsx` (5; Hero again in 7, Realisations in 10); `src/components/motion/Marquee.tsx` (5); docs `CACHE.md`, `CLAUDE.md`, `.claude/rules/components.md`, spec (14).

---

### Task 1: three.js dependency + deterministic foundations

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/lib/three/island/math.ts`, `src/lib/three/island/math.test.ts`, `src/lib/three/island/rng.ts`, `src/lib/three/island/rng.test.ts`, `src/lib/three/island/noise.ts`, `src/lib/three/island/noise.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `math.ts`: `DEG: number`; `clamp(x, min = 0, max = 1): number`; `lerp(a, b, t): number`; `sstep(a, b, x): number`; `easeOutCubic(t): number`; `damp(a, b, k, dt): number`.
  - `rng.ts`: `interface Rng { next(): number; range(min: number, max: number): number }`; `WORLD_SEED = 20260927`; `mulberry32(seed: number): () => number`; `hashName(name: string): number`; `rngFor(name: string): Rng`.
  - `noise.ts`: `fbm(nz: SimplexNoise, x, y, octaves = 4): number`; `GLSL_NOISE: string`; `GLSL_FOG_ADD: string`; `fogUniforms(extra?: Record<string, THREE.IUniform>): Record<string, THREE.IUniform>`.

- [ ] **Step 1: Install three + types**

```bash
npm install three@^0.170.0 && npm install -D @types/three@^0.170.0
```
Expected: `package.json` has `"three": "^0.170.0"` in `dependencies` and `"@types/three": "^0.170.0"` in `devDependencies`. `npm ls three @types/three` shows `three@0.170.0` and `@types/three@0.170.0`.

- [ ] **Step 2: Verify the addon paths exist in the installed packages**

```bash
ls node_modules/three/examples/jsm/postprocessing/{EffectComposer,RenderPass,UnrealBloomPass,OutputPass,ShaderPass}.js node_modules/three/examples/jsm/math/SimplexNoise.js node_modules/three/examples/jsm/utils/BufferGeometryUtils.js
ls node_modules/@types/three/examples/jsm/postprocessing/{EffectComposer,RenderPass,UnrealBloomPass,OutputPass,ShaderPass}.d.ts node_modules/@types/three/examples/jsm/math/SimplexNoise.d.ts node_modules/@types/three/examples/jsm/utils/BufferGeometryUtils.d.ts
node -e "const p=require('./node_modules/three/package.json');console.log(p.version, p.exports['./examples/jsm/*'])"
```
Expected: all 14 files listed without "No such file", then `0.170.0 ./examples/jsm/*`.

- [ ] **Step 3: Write the failing tests** (`src/lib/three/island/math.test.ts`, `src/lib/three/island/rng.test.ts`)

```ts
// src/lib/three/island/math.test.ts
import { describe, expect, it } from "vitest";
import { clamp, damp, easeOutCubic, lerp, sstep } from "./math";

describe("math helpers", () => {
  it("clamp defaults to [0, 1]", () => {
    expect(clamp(-2)).toBe(0);
    expect(clamp(3)).toBe(1);
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("lerp interpolates", () => {
    expect(lerp(2, 4, 0.25)).toBe(2.5);
  });
  it("sstep works with reversed edges (the prototype calls sstep(0.72, 0.4, x))", () => {
    expect(sstep(0.72, 0.4, 0.8)).toBe(0);
    expect(sstep(0.72, 0.4, 0.3)).toBe(1);
    expect(sstep(0.72, 0.4, 0.56)).toBeCloseTo(0.5, 6);
  });
  it("easeOutCubic clamps its input", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 6);
  });
  it("damp is frame-rate independent", () => {
    const oneStep = damp(0, 1, 4.2, 1 / 60);
    const twoSteps = damp(damp(0, 1, 4.2, 1 / 120), 1, 4.2, 1 / 120);
    expect(oneStep).toBeCloseTo(twoSteps, 10);
    expect(damp(0, 1, 4.2, 10)).toBeCloseTo(1, 6);
  });
});
```

```ts
// src/lib/three/island/rng.test.ts
import { describe, expect, it } from "vitest";
import { WORLD_SEED, hashName, mulberry32, rngFor } from "./rng";

describe("mulberry32", () => {
  it("reproduces the prototype's sequence for its seed", () => {
    const r = mulberry32(WORLD_SEED);
    expect(r()).toBeCloseTo(0.5817536343820393, 15);
    expect(r()).toBeCloseTo(0.3177114331629127, 15);
    expect(r()).toBeCloseTo(0.3009456454310566, 15);
  });
});

describe("hashName", () => {
  it("is 32-bit FNV-1a", () => {
    expect(hashName("")).toBe(2166136261);
    expect(hashName("a")).toBe(3826002220);
    expect(hashName("vegetation")).toBe(803490637);
  });
});

describe("rngFor", () => {
  it("is deterministic per module name", () => {
    const a = rngFor("vegetation");
    const b = rngFor("vegetation");
    const seqA = [a.next(), a.next(), a.next()];
    expect([b.next(), b.next(), b.next()]).toEqual(seqA);
    expect(seqA[0]).toBeCloseTo(0.22288738936185837, 15);
  });
  it("gives each module its own stream", () => {
    expect(rngFor("clouds").next()).toBeCloseTo(0.7726212288253009, 15);
    expect(rngFor("clouds").next()).not.toBe(rngFor("vegetation").next());
  });
  it("is unaffected by how much another module consumed", () => {
    const untouched = rngFor("clouds").next();
    const other = rngFor("vegetation");
    for (let i = 0; i < 1000; i++) other.next();
    expect(rngFor("clouds").next()).toBe(untouched);
  });
  it("range() stays within [min, max)", () => {
    const r = rngFor("range-test");
    for (let i = 0; i < 1000; i++) {
      const v = r.range(-2, 3);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThan(3);
    }
  });
});
```

- [ ] **Step 4: Run them and watch them fail**

Run: `npx vitest run src/lib/three/island`
Expected: FAIL, with `Failed to resolve import "./math"` and `"./rng"`.

- [ ] **Step 5: Implement `math.ts` and `rng.ts`**

```ts
// src/lib/three/island/math.ts
// Scalar helpers shared by the island modules (prototype lines 265–271). Pure — no three, no DOM.
export const DEG = Math.PI / 180;

export const clamp = (x: number, min = 0, max = 1): number => Math.min(max, Math.max(min, x));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Smoothstep; works with reversed edges (a > b), which the prototype relies on. */
export const sstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);

/** Frame-rate independent exponential approach of `a` toward `b` (rate `k` per second). */
export const damp = (a: number, b: number, k: number, dt: number): number => lerp(a, b, 1 - Math.exp(-k * dt));
```

```ts
// src/lib/three/island/rng.ts
// Seeded randomness for the procedural island. One independent stream per scene module
// (`rngFor("clouds")`), so adding, skipping or reordering a module never changes another's layout.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  range(min: number, max: number): number;
}

export const WORLD_SEED = 20260927;

/** mulberry32 — the prototype's generator (playground/3d-proto-a-island.html:272). */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32-bit FNV-1a hash of a module name. */
export function hashName(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function rngFor(name: string): Rng {
  const next = mulberry32((WORLD_SEED ^ hashName(name)) >>> 0);
  return { next, range: (min, max) => min + (max - min) * next() };
}
```

- [ ] **Step 6: Run them and watch them pass**

Run: `npx vitest run src/lib/three/island`
Expected: PASS, 2 files, 11 tests.

- [ ] **Step 7: Write the failing noise test** (`src/lib/three/island/noise.test.ts`). It also proves that the addon import path resolves at runtime.

```ts
import { describe, expect, it } from "vitest";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { fbm, fogUniforms } from "./noise";
import { mulberry32 } from "./rng";

describe("fbm", () => {
  it("is deterministic for a seeded SimplexNoise and stays within (-1, 1)", () => {
    const a = fbm(new SimplexNoise({ random: mulberry32(3) }), 0.3, 0.7);
    const b = fbm(new SimplexNoise({ random: mulberry32(3) }), 0.3, 0.7);
    expect(a).toBe(b);
    expect(Math.abs(a)).toBeLessThan(1);
  });
});

describe("fogUniforms", () => {
  it("clones the fog uniforms per call and keeps extras by reference", () => {
    const uTime = { value: 0 };
    const u1 = fogUniforms({ uTime });
    const u2 = fogUniforms({ uTime });
    expect(Object.keys(u1)).toEqual(expect.arrayContaining(["fogColor", "fogDensity", "fogNear", "fogFar", "uTime"]));
    expect(u1.fogColor).not.toBe(u2.fogColor);
    expect(u1.uTime).toBe(uTime);
  });
});
```
Run: `npx vitest run src/lib/three/island/noise.test.ts`. Expected: FAIL, `Failed to resolve import "./noise"`.

- [ ] **Step 8: Implement `noise.ts`** (prototype 262–296)

```ts
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
```

- [ ] **Step 9: Verify**

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: vitest all green (the existing 30 tests + 13 new); tsc prints nothing; eslint prints nothing. tsc passing here proves the `three/examples/jsm/...` type paths resolve.

---

### Task 2: Scroll → camera progress (`progress.ts`)

**Files:**
- Create: `src/lib/three/island/progress.ts`, `src/lib/three/island/progress.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface Anchor { readonly y: number; readonly p: number }`
  - `interface ChapterBoxes { viewport; maxScroll; heroBottom; ringTop; ringHeight; ringStage; statsTop; statsHeight; statsStage; ctaTop; ctaHeight }` (all `number`, document px)
  - `CHAPTER_P = { heroEnd: 0.14, ringStart: 0.27, ringEnd: 0.556, statsStart: 0.59, statsEnd: 0.8, ctaStart: 0.906, end: 1 }`
  - `stickyRange(sectionTop, sectionHeight, stage, viewport): [number, number]`
  - `buildAnchors(b: ChapterBoxes): Anchor[]`
  - `progressAt(scrollY: number, anchors: readonly Anchor[]): number`
  - `scrollForProgress(p: number, anchors: readonly Anchor[]): number`

Mapping (spec §3.2): hero 0 → 0.14 over the hero. Opportunity/Audiences/Services 0.14 → 0.27, ending when the ring stage pins. The ring runs 0.27 → 0.556 while its stage is pinned. The gap 0.556 → 0.59 runs across the section boundary. Stats run 0.59 → 0.80 while pinned. The climb runs 0.80 → 0.906, ending when the CTA top enters the viewport bottom. The CTA runs 0.906 → 1, ending when the CTA is fully in view (capped at maxScroll).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/three/island/progress.test.ts
import { describe, expect, it } from "vitest";
import { buildAnchors, progressAt, scrollForProgress, stickyRange, type ChapterBoxes } from "./progress";

// A 900 px viewport, ring 300vh and stats 150vh (spec §3.2), stages exactly one viewport tall.
const BOXES: ChapterBoxes = {
  viewport: 900,
  maxScroll: 9500,
  heroBottom: 900,
  ringTop: 3000,
  ringHeight: 2700,
  ringStage: 900,
  statsTop: 5700,
  statsHeight: 1350,
  statsStage: 900,
  ctaTop: 9000,
  ctaHeight: 1000,
};

describe("stickyRange", () => {
  it("pins a viewport-tall stage from the section top for (height − viewport) px", () => {
    expect(stickyRange(3000, 2700, 900, 900)).toEqual([3000, 4800]);
  });
  it("pins a taller-than-viewport stage by its bottom", () => {
    // stage 1100 in a 900 viewport: sticks at top −200 → starts 200 px later, lasts height − stage
    expect(stickyRange(3000, 2700, 1100, 900)).toEqual([3200, 4800]);
  });
  it("never returns an inverted range", () => {
    expect(stickyRange(100, 500, 900, 900)).toEqual([100, 100]);
  });
});

describe("buildAnchors", () => {
  it("maps each chapter boundary to its spec p", () => {
    expect(buildAnchors(BOXES)).toEqual([
      { y: 0, p: 0 },
      { y: 900, p: 0.14 },
      { y: 3000, p: 0.27 },
      { y: 4800, p: 0.556 },
      { y: 5700, p: 0.59 },
      { y: 6150, p: 0.8 },
      { y: 8100, p: 0.906 },
      { y: 9100, p: 1 },
    ]);
  });
  it("ends at maxScroll when the CTA cannot reach the viewport top", () => {
    const anchors = buildAnchors({ ...BOXES, maxScroll: 8700 });
    expect(anchors[anchors.length - 1]).toEqual({ y: 8700, p: 1 });
  });
  it("keeps y non-decreasing when chapters are shorter than expected", () => {
    const anchors = buildAnchors({ ...BOXES, ctaTop: 6200 }); // CTA starts before the stats stage ends + 1 vh
    for (let i = 1; i < anchors.length; i++) expect(anchors[i].y).toBeGreaterThanOrEqual(anchors[i - 1].y);
  });
});

describe("progressAt", () => {
  const anchors = buildAnchors(BOXES);
  it("interpolates inside a chapter", () => {
    expect(progressAt(450, anchors)).toBeCloseTo(0.07, 6);
    expect(progressAt(3900, anchors)).toBeCloseTo(0.413, 6);
    expect(progressAt(5925, anchors)).toBeCloseTo(0.695, 6);
  });
  it("interpolates the ring → stats gap across the section boundary", () => {
    expect(progressAt(5250, anchors)).toBeCloseTo(0.573, 6);
  });
  it("clamps before the first and after the last anchor", () => {
    expect(progressAt(-50, anchors)).toBe(0);
    expect(progressAt(9100, anchors)).toBe(1);
    expect(progressAt(99999, anchors)).toBe(1);
  });
  it("jumps across zero-length segments", () => {
    const degenerate = [
      { y: 0, p: 0 },
      { y: 100, p: 0.2 },
      { y: 100, p: 0.3 },
      { y: 200, p: 0.5 },
    ];
    expect(progressAt(99.999, degenerate)).toBeCloseTo(0.2, 3);
    expect(progressAt(100, degenerate)).toBeCloseTo(0.3, 6);
    expect(progressAt(150, degenerate)).toBeCloseTo(0.4, 6);
  });
  it("returns 0 without anchors (chapters not measured yet)", () => {
    expect(progressAt(500, [])).toBe(0);
  });
});

describe("scrollForProgress", () => {
  const anchors = buildAnchors(BOXES);
  it("inverts progressAt", () => {
    for (const p of [0, 0.07, 0.2, 0.27, 0.413, 0.573, 0.7, 0.906, 0.95, 1]) {
      expect(progressAt(scrollForProgress(p, anchors), anchors)).toBeCloseTo(p, 6);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/three/island/progress.test.ts`
Expected: FAIL, `Failed to resolve import "./progress"`.

- [ ] **Step 3: Implement**

```ts
// src/lib/three/island/progress.ts
// Scroll position → camera progress p ∈ [0, 1] (spec §3.2), driven by the real homepage sections.
// Pure: IslandJourney measures the sections (on load / resize / content change) and passes the boxes in.

/** p reached at document scroll position y. Anchors are sorted by y; progress is linear between them. */
export interface Anchor {
  readonly y: number;
  readonly p: number;
}

/** Document-space measurements (px) of the homepage chapters. */
export interface ChapterBoxes {
  /** documentElement.clientHeight — stable under mobile toolbar show/hide. */
  viewport: number;
  /** scrollHeight − viewport. */
  maxScroll: number;
  heroBottom: number;
  ringTop: number;
  ringHeight: number;
  /** Height of the ring chapter's sticky stage. */
  ringStage: number;
  statsTop: number;
  statsHeight: number;
  statsStage: number;
  ctaTop: number;
  ctaHeight: number;
}

/** Spec §3.2 table: p at each chapter boundary (prototype keyframe space). */
export const CHAPTER_P = {
  heroEnd: 0.14,
  ringStart: 0.27,
  ringEnd: 0.556,
  statsStart: 0.59,
  statsEnd: 0.8,
  ctaStart: 0.906,
  end: 1,
} as const;

/**
 * Scroll range [start, end] during which a sticky stage is pinned inside its section.
 * The stage sticks at `top = min(0, viewport − stage)` (a taller-than-viewport stage pins by its bottom).
 */
export function stickyRange(sectionTop: number, sectionHeight: number, stage: number, viewport: number): [number, number] {
  const stickTop = Math.min(0, viewport - stage);
  const start = sectionTop - stickTop;
  const end = sectionTop + sectionHeight - stage - stickTop;
  return [start, Math.max(start, end)];
}

function monotonic(anchors: Anchor[]): Anchor[] {
  let previous = -Infinity;
  return anchors.map(({ y, p }) => {
    const safeY = Math.max(y, previous);
    previous = safeY;
    return { y: safeY, p };
  });
}

export function buildAnchors(b: ChapterBoxes): Anchor[] {
  const [ringStart, ringEnd] = stickyRange(b.ringTop, b.ringHeight, b.ringStage, b.viewport);
  const [statsStart, statsEnd] = stickyRange(b.statsTop, b.statsHeight, b.statsStage, b.viewport);
  const ctaEnd = Math.min(b.maxScroll, b.ctaTop + Math.max(0, b.ctaHeight - b.viewport));
  return monotonic([
    { y: 0, p: 0 },
    { y: b.heroBottom, p: CHAPTER_P.heroEnd },
    { y: ringStart, p: CHAPTER_P.ringStart },
    { y: ringEnd, p: CHAPTER_P.ringEnd },
    // ringEnd → statsStart is the section boundary: the gap 0.556 → 0.59 is interpolated across it
    { y: statsStart, p: CHAPTER_P.statsStart },
    { y: statsEnd, p: CHAPTER_P.statsEnd },
    { y: b.ctaTop - b.viewport, p: CHAPTER_P.ctaStart },
    { y: ctaEnd, p: CHAPTER_P.end },
  ]);
}

/** Piecewise-linear p at `scrollY`, clamped to the first/last anchor. Zero-length segments jump. */
export function progressAt(scrollY: number, anchors: readonly Anchor[]): number {
  if (anchors.length === 0) return 0;
  if (scrollY <= anchors[0].y) return anchors[0].p;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (scrollY < b.y) return a.p + ((scrollY - a.y) / (b.y - a.y)) * (b.p - a.p);
  }
  return anchors[anchors.length - 1].p;
}

/** Inverse of progressAt: the first scroll position that reaches `p` (used by the dev e2e scripts). */
export function scrollForProgress(p: number, anchors: readonly Anchor[]): number {
  if (anchors.length === 0) return 0;
  if (p <= anchors[0].p) return anchors[0].y;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (p <= b.p && b.p > a.p) return a.y + ((p - a.p) / (b.p - a.p)) * (b.y - a.y);
  }
  return anchors[anchors.length - 1].y;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/lib/three/island/progress.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Verify**

Run: `npm test && npx tsc --noEmit && npx eslint src`. Expected: all green, no output from tsc or eslint.

---

### Task 3: Runtime policy — quality tiers, preference store, boot script, count-up

**Files:**
- Create: `src/lib/three/island/quality.ts`, `quality.test.ts`, `store.ts`, `store.test.ts`, `boot.ts`, `boot.test.ts`, `countUp.ts`, `countUp.test.ts` (all in `src/lib/three/island/`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `quality.ts`: `type Preference = "auto" | "on" | "off"`; `type Tier = "high" | "medium" | "off"`; `interface DeviceSignals { webgl2; reducedMotion; saveData: boolean; deviceMemory: number | undefined; coarsePointer: boolean; devicePixelRatio: number }`; `selectTier(s: DeviceSignals, pref: Preference): Tier`; `interface QualitySettings { tier: "high" | "medium"; dpr; msaa; cloudDetail; cloudCountScale; particleScale; bloomScale }`; `settingsFor(tier, devicePixelRatio): QualitySettings`; `interface RenderScale { dpr: number; msaa: number }`; `type PerfDecision = { kind: "keep" } | { kind: "step"; next: RenderScale } | { kind: "giveUp" }`; `PERF_WINDOW = 150`, `PERF_TARGET_FPS = 45`, `PERF_FLOOR_FPS = 20`; `stepDown(s: RenderScale): RenderScale | null`; `decidePerf(avgFps: number, current: RenderScale): PerfDecision`; `interface SignalSource { matchMedia(q: string): { matches: boolean }; navigator: unknown; devicePixelRatio: number }`; `readSignals(win: SignalSource): Omit<DeviceSignals, "webgl2">`.
  - `store.ts`: `type IslandStatus = "pending" | "loading" | "live" | "off"`; `interface IslandSnapshot { pref; status; focus: number; unsupported: boolean }`; `interface IslandStore { get(); set(patch); subscribe(listener): () => void; reset() }`; `createIslandStore(initial?)`; `islandStore`; `PREF_KEY = "kc-island-3d"`; `safeStorage(): Storage | null`; `readPreference(storage: Pick<Storage,"getItem"> | null): Preference`; `writePreference(storage: Pick<Storage,"setItem"|"removeItem"> | null, pref): void`.
  - `boot.ts`: `ISLAND_BOOT_SCRIPT: string`.
  - `countUp.ts`: `countUpText(final: string, t: number): string`.

- [ ] **Step 1: Write the failing quality test**

```ts
// src/lib/three/island/quality.test.ts
import { describe, expect, it } from "vitest";
import { decidePerf, readSignals, selectTier, settingsFor, stepDown, type DeviceSignals, type Preference, type Tier } from "./quality";

const DESKTOP: DeviceSignals = { webgl2: true, reducedMotion: false, saveData: false, deviceMemory: 8, coarsePointer: false, devicePixelRatio: 2 };

describe("selectTier (spec §4 table + §6 toggle)", () => {
  const cases: [string, Partial<DeviceSignals>, Preference, Tier][] = [
    ["desktop, 8 GB", {}, "auto", "high"],
    ["desktop, deviceMemory unknown", { deviceMemory: undefined }, "auto", "high"],
    ["desktop, 4 GB", { deviceMemory: 4 }, "auto", "medium"],
    ["touch / coarse pointer", { coarsePointer: true }, "auto", "medium"],
    ["no WebGL2", { webgl2: false }, "auto", "off"],
    ["no WebGL2 even when opted in", { webgl2: false }, "on", "off"],
    ["saveData", { saveData: true }, "auto", "off"],
    ["2 GB", { deviceMemory: 2 }, "auto", "off"],
    ["reduced motion", { reducedMotion: true }, "auto", "off"],
    ["reduced motion + opt-in", { reducedMotion: true }, "on", "high"],
    ["reduced motion + opt-in on a phone", { reducedMotion: true, coarsePointer: true }, "on", "medium"],
    ["opt-in on a 2 GB device", { deviceMemory: 2 }, "on", "medium"],
    ["opt-in with saveData", { saveData: true }, "on", "medium"],
    ["opted out", {}, "off", "off"],
  ];
  it.each(cases)("%s", (_label, overrides, pref, expected) => {
    expect(selectTier({ ...DESKTOP, ...overrides }, pref)).toBe(expected);
  });
});

describe("settingsFor", () => {
  it("high = prototype settings, DPR capped at 1.5 (MSAA 2 above DPR 1)", () => {
    expect(settingsFor("high", 2)).toEqual({ tier: "high", dpr: 1.5, msaa: 2, cloudDetail: 5, cloudCountScale: 1, particleScale: 1, bloomScale: 1 });
  });
  it("high on a 1× screen uses MSAA 4 (prototype: samples DPR > 1 ? 2 : 4)", () => {
    expect(settingsFor("high", 1)).toMatchObject({ dpr: 1, msaa: 4 });
  });
  it("medium: DPR 1, clouds detail 3 and −40 %, particles −50 %, half-res bloom, MSAA 2", () => {
    expect(settingsFor("medium", 3)).toEqual({ tier: "medium", dpr: 1, msaa: 2, cloudDetail: 3, cloudCountScale: 0.6, particleScale: 0.5, bloomScale: 0.5 });
  });
});

describe("stepDown", () => {
  it("walks DPR 1.5 → 1 → 0.85, keeps MSAA ≤ 2, then turns MSAA off", () => {
    expect(stepDown({ dpr: 1.5, msaa: 2 })).toEqual({ dpr: 1, msaa: 2 });
    expect(stepDown({ dpr: 1, msaa: 4 })).toEqual({ dpr: 0.85, msaa: 2 });
    expect(stepDown({ dpr: 0.85, msaa: 2 })).toEqual({ dpr: 0.85, msaa: 0 });
    expect(stepDown({ dpr: 0.85, msaa: 0 })).toBeNull();
  });
});

describe("decidePerf", () => {
  it("keeps the scale at ≥ 45 fps", () => {
    expect(decidePerf(45, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "keep" });
    expect(decidePerf(60, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "keep" });
  });
  it("steps one rung between 20 and 45 fps", () => {
    expect(decidePerf(44, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "step", next: { dpr: 1, msaa: 2 } });
  });
  it("stays at the floor between 20 and 45 fps", () => {
    expect(decidePerf(30, { dpr: 0.85, msaa: 0 })).toEqual({ kind: "keep" });
  });
  it("jumps straight to the floor below 20 fps (no longer masked by the dt clamp)", () => {
    expect(decidePerf(12, { dpr: 1.5, msaa: 2 })).toEqual({ kind: "step", next: { dpr: 0.85, msaa: 0 } });
  });
  it("gives up below 20 fps at the floor", () => {
    expect(decidePerf(12, { dpr: 0.85, msaa: 0 })).toEqual({ kind: "giveUp" });
  });
});

describe("readSignals", () => {
  it("reads media queries, deviceMemory, saveData and DPR defensively", () => {
    const win = {
      matchMedia: (q: string) => ({ matches: q === "(pointer: coarse)" }),
      navigator: { deviceMemory: 4, connection: { saveData: true } },
      devicePixelRatio: 0,
    };
    expect(readSignals(win)).toEqual({ reducedMotion: false, saveData: true, deviceMemory: 4, coarsePointer: true, devicePixelRatio: 1 });
    expect(readSignals({ ...win, navigator: {} })).toMatchObject({ saveData: false, deviceMemory: undefined });
  });
});
```
Run: `npx vitest run src/lib/three/island/quality.test.ts`. Expected: FAIL, `Failed to resolve import "./quality"`.

- [ ] **Step 2: Implement `quality.ts`**

```ts
// src/lib/three/island/quality.ts
// Quality tiers for the 3D homepage (spec §4, §6) — pure and unit-tested. boot.ts runs the same
// decision before first paint (minus the WebGL2 probe); boot.test.ts keeps the two in sync.

export type Preference = "auto" | "on" | "off";
export type Tier = "high" | "medium" | "off";

export interface DeviceSignals {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB, capped at 8 by browsers); undefined when unsupported. */
  deviceMemory: number | undefined;
  coarsePointer: boolean;
  devicePixelRatio: number;
}

export function selectTier(s: DeviceSignals, pref: Preference): Tier {
  if (!s.webgl2 || pref === "off") return "off";
  const constrained = s.saveData || (s.deviceMemory !== undefined && s.deviceMemory < 4);
  // Without an explicit opt-in, reduced motion and constrained devices get the poster.
  if (pref !== "on" && (s.reducedMotion || constrained)) return "off";
  if (constrained || s.coarsePointer || (s.deviceMemory !== undefined && s.deviceMemory < 8)) return "medium";
  return "high";
}

export interface QualitySettings {
  tier: Exclude<Tier, "off">;
  dpr: number;
  msaa: number;
  /** IcosahedronGeometry detail of a cloud puff. */
  cloudDetail: number;
  /** Multiplier on the sea / background / portal cloud cluster counts. */
  cloudCountScale: number;
  particleScale: number;
  /** Bloom render-target scale relative to the drawing buffer. */
  bloomScale: number;
}

export function settingsFor(tier: Exclude<Tier, "off">, devicePixelRatio: number): QualitySettings {
  if (tier === "medium") {
    return { tier, dpr: Math.min(devicePixelRatio, 1), msaa: 2, cloudDetail: 3, cloudCountScale: 0.6, particleScale: 0.5, bloomScale: 0.5 };
  }
  const dpr = Math.min(devicePixelRatio, 1.5);
  return { tier, dpr, msaa: dpr > 1 ? 2 : 4, cloudDetail: 5, cloudCountScale: 1, particleScale: 1, bloomScale: 1 };
}

// ---- Adaptive step-down (prototype 1654–1662, fixed) ----

export interface RenderScale {
  dpr: number;
  msaa: number;
}
export type PerfDecision = { kind: "keep" } | { kind: "step"; next: RenderScale } | { kind: "giveUp" };

/** Frames per measurement window. */
export const PERF_WINDOW = 150;
export const PERF_TARGET_FPS = 45;
export const PERF_FLOOR_FPS = 20;
const FLOOR_DPR = 0.85;

/** Next rung: DPR 1.5 → 1 → 0.85, MSAA never above 2 once stepping (samples follow DPR down), then MSAA off. */
export function stepDown({ dpr, msaa }: RenderScale): RenderScale | null {
  if (dpr > 1) return { dpr: 1, msaa: Math.min(msaa, 2) };
  if (dpr > FLOOR_DPR) return { dpr: FLOOR_DPR, msaa: Math.min(msaa, 2) };
  if (msaa > 0) return { dpr, msaa: 0 };
  return null;
}

/**
 * Decision after one window. avgFps comes from UNCLAMPED frame times, so < 20 fps is visible:
 * below the floor we jump straight to the lowest rung, and give up (poster) if already there.
 */
export function decidePerf(avgFps: number, current: RenderScale): PerfDecision {
  if (avgFps >= PERF_TARGET_FPS) return { kind: "keep" };
  if (avgFps < PERF_FLOOR_FPS) {
    const floor = { dpr: Math.min(current.dpr, FLOOR_DPR), msaa: 0 };
    const atFloor = floor.dpr === current.dpr && current.msaa === 0;
    return atFloor ? { kind: "giveUp" } : { kind: "step", next: floor };
  }
  const next = stepDown(current);
  return next ? { kind: "step", next } : { kind: "keep" };
}

// ---- Reading the signals (everything but the WebGL2 probe) ----

export interface SignalSource {
  matchMedia(query: string): { matches: boolean };
  navigator: unknown;
  devicePixelRatio: number;
}

export function readSignals(win: SignalSource): Omit<DeviceSignals, "webgl2"> {
  const nav = win.navigator as { deviceMemory?: unknown; connection?: { saveData?: unknown } };
  return {
    reducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined,
    coarsePointer: win.matchMedia("(pointer: coarse)").matches,
    devicePixelRatio: win.devicePixelRatio || 1,
  };
}
```
Run: `npx vitest run src/lib/three/island/quality.test.ts`. Expected: PASS, 24 tests.

- [ ] **Step 3: Write the failing store test**

```ts
// src/lib/three/island/store.test.ts
import { describe, expect, it, vi } from "vitest";
import { PREF_KEY, createIslandStore, readPreference, writePreference } from "./store";

describe("createIslandStore", () => {
  it("starts from the defaults", () => {
    expect(createIslandStore().get()).toEqual({ pref: "auto", status: "pending", focus: 0, unsupported: false });
  });
  it("notifies subscribers with a new snapshot on change", () => {
    const store = createIslandStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.get();
    store.set({ status: "live", focus: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).not.toBe(before);
    expect(store.get()).toMatchObject({ status: "live", focus: 3 });
  });
  it("keeps the same snapshot and stays silent when nothing changes (stable useSyncExternalStore)", () => {
    const store = createIslandStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.get();
    store.set({ status: "pending", focus: 0 });
    expect(listener).not.toHaveBeenCalled();
    expect(store.get()).toBe(before);
  });
  it("unsubscribes and resets", () => {
    const store = createIslandStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.set({ focus: 2 });
    expect(listener).not.toHaveBeenCalled();
    store.reset();
    expect(store.get().focus).toBe(0);
  });
});

describe("preference persistence", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };
  it("reads on/off, anything else is auto", () => {
    const s = memory();
    expect(readPreference(s)).toBe("auto");
    s.data.set(PREF_KEY, "on");
    expect(readPreference(s)).toBe("on");
    s.data.set(PREF_KEY, "off");
    expect(readPreference(s)).toBe("off");
    s.data.set(PREF_KEY, "yes");
    expect(readPreference(s)).toBe("auto");
  });
  it("survives missing or throwing storage", () => {
    expect(readPreference(null)).toBe("auto");
    const throwing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readPreference(throwing)).toBe("auto");
    expect(() => writePreference(throwing, "on")).not.toThrow();
    expect(() => writePreference(null, "on")).not.toThrow();
  });
  it("writes on/off and clears auto", () => {
    const s = memory();
    writePreference(s, "off");
    expect(s.data.get(PREF_KEY)).toBe("off");
    writePreference(s, "auto");
    expect(s.data.has(PREF_KEY)).toBe(false);
  });
});
```
Run: `npx vitest run src/lib/three/island/store.test.ts`. Expected: FAIL, `Failed to resolve import "./store"`.

- [ ] **Step 4: Implement `store.ts`**

```ts
// src/lib/three/island/store.ts
// Tiny external store shared by IslandJourney (writer), Toggle3D and MapFocusCard (readers via
// useSyncExternalStore). No three import — safe in the initial bundle.
import type { Preference } from "./quality";

/** Mirrors `html[data-island]`: pending (decided on, not loaded) → loading → live; off = poster. */
export type IslandStatus = "pending" | "loading" | "live" | "off";

export interface IslandSnapshot {
  readonly pref: Preference;
  readonly status: IslandStatus;
  /** Index in the ring's map list of the screen the camera faces. */
  readonly focus: number;
  /** No WebGL2 on this device: the toggle hides itself. */
  readonly unsupported: boolean;
}

export interface IslandStore {
  get(): IslandSnapshot;
  set(patch: Partial<IslandSnapshot>): void;
  subscribe(listener: () => void): () => void;
  reset(): void;
}

const INITIAL: IslandSnapshot = { pref: "auto", status: "pending", focus: 0, unsupported: false };

export function createIslandStore(initial: IslandSnapshot = INITIAL): IslandStore {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<IslandSnapshot>) => {
    const keys = Object.keys(patch) as (keyof IslandSnapshot)[];
    if (keys.every((key) => patch[key] === snapshot[key])) return; // unchanged → same snapshot object
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  return {
    get: () => snapshot,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset: () => set(initial),
  };
}

export const islandStore = createIslandStore();

export const PREF_KEY = "kc-island-3d";

/** localStorage, or null when unavailable (SSR, blocked storage, sandboxed iframes). */
export function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readPreference(storage: Pick<Storage, "getItem"> | null): Preference {
  try {
    const value = storage?.getItem(PREF_KEY);
    return value === "on" || value === "off" ? value : "auto";
  } catch {
    return "auto";
  }
}

export function writePreference(storage: Pick<Storage, "setItem" | "removeItem"> | null, pref: Preference): void {
  try {
    if (pref === "auto") storage?.removeItem(PREF_KEY);
    else storage?.setItem(PREF_KEY, pref);
  } catch {
    // Blocked storage: the choice still applies for this page view (store state).
  }
}
```
Run: `npx vitest run src/lib/three/island/store.test.ts`. Expected: PASS, 7 tests.

- [ ] **Step 5: Write the failing boot-script parity test**

```ts
// src/lib/three/island/boot.test.ts
import { describe, expect, it } from "vitest";
import { ISLAND_BOOT_SCRIPT } from "./boot";
import { selectTier } from "./quality";
import { readPreference } from "./store";

interface Env {
  stored: string | null;
  storageThrows: boolean;
  reducedMotion: boolean;
  saveData: boolean | undefined;
  deviceMemory: number | undefined;
}

function runBootScript(env: Env): string | undefined {
  const attrs: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (name: string, value: string) => void (attrs[name] = value) } };
  const localStorage = {
    getItem: () => {
      if (env.storageThrows) throw new Error("SecurityError");
      return env.stored;
    },
  };
  const matchMedia = (query: string) => ({ matches: query.includes("reduce") && env.reducedMotion });
  const navigator = { connection: env.saveData === undefined ? undefined : { saveData: env.saveData }, deviceMemory: env.deviceMemory };
  new Function("document", "localStorage", "matchMedia", "navigator", ISLAND_BOOT_SCRIPT)(document, localStorage, matchMedia, navigator);
  return attrs["data-island"];
}

function expected(env: Env): string {
  const storage = { getItem: () => (env.storageThrows ? (() => { throw new Error("SecurityError"); })() : env.stored) };
  const tier = selectTier(
    { webgl2: true, reducedMotion: env.reducedMotion, saveData: env.saveData === true, deviceMemory: env.deviceMemory, coarsePointer: false, devicePixelRatio: 1 },
    readPreference(storage),
  );
  return tier === "off" ? "off" : "pending";
}

describe("ISLAND_BOOT_SCRIPT", () => {
  const envs: Env[] = [];
  for (const stored of [null, "on", "off", "garbage"])
    for (const storageThrows of [false, true])
      for (const reducedMotion of [false, true])
        for (const saveData of [undefined, false, true])
          for (const deviceMemory of [undefined, 2, 4, 8]) envs.push({ stored, storageThrows, reducedMotion, saveData, deviceMemory });

  it(`agrees with selectTier() for all ${envs.length} combinations`, () => {
    for (const env of envs) expect(runBootScript(env), JSON.stringify(env)).toBe(expected(env));
  });

  it("never throws, even without matchMedia", () => {
    expect(() => new Function("document", "localStorage", "matchMedia", "navigator", ISLAND_BOOT_SCRIPT)({ documentElement: { setAttribute() {} } }, null, undefined, {})).not.toThrow();
  });
});
```
Run: `npx vitest run src/lib/three/island/boot.test.ts`. Expected: FAIL, `Failed to resolve import "./boot"`.

- [ ] **Step 6: Implement `boot.ts`**

```ts
// src/lib/three/island/boot.ts
import { PREF_KEY } from "./store";

// Inline <script> rendered at the top of the homepage <main>: runs before the sections are parsed,
// so `html[data-island]` (which switches the sticky chapter heights on) is right on first paint.
// Same decision as selectTier() with WebGL2 assumed — boot.test.ts checks parity; the real WebGL2
// probe happens later in IslandJourney. ES5, no dependencies, every access guarded.
export const ISLAND_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,p=null;try{p=localStorage.getItem(${JSON.stringify(PREF_KEY)})}catch(e){}var n=navigator,c=n.connection,m=n.deviceMemory,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,low=!!(c&&c.saveData)||(typeof m==="number"&&m<4),off=p==="off"||(p!=="on"&&(rm||low));d.setAttribute("data-island",off?"off":"pending")}catch(e){}})();`;
```
Run: `npx vitest run src/lib/three/island/boot.test.ts`. Expected: PASS, 2 tests (the first covers 384 combinations).

- [ ] **Step 7: Write the failing count-up test**

```ts
// src/lib/three/island/countUp.test.ts
import { describe, expect, it } from "vitest";
import { countUpText } from "./countUp";

describe("countUpText", () => {
  it("returns the final label at t ≥ 1", () => {
    expect(countUpText("4,9 Md+", 1)).toBe("4,9 Md+");
    expect(countUpText("4,9 Md+", 1.3)).toBe("4,9 Md+");
  });
  it("keeps decimals, the comma separator and the suffix", () => {
    expect(countUpText("4,9 Md+", 0)).toBe("0,0 Md+");
    expect(countUpText("4,9 Md+", 0.2)).toBe("1,0 Md+");
  });
  it("keeps a dot separator", () => {
    expect(countUpText("4.9B+", 0.2)).toBe("1.0B+");
  });
  it("counts integers with their suffix / unit", () => {
    expect(countUpText("16+", 0.5)).toBe("8+");
    expect(countUpText("3 marques", 0)).toBe("0 marques");
    expect(countUpText("5", 0.6)).toBe("3");
  });
  it("clamps negative / invalid t to 0 and leaves number-less labels alone", () => {
    expect(countUpText("16+", -1)).toBe("0+");
    expect(countUpText("16+", Number.NaN)).toBe("0+");
    expect(countUpText("—", 0.3)).toBe("—");
  });
});
```
Run: `npx vitest run src/lib/three/island/countUp.test.ts`. Expected: FAIL, `Failed to resolve import "./countUp"`.

- [ ] **Step 8: Implement `countUp.ts`**

```ts
// src/lib/three/island/countUp.ts
const NUMBER = /\d+(?:[.,]\d+)?/;

/**
 * Stat label while its pillar rises: the first number in `final` scaled by t ∈ [0, 1], keeping the
 * label's decimals, decimal separator and surrounding text ("4,9 Md+" → "2,0 Md+" at t ≈ 0.4).
 * t ≥ 1 returns `final` untouched.
 */
export function countUpText(final: string, t: number): string {
  if (t >= 1) return final;
  const match = NUMBER.exec(final);
  if (!match) return final;
  const raw = match[0];
  const separator = raw.includes(",") ? "," : ".";
  const [, fraction = ""] = raw.split(/[.,]/);
  const k = Number.isFinite(t) ? Math.max(0, t) : 0;
  const value = parseFloat(raw.replace(",", ".")) * k;
  const text = value.toFixed(fraction.length).replace(".", separator);
  return final.slice(0, match.index) + text + final.slice(match.index + raw.length);
}
```
Run: `npx vitest run src/lib/three/island/countUp.test.ts`. Expected: PASS, 5 tests.

- [ ] **Step 9: Verify**

Run: `npm test && npx tsc --noEmit && npx eslint src`. Expected: all green, no output from tsc or eslint.

---

### Task 4: Shared world contracts — chapters, camera path, disposal, types

**Files:**
- Create: `src/lib/three/island/chapters.ts`, `chapters.test.ts`, `cameraPath.ts`, `cameraPath.test.ts`, `dispose.ts`, `dispose.test.ts`, `types.ts`

**Interfaces:**
- Consumes: `math.ts` (Task 1), `QualitySettings` (Task 3).
- Produces:
  - `chapters.ts`: `RING_CENTER = [0, -40, 0] as const`; `RING_RADIUS = 17`; `CLOUD_Y = -23.5`; `PORTAL_POS = [0, 22, -86] as const`; `STAT_Z = -52`; `STAT_BASE_Y = -50`; `STAT_COUNT = 4`; `interface Visibility { island; ring; stats; portal; cloudBackground; cloudPortal: boolean }`; `visibilityAt(p, cameraY): Visibility`; `pillarReveal(p, index): number`; `portalCharge(p): number`; `deepness(cameraY): number`; `cloudVeil(cameraY, horizontalDistance): number`.
  - `cameraPath.ts`: `type Vec2`, `type Vec3`; `interface CameraKey { p; pos: Vec3; look: Vec3; fov; shift: Vec2; mshift: Vec2; roll; md }`; `CAMERA_KEYS: readonly CameraKey[]` (26 keys); `interface Segment { i; l; t }`; `segmentAt(p, keys?): Segment`; `interface CameraScalars { fov; sx; sy; roll; md }`; `sampleScalars(p, portrait, keys?, out?): CameraScalars`; `interface CameraSample extends CameraScalars { pos: THREE.Vector3; look: THREE.Vector3 }`; `interface CameraRig { sample(p, portrait, out: CameraSample): CameraSample }`; `createCameraRig(keys?): CameraRig`.
  - `dispose.ts`: `interface Disposable { dispose(): void }`; `class DisposeBag { get disposed(): boolean; add<T extends Disposable>(item: T): T; defer(cb: () => void): void; dispose(): void }`; `disposeGraph(root: THREE.Object3D): void`.
  - `types.ts`: `RingMapInfo`, `SceneContext`, `FrameState`, `Unit` (code below).

- [ ] **Step 1: Write the failing chapters test**

```ts
// src/lib/three/island/chapters.test.ts
import { describe, expect, it } from "vitest";
import { CLOUD_Y, cloudVeil, deepness, pillarReveal, portalCharge, visibilityAt } from "./chapters";

describe("visibilityAt", () => {
  it("hero: island + background clouds only", () => {
    expect(visibilityAt(0, 6.5)).toEqual({ island: true, ring: false, stats: false, portal: false, cloudBackground: true, cloudPortal: false });
  });
  it("ring chapter: ring only (island culled below y −30)", () => {
    expect(visibilityAt(0.4, -39)).toEqual({ island: false, ring: true, stats: false, portal: false, cloudBackground: false, cloudPortal: false });
  });
  it("stats chapter: stats + portal (prototype gates), ring gate closes at 0.7", () => {
    expect(visibilityAt(0.7, -41)).toMatchObject({ ring: false, stats: true, portal: true, cloudPortal: true, cloudBackground: false });
  });
  it("portal chapter: portal + both far cloud zones", () => {
    expect(visibilityAt(0.95, 14)).toMatchObject({ island: true, stats: false, portal: true, cloudBackground: true, cloudPortal: true });
  });
});

describe("pillarReveal", () => {
  it("is 0 before 0.6, 1 once risen, staggered per pillar", () => {
    expect(pillarReveal(0.6, 0)).toBe(0);
    expect(pillarReveal(0.675, 0)).toBe(1);
    expect(pillarReveal(0.64, 0)).toBeGreaterThan(pillarReveal(0.64, 3));
    expect(pillarReveal(0.72, 3)).toBe(1);
  });
});

describe("atmosphere helpers", () => {
  it("portalCharge ramps 0.84 → 1", () => {
    expect(portalCharge(0.84)).toBe(0);
    expect(portalCharge(1)).toBe(1);
  });
  it("deepness ramps from y −17 to y −31", () => {
    expect(deepness(-17)).toBe(0);
    expect(deepness(-31)).toBe(1);
  });
  it("cloudVeil peaks inside the cloud layer, away from the island axis", () => {
    expect(cloudVeil(CLOUD_Y + 0.5, 10)).toBeCloseTo(0.86, 6);
    expect(cloudVeil(CLOUD_Y + 0.5, 2)).toBe(0);
    expect(cloudVeil(10, 10)).toBe(0);
  });
});
```
Run: `npx vitest run src/lib/three/island/chapters.test.ts`. Expected: FAIL, `Failed to resolve import "./chapters"`.

- [ ] **Step 2: Implement `chapters.ts`**

```ts
// src/lib/three/island/chapters.ts
import { easeOutCubic, sstep } from "./math";

// Where the chapters live in world space (prototype values) and when each one is drawn. Pure.

export const RING_CENTER = [0, -40, 0] as const;
export const RING_RADIUS = 17;
export const CLOUD_Y = -23.5;
export const PORTAL_POS = [0, 22, -86] as const;
export const STAT_Z = -52;
export const STAT_BASE_Y = -50;
/** One pillar per StatsBand stat. */
export const STAT_COUNT = 4;

export interface Visibility {
  island: boolean;
  ring: boolean;
  stats: boolean;
  portal: boolean;
  /** High background cloud zone (hero depth layers, prototype line 903). */
  cloudBackground: boolean;
  /** Clouds cradling the portal (prototype line 905). */
  cloudPortal: boolean;
}

/** Chapter culling (prototype 1564–1567) + the two cloud zones that are never seen mid-journey. */
export function visibilityAt(p: number, cameraY: number): Visibility {
  return {
    island: cameraY > -30,
    ring: p > 0.17 && p < 0.7,
    stats: p > 0.5 && p < 0.9,
    portal: p > 0.55,
    cloudBackground: p < 0.25 || p > 0.8,
    cloudPortal: p > 0.55,
  };
}

/** 0..1 rise of stat pillar `index` (prototype line 1609). */
export function pillarReveal(p: number, index: number): number {
  return easeOutCubic((p - 0.6 - index * 0.012) / 0.075);
}

/** Portal charge (prototype line 1631). */
export function portalCharge(p: number): number {
  return sstep(0.84, 1, p);
}

/** 0 above the cloud sea → 1 below it (prototype line 1551). */
export function deepness(cameraY: number): number {
  return sstep(-17, -31, cameraY);
}

/** Cloud veil strength while the camera crosses the cloud layer (prototype line 1557). */
export function cloudVeil(cameraY: number, horizontalDistance: number): number {
  return sstep(6.5, 1.2, Math.abs(cameraY - (CLOUD_Y + 0.5))) * sstep(4, 8, horizontalDistance) * 0.86;
}
```
Run: `npx vitest run src/lib/three/island/chapters.test.ts`. Expected: PASS, 8 tests.

- [ ] **Step 3: Write the failing camera-path test**

```ts
// src/lib/three/island/cameraPath.test.ts
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, createCameraRig, sampleScalars, segmentAt, type CameraSample } from "./cameraPath";

const fresh = (): CameraSample => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 0, sx: 0, sy: 0, roll: 0, md: 1 });

describe("CAMERA_KEYS (prototype 1325–1344)", () => {
  it("has 5 approach + 12 ring + 9 finale keys with strictly increasing p from 0 to 1", () => {
    expect(CAMERA_KEYS).toHaveLength(26);
    expect(CAMERA_KEYS[0].p).toBe(0);
    expect(CAMERA_KEYS[CAMERA_KEYS.length - 1].p).toBe(1);
    for (let i = 1; i < CAMERA_KEYS.length; i++) expect(CAMERA_KEYS[i].p).toBeGreaterThan(CAMERA_KEYS[i - 1].p);
  });
  it("starts and ends on the prototype's keys", () => {
    expect(CAMERA_KEYS[0]).toMatchObject({ pos: [0, 6.5, 52], look: [0, -2.8, 0], fov: 36, shift: [0.3, 0.03], mshift: [0, -0.26] });
    expect(CAMERA_KEYS[25]).toMatchObject({ p: 1, pos: [0, 17.6, -58.5], look: [0, 22, -86], fov: 44 });
  });
  it("generates the ring keys like the prototype loop", () => {
    const first = CAMERA_KEYS[5];
    expect(first.p).toBeCloseTo(0.272, 12);
    expect(first.pos[0]).toBeCloseTo(3.983716857408418, 10);
    expect(first.pos[1]).toBeCloseTo(-37.6, 10);
    expect(first.pos[2]).toBeCloseTo(2.3, 10);
    expect(first.look[0]).toBeCloseTo(6.368312088070507, 10);
    expect(first.look[2]).toBeCloseTo(15.762125527635384, 10);
    expect(first).toMatchObject({ fov: 55, shift: [0, 0.07], mshift: [0, -0.1], md: 0.15 });
    const last = CAMERA_KEYS[16];
    expect(last.p).toBeCloseTo(0.548, 12);
    expect(last.pos[0]).toBeCloseTo(2.3, 10);
    expect(last.pos[1]).toBeCloseTo(-39.4, 10);
    expect(last.pos[2]).toBeCloseTo(-3.9837168574084174, 10);
  });
});

describe("segmentAt", () => {
  it("maps the endpoints to t = 0 and t = 1", () => {
    expect(segmentAt(0)).toEqual({ i: 0, l: 0, t: 0 });
    expect(segmentAt(1)).toEqual({ i: 24, l: 1, t: 1 });
  });
  it("maps key k to spline parameter k / (n − 1)", () => {
    CAMERA_KEYS.forEach((key, k) => expect(segmentAt(key.p).t).toBeCloseTo(k / 25, 12));
  });
  it("clamps p outside [0, 1]", () => {
    expect(segmentAt(-0.5)).toEqual(segmentAt(0));
    expect(segmentAt(1.5)).toEqual(segmentAt(1));
  });
});

describe("createCameraRig", () => {
  const rig = createCameraRig();
  it("passes exactly through every keyframe (endpoints = prototype keys)", () => {
    for (const key of CAMERA_KEYS) {
      const s = rig.sample(key.p, false, fresh());
      expect(s.pos.distanceTo(new THREE.Vector3(...key.pos))).toBeLessThan(1e-6);
      expect(s.look.distanceTo(new THREE.Vector3(...key.look))).toBeLessThan(1e-6);
      expect(s.fov).toBeCloseTo(key.fov, 9);
    }
  });
  it("is continuous across every key (no jumps in position, look or fov)", () => {
    for (const key of CAMERA_KEYS.slice(1, -1)) {
      const before = rig.sample(key.p - 1e-5, false, fresh());
      const after = rig.sample(key.p + 1e-5, false, fresh());
      expect(before.pos.distanceTo(after.pos)).toBeLessThan(0.05);
      expect(before.look.distanceTo(after.look)).toBeLessThan(0.05);
      expect(Math.abs(before.fov - after.fov)).toBeLessThan(0.01);
    }
  });
  it("uses the portrait shift in portrait", () => {
    expect(sampleScalars(0, true)).toMatchObject({ sx: 0, sy: -0.26 });
    expect(sampleScalars(0, false)).toMatchObject({ sx: 0.3, sy: 0.03 });
  });
});
```
Run: `npx vitest run src/lib/three/island/cameraPath.test.ts`. Expected: FAIL, `Failed to resolve import "./cameraPath"`.

- [ ] **Step 4: Implement `cameraPath.ts`** (prototype 1320–1364; the keyframe table is copied value for value)

```ts
// src/lib/three/island/cameraPath.ts
import * as THREE from "three";
import { RING_RADIUS } from "./chapters";
import { clamp, DEG, lerp } from "./math";

// Camera journey (prototype lines 1320–1364): keyframes → centripetal Catmull-Rom splines for the
// position and the look target; fov / lens shift / roll / portrait pull-back are eased per segment.

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export interface CameraKey {
  readonly p: number;
  readonly pos: Vec3;
  readonly look: Vec3;
  readonly fov: number;
  /** Projection shift (landscape). */
  readonly shift: Vec2;
  /** Projection shift (portrait). */
  readonly mshift: Vec2;
  readonly roll: number;
  /** How much the portrait pull-back applies (1 = full). */
  readonly md: number;
}

function buildKeys(): CameraKey[] {
  const keys: CameraKey[] = [];
  const K = (p: number, pos: Vec3, look: Vec3, fov = 45, shift: Vec2 = [0, 0], mshift: Vec2 = [0, 0], roll = 0, md = 1) =>
    keys.push({ p, pos, look, fov, shift, mshift, roll, md });
  K(0.0, [0, 6.5, 52], [0, -2.8, 0], 36, [0.3, 0.03], [0, -0.26]);
  K(0.07, [-3.2, 5.6, 45.5], [0, -3.0, 0], 36, [0.3, 0.03], [0, -0.26], 0.0);
  K(0.14, [27, 2.0, 25], [0, -4.0, 0], 40, [0.05, 0], [0, -0.05], -0.05);
  K(0.195, [21, -9.5, 9], [0, -11, 0], 46, [0, 0], [0, 0], -0.03);
  K(0.237, [12, -23, 4.5], [3, -39, 9], 52, [0, 0], [0, 0], 0.03);
  for (let k = 0; k <= 11; k++) {
    const t = k / 11;
    const th = lerp(30, 300, t) * DEG;
    const la = th + 38 * DEG;
    const r = 4.6 + Math.sin(t * Math.PI * 2) * 0.6;
    const y = -39.4 + Math.sin(t * Math.PI * 3) * 0.45 + (k === 0 ? 1.8 : 0);
    K(
      lerp(0.272, 0.548, t),
      [Math.cos(th) * r, y, Math.sin(th) * r],
      [Math.cos(la) * RING_RADIUS, -40.5, Math.sin(la) * RING_RADIUS],
      55,
      [0, 0.07],
      [0, -0.1],
      Math.sin(t * Math.PI * 2) * 0.035,
      0.15,
    );
  }
  K(0.592, [-2.5, -45.5, -17.5], [0, -45, -52], 46);
  K(0.64, [-3.6, -41.6, -20], [0, -45.2, -52], 40, [0, 0.0], [0, -0.1]);
  K(0.71, [0, -41.3, -21.5], [0, -45.3, -52], 40, [0, 0.0], [0, -0.1]);
  K(0.78, [3.6, -41.0, -23], [0, -45.3, -52], 40, [0, 0.0], [0, -0.1]);
  K(0.83, [1.5, -32, -36], [0, -14, -64], 50);
  K(0.866, [0, -22, -42], [0, 4, -74], 52);
  K(0.906, [0, 3, -50], [0, 19, -86], 48);
  K(0.952, [0, 14, -56.5], [0, 21.6, -86], 45);
  K(1.0, [0, 17.6, -58.5], [0, 22, -86], 44);
  return keys;
}

export const CAMERA_KEYS: readonly CameraKey[] = buildKeys();

/** Segment [keys[i], keys[i+1]] containing p, local l ∈ [0,1], and spline parameter t = (i + l)/(n − 1). */
export interface Segment {
  i: number;
  l: number;
  t: number;
}

export function segmentAt(p: number, keys: readonly CameraKey[] = CAMERA_KEYS): Segment {
  const n = keys.length;
  const q = clamp(p);
  let i = 0;
  while (i < n - 2 && keys[i + 1].p <= q) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const l = clamp((q - a.p) / (b.p - a.p));
  return { i, l, t: (i + l) / (n - 1) };
}

export interface CameraScalars {
  fov: number;
  sx: number;
  sy: number;
  roll: number;
  md: number;
}

export function sampleScalars(p: number, portrait: boolean, keys: readonly CameraKey[] = CAMERA_KEYS, out: CameraScalars = { fov: 0, sx: 0, sy: 0, roll: 0, md: 1 }): CameraScalars {
  const { i, l } = segmentAt(p, keys);
  const a = keys[i];
  const b = keys[i + 1];
  const e = l * l * (3 - 2 * l);
  const sa = portrait ? a.mshift : a.shift;
  const sb = portrait ? b.mshift : b.shift;
  out.fov = lerp(a.fov, b.fov, e);
  out.sx = lerp(sa[0], sb[0], e);
  out.sy = lerp(sa[1], sb[1], e);
  out.roll = lerp(a.roll, b.roll, e);
  out.md = lerp(a.md, b.md, e);
  return out;
}

export interface CameraSample extends CameraScalars {
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

export interface CameraRig {
  sample(p: number, portrait: boolean, out: CameraSample): CameraSample;
}

export function createCameraRig(keys: readonly CameraKey[] = CAMERA_KEYS): CameraRig {
  const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal");
  return {
    sample(p, portrait, out) {
      const { t } = segmentAt(p, keys);
      posCurve.getPoint(t, out.pos);
      lookCurve.getPoint(t, out.look);
      sampleScalars(p, portrait, keys, out);
      return out;
    },
  };
}
```
Run: `npx vitest run src/lib/three/island/cameraPath.test.ts`. Expected: PASS, 9 tests.

- [ ] **Step 5: Write the failing disposal test**

```ts
// src/lib/three/island/dispose.test.ts
import * as THREE from "three";
import { describe, expect, it, vi } from "vitest";
import { DisposeBag, disposeGraph } from "./dispose";

describe("disposeGraph", () => {
  it("disposes shared geometries and materials exactly once", () => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const onGeometry = vi.fn();
    const onMaterial = vi.fn();
    geometry.addEventListener("dispose", onGeometry);
    material.addEventListener("dispose", onMaterial);
    const root = new THREE.Group();
    root.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, material));
    disposeGraph(root);
    expect(onGeometry).toHaveBeenCalledTimes(1);
    expect(onMaterial).toHaveBeenCalledTimes(1);
  });

  it("disposes textures held by materials and by shader uniforms", () => {
    const map = new THREE.Texture();
    const uniformTexture = new THREE.Texture();
    const onMap = vi.fn();
    const onUniform = vi.fn();
    map.addEventListener("dispose", onMap);
    uniformTexture.addEventListener("dispose", onUniform);
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({ map })));
    root.add(new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.ShaderMaterial({ uniforms: { uMap: { value: uniformTexture } } })));
    disposeGraph(root);
    expect(onMap).toHaveBeenCalledTimes(1);
    expect(onUniform).toHaveBeenCalledTimes(1);
  });

  it("releases InstancedMesh buffers, Points and the scene environment", () => {
    const scene = new THREE.Scene();
    const environment = new THREE.Texture();
    scene.environment = environment;
    const instanced = new THREE.InstancedMesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial(), 3);
    const points = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial());
    scene.add(instanced, points);
    const onInstanced = vi.fn();
    const onEnvironment = vi.fn();
    const onPoints = vi.fn();
    instanced.addEventListener("dispose", onInstanced);
    environment.addEventListener("dispose", onEnvironment);
    points.geometry.addEventListener("dispose", onPoints);
    disposeGraph(scene);
    expect(onInstanced).toHaveBeenCalledTimes(1);
    expect(onEnvironment).toHaveBeenCalledTimes(1);
    expect(onPoints).toHaveBeenCalledTimes(1);
  });
});

describe("DisposeBag", () => {
  it("disposes each item once, runs deferred callbacks, and is idempotent", () => {
    const bag = new DisposeBag();
    const item = { dispose: vi.fn() };
    const callback = vi.fn();
    bag.add(item);
    bag.add(item);
    bag.defer(callback);
    bag.dispose();
    bag.dispose();
    expect(item.dispose).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(bag.disposed).toBe(true);
  });
  it("disposes late additions immediately", () => {
    const bag = new DisposeBag();
    bag.dispose();
    const late = { dispose: vi.fn() };
    const lateCallback = vi.fn();
    bag.add(late);
    bag.defer(lateCallback);
    expect(late.dispose).toHaveBeenCalledTimes(1);
    expect(lateCallback).toHaveBeenCalledTimes(1);
  });
});
```
Run: `npx vitest run src/lib/three/island/dispose.test.ts`. Expected: FAIL, `Failed to resolve import "./dispose"`.

- [ ] **Step 6: Implement `dispose.ts`**

```ts
// src/lib/three/island/dispose.ts
import * as THREE from "three";

export interface Disposable {
  dispose(): void;
}

/**
 * GPU resources that live outside the scene graph (render targets, the PMREM environment, canvas
 * textures, in-flight image loads…). Each is disposed once; deferred callbacks run first.
 */
export class DisposeBag {
  private readonly items = new Set<Disposable>();
  private readonly callbacks: (() => void)[] = [];
  private done = false;

  get disposed(): boolean {
    return this.done;
  }

  add<T extends Disposable>(item: T): T {
    if (this.done) item.dispose();
    else this.items.add(item);
    return item;
  }

  defer(callback: () => void): void {
    if (this.done) callback();
    else this.callbacks.push(callback);
  }

  dispose(): void {
    if (this.done) return;
    this.done = true;
    this.callbacks.splice(0).forEach((callback) => callback());
    this.items.forEach((item) => item.dispose());
    this.items.clear();
  }
}

function texturesOf(material: THREE.Material): THREE.Texture[] {
  const found: THREE.Texture[] = [];
  for (const value of Object.values(material)) if (value instanceof THREE.Texture) found.push(value);
  const uniforms = (material as Partial<THREE.ShaderMaterial>).uniforms;
  if (uniforms) for (const uniform of Object.values(uniforms)) if (uniform?.value instanceof THREE.Texture) found.push(uniform.value);
  return found;
}

/**
 * Disposes every geometry, material and texture reachable from `root` exactly once — shared ones
 * included — plus InstancedMesh instance buffers and, for a Scene, its environment/background.
 */
export function disposeGraph(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const { geometry, material } = object as Partial<THREE.Mesh>;
    if (geometry) geometries.add(geometry);
    if (material) (Array.isArray(material) ? material : [material]).forEach((m) => materials.add(m));
    if ((object as THREE.InstancedMesh).isInstancedMesh) (object as THREE.InstancedMesh).dispose();
  });
  if (root instanceof THREE.Scene) {
    if (root.environment) textures.add(root.environment);
    if (root.background instanceof THREE.Texture) textures.add(root.background);
  }
  materials.forEach((m) => texturesOf(m).forEach((t) => textures.add(t)));
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
```
Run: `npx vitest run src/lib/three/island/dispose.test.ts`. Expected: PASS, 5 tests.

- [ ] **Step 7: Create `types.ts`** (shared contracts; type-only imports, so it is free in the initial bundle)

```ts
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
  /** Seconds since the world started. */
  t: number;
  /** Simulation step, clamped to ≤ 1/20 s. */
  dt: number;
  /** Smoothed camera progress. */
  p: number;
  camera: THREE.PerspectiveCamera;
  portrait: boolean;
  /** Idle bobbing amplitude: 1, or 0 under reduced motion (3D opted in). */
  bob: number;
}

/** A scene module's per-frame / resize hooks. */
export interface Unit {
  update?(frame: FrameState, vis: Visibility): void;
  resize?(width: number, height: number): void;
}
```

- [ ] **Step 8: Verify**

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: all green. The island modules now have 85 tests in total across rng, math, noise, progress, quality, store, boot, countUp, chapters, cameraPath and dispose. tsc and eslint print nothing.

---

### Task 5: Homepage restructure: over3d sections, glass/sticky CSS, ring list, static fallback

No 3D yet. This task delivers the whole homepage layout the world will drive. After it, the site already works as the "poster + readable static homepage" fallback.

**Files:**
- Create: `src/components/ui/Glass.tsx`, `src/content/realisations.test.ts`, `public/images/island-poster.webp` (placeholder)
- Modify: `src/content/realisations.ts`, `src/messages/{fr,en,es,de}.json`, `src/app/motion.css`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `src/components/sections/{Hero,Opportunity,Audiences,ServicesGrid,Realisations,StatsBand,Process,WhyKaio,SectorIdeas,FaqB2B,FinalCta}.tsx`, `src/components/motion/Marquee.tsx`
- Scratch (not in repo): `$S/island/lib.mjs`, `$S/island/t5-static.mjs`

**Interfaces:**
- Consumes: `RingMapInfo` (Task 4 `types.ts`), `ISLAND_BOOT_SCRIPT` (Task 3).
- Produces:
  - `type SectionVariant = "default" | "over3d"` and `Glass({ on, className?, children })` from `@/components/ui/Glass`.
  - Every homepage section accepts `variant?: SectionVariant` (`ServicesGrid` keeps `withCta`, `FinalCta` keeps its props).
  - `RING_MAPS: RingMapInfo[]` (10 entries) from `@/content/realisations`.
  - DOM contract read by `IslandJourney` (Task 6): `[data-island-chapter="hero|ring|stats|cta"]` on the Hero / Réalisations / Stats / FinalCta sections. `.island-stage` is the sticky child of the ring and stats sections. `[data-island-stat]` (with `data-final`) are the 4 aria-hidden stat number spans.
  - CSS contract: `html[data-island="pending|loading|live|off"]`, `.island-layer`, `.island-canvas`, `.island-poster`, `.island-glass`, `.island-chapter--ring|--stats`, `.island-stage` (`--island-stage-top`), `.island-swap`.
  - i18n: `b2b.island.toggle|on|off|ringList`.

- [ ] **Step 1: Copy the verification tools and record the bundle baseline**

```bash
mkdir -p "$S/island/ref" && cp "$TOOLS"/{cdp.mjs,record-proto.mjs,static-server.mjs} "$S/" && cp -r "$TOOLS/lh" "$S/lh"
npm run build 2>&1 | grep -E "\[locale\]\s" | head -3
```
Expected: the build succeeds. Note the `First Load JS` value of the `/[locale]` route row. It is the baseline for Task 6 Step 14, so write it into your task notes.

- [ ] **Step 2: Write the failing `RING_MAPS` test**

```ts
// src/content/realisations.test.ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import mapsData from "@/data/maps.json";
import { RING_MAPS } from "./realisations";

describe("RING_MAPS (3D ring chapter + its HTML list)", () => {
  it("lists 10 distinct maps — the ring has 10 slots", () => {
    expect(RING_MAPS).toHaveLength(10);
    expect(new Set(RING_MAPS.map((m) => m.id)).size).toBe(10);
  });
  it("takes every field from maps.json (single source of truth)", () => {
    for (const r of RING_MAPS) {
      const m = mapsData.find((x) => x.id === r.id);
      expect(m, r.id).toBeDefined();
      expect(r.title).toBe(m?.title);
      expect(r.creator).toBe(m?.creator);
      expect(r.minutes).toBe(m?.stats.minutesPlayed);
      expect(r.thumbnail).toBe(m?.thumbnail);
      expect(m?.tags).toContain(r.tag);
    }
  });
  it("only uses thumbnails that exist on disk (no 400 in the ring)", () => {
    for (const r of RING_MAPS) expect(existsSync(join(process.cwd(), "public", r.thumbnail)), r.thumbnail).toBe(true);
  });
});
```
Run: `npx vitest run src/content/realisations.test.ts`. Expected: FAIL, because `RING_MAPS` is undefined ("expected undefined to have a length of 10" or a TypeError).

- [ ] **Step 3: Add `RING_MAPS` to `src/content/realisations.ts`**

Add this import at the top, next to the existing imports:
```ts
import type { RingMapInfo } from "@/lib/three/island/types";
```
Append at the end of the file:
```ts
// The 10 maps shown as screens in the homepage's 3D ring chapter (and in its accessible HTML list),
// in ring order (= prototype order). `tag` must be one of the map's maps.json tags (tested).
// sprite-pillars is left out: its thumbnail file is still missing.
const RING: { id: string; tag: string }[] = [
  { id: "clutch-realistics-1v2", tag: "BOXFIGHT" },
  { id: "martoz-1v1-build-fights", tag: "BUILDING" },
  { id: "martoz-turtle-fights-ffa", tag: "FREE FOR ALL" },
  { id: "pro-endgame-cup-duo", tag: "ZONEWARS" },
  { id: "clutch-realistics-2v3", tag: "TRIOS" },
  { id: "boxfight-2v2-ranked", tag: "BOXFIGHT" },
  { id: "carlife-tycoon", tag: "SIMULATOR" },
  { id: "the-box", tag: "PVP" },
  { id: "senses-rush", tag: "DEATHRUN" },
  { id: "rift-racers-alpine", tag: "RACE" },
];

export const RING_MAPS: RingMapInfo[] = RING.map(({ id, tag }) => {
  const m = byId(id);
  return { id, title: m.title, creator: m.creator, minutes: m.stats.minutesPlayed, tag, thumbnail: m.thumbnail };
});
```
Run: `npx vitest run src/content/realisations.test.ts`. Expected: PASS, 3 tests.

- [ ] **Step 4: Add the i18n keys** (4 routed locales; use Edit with these exact strings)

- `src/messages/fr.json`: replace ` "b2b": {\n  "nav": {` with ` "b2b": {\n  "island": { "toggle": "Expérience 3D\u00a0:", "on": "activée", "off": "désactivée", "ringList": "Sélection de maps" },\n  "nav": {`
- `src/messages/en.json`: replace ` "b2b": {\n  "nav": {` with ` "b2b": {\n  "island": { "toggle": "3D experience:", "on": "on", "off": "off", "ringList": "Featured maps" },\n  "nav": {`
- `src/messages/es.json`: replace `  "b2b": {\n    "nav": {` with `  "b2b": {\n    "island": { "toggle": "Experiencia 3D:", "on": "activada", "off": "desactivada", "ringList": "Mapas destacados" },\n    "nav": {`
- `src/messages/de.json`: replace `  "b2b": {\n    "nav": {` with `  "b2b": {\n    "island": { "toggle": "3D-Erlebnis:", "on": "an", "off": "aus", "ringList": "Ausgewählte Maps" },\n    "nav": {`

(`\n` = a real newline in the Edit strings. `\u00a0` stays as the JSON escape, i.e. a no-break space before the French colon.)

Run: `node -e "for (const l of ['fr','en','es','de']) { const m = require('./src/messages/' + l + '.json'); console.log(l, JSON.stringify(m.b2b.island)); }"`
Expected: 4 lines, each showing the 4 keys.

- [ ] **Step 5: Create `src/components/ui/Glass.tsx`**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** "over3d" = homepage sections floating over the 3D world (spec §3.3). */
export type SectionVariant = "default" | "over3d";

interface GlassProps {
  on: boolean;
  className?: string;
  children: ReactNode;
}

// Dark glass panel carrying a section's content over the 3D world. With on={false} it renders the
// children unchanged, so the default variant keeps today's markup.
export function Glass({ on, className, children }: GlassProps) {
  if (!on) return <>{children}</>;
  return <div className={cn("island-glass", className)}>{children}</div>;
}
```

- [ ] **Step 6: Append the island block to `src/app/motion.css`**

```css
/* ==== 3D island homepage — spec specs/2026-09-27-3d-island-homepage.md ==== */
/* html[data-island]: pending (3D decided on, loading after idle) → loading → live; off = poster/static.
   Set before first paint by the inline boot script, then by IslandJourney. */

/* WebGL layer, fixed behind everything. z-index -1 paints it above the (propagated) body background and
   below every in-flow section and the footer, without touching shared layout components. */
.island-layer { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
.island-canvas { display: block; width: 100%; height: 100vh; height: 100lvh; opacity: 0; transition: opacity 0.9s ease; }
html[data-island="live"] .island-canvas { opacity: 1; }

/* Poster: the hero background from the first paint; crossfades away once a 3D frame is on screen. */
.island-poster { transition: opacity 1.2s ease; }
html[data-island="live"] .island-poster { opacity: 0; }

/* Dark glass panels carry the homepage content over the world (backdrop blur on desktop only). */
.island-glass {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1.25rem;
  background: rgba(10, 10, 15, 0.72);
  padding: 1.25rem;
}
@media (min-width: 768px) { .island-glass { padding: 2rem; } }
@media (min-width: 1024px) and (pointer: fine) {
  html[data-island="live"] .island-glass { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
}

/* Sticky chapters — only while the journey is on. The static fallback keeps the normal flow. */
html:is([data-island="pending"], [data-island="loading"], [data-island="live"]) .island-chapter--ring { min-height: 300vh; }
html:is([data-island="pending"], [data-island="loading"], [data-island="live"]) .island-chapter--stats { min-height: 150vh; }
html:is([data-island="pending"], [data-island="loading"], [data-island="live"]) .island-stage {
  position: sticky;
  /* IslandJourney sets a negative value when the stage is taller than the viewport: it then pins by its bottom */
  top: var(--island-stage-top, 0px);
  min-height: 100vh;
  min-height: 100svh;
}

/* MapFocusCard content swap */
.island-swap { animation: island-swap 0.45s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes island-swap { from { opacity: 0; transform: translateY(8px); } }

@media (prefers-reduced-motion: reduce) {
  .island-swap { animation: none; }
  .island-canvas,
  .island-poster { transition: none; }
}
```

- [ ] **Step 7: Create the placeholder poster** (replaced by the real render in Task 12)

```bash
node -e "const svg='<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1600\" height=\"900\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#05031a\"/><stop offset=\"0.6\" stop-color=\"#1d0c4f\"/><stop offset=\"1\" stop-color=\"#0b4a70\"/></linearGradient><radialGradient id=\"r\" cx=\"0.62\" cy=\"0.62\" r=\"0.35\"><stop offset=\"0\" stop-color=\"#00d4ff\" stop-opacity=\"0.35\"/><stop offset=\"1\" stop-color=\"#00d4ff\" stop-opacity=\"0\"/></radialGradient></defs><rect width=\"1600\" height=\"900\" fill=\"url(#g)\"/><rect width=\"1600\" height=\"900\" fill=\"url(#r)\"/></svg>'; require('sharp')(Buffer.from(svg)).webp({ quality: 70 }).toFile('public/images/island-poster.webp').then((i) => console.log(i.width, i.height, i.size))"
```
Expected: `1600 900 <size>` with size < 80000.

- [ ] **Step 8: Rewrite the simple over3d sections** (Opportunity, Audiences, ServicesGrid, Process, SectorIdeas, FaqB2B). For each, the section classes swap to `island-over3d` and the inner content is wrapped in `<Glass on={over3d}>`. The default variant renders exactly what it renders today.

`src/components/sections/Opportunity.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { cn } from "@/lib/utils";

const LEVER_ICONS = ["⏱️", "🎮", "🔁", "🏆", "✨", "📈", "🤝"];

interface OpportunityProps {
  variant?: SectionVariant;
}

export async function Opportunity({ variant = "default" }: OpportunityProps) {
  const t = await getTranslations("b2b.opportunity");
  const levers = t.raw("levers") as string[];
  const over3d = variant === "over3d";
  return (
    <section className={cn("py-20 md:py-24", over3d ? "island-over3d" : "border-t border-white/5 bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {levers.map((label, i) => (
              <ScrollReveal key={label}>
                <div className="h-full rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-4 transition-all hover:-translate-y-1 hover:border-accent/40">
                  <span className="mb-2 block text-xl">{LEVER_ICONS[i]}</span>
                  <span className="text-sm font-semibold text-white">{label}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/Audiences.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { AUDIENCE_LINKS, type AudienceText } from "@/content/site";
import { cn } from "@/lib/utils";

interface AudiencesProps {
  variant?: SectionVariant;
}

export async function Audiences({ variant = "default" }: AudiencesProps) {
  const t = await getTranslations("b2b.audiences");
  const items = t.raw("items") as AudienceText[];
  const over3d = variant === "over3d";
  return (
    <section id="pour-qui" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((a, i) => (
              <ScrollReveal key={AUDIENCE_LINKS[i].slug}>
                <article data-tilt className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-surface to-surface/40 p-6 transition-colors hover:border-accent/45">
                  <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{a.tag}</span>
                  <h3 className="mt-2.5 font-heading text-lg font-bold text-white">{a.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-400">{a.text}</p>
                  <p className="my-4 border-l-2 border-primary pl-3 text-xs text-slate-400">{a.examples}</p>
                  <div className="mt-auto">
                    <Cta href={AUDIENCE_LINKS[i].href} variant="micro" event="cta_cible" eventParams={{ cible: AUDIENCE_LINKS[i].slug }}>
                      {a.cta} →
                    </Cta>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/ServicesGrid.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { SERVICE_ICONS, type ServiceText } from "@/content/site";
import { cn } from "@/lib/utils";

interface ServicesGridProps {
  withCta?: boolean;
  variant?: SectionVariant;
}

export async function ServicesGrid({ withCta = true, variant = "default" }: ServicesGridProps) {
  const t = await getTranslations("b2b.services");
  const items = t.raw("items") as ServiceText[];
  const over3d = variant === "over3d";
  return (
    <section id="services" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "border-t border-white/5 bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s, i) => (
              <ScrollReveal key={s.title}>
                <div data-tilt className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-accent/40 hover:bg-accent/[0.04]">
                  <div className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/25 text-lg">{SERVICE_ICONS[i]}</div>
                  <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{s.benefit}</p>
                  <p className="mt-2 text-xs text-slate-400">{s.example}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          {withCta && (
            <div className="mt-9">
              <Cta href="/services" variant="micro" event="card_service_click">{t("ctaMore")} →</Cta>
            </div>
          )}
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/Process.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import type { StepText } from "@/content/site";
import { cn } from "@/lib/utils";

interface ProcessProps {
  variant?: SectionVariant;
}

export async function Process({ variant = "default" }: ProcessProps) {
  const t = await getTranslations("b2b.process");
  const items = t.raw("items") as StepText[];
  const over3d = variant === "over3d";
  return (
    <section id="process" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "border-t border-white/5 bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
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
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/SectorIdeas.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { SECTOR_ICONS, type SectorText } from "@/content/site";
import { cn } from "@/lib/utils";

interface SectorIdeasProps {
  variant?: SectionVariant;
}

export async function SectorIdeas({ variant = "default" }: SectorIdeasProps) {
  const t = await getTranslations("b2b.sectors");
  const items = t.raw("items") as SectorText[];
  const over3d = variant === "over3d";
  return (
    <section id="idees" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "border-t border-white/5 bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((s, i) => (
              <ScrollReveal key={s.title}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:border-primary/50 hover:bg-primary/[0.06]">
                  <h3 className="flex items-center gap-2 font-heading text-base font-bold text-white"><span>{SECTOR_ICONS[i]}</span>{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{s.text}</p>
                </div>
              </ScrollReveal>
            ))}
            <ScrollReveal>
              <div className="flex h-full flex-col justify-center rounded-2xl border border-accent/35 bg-accent/[0.05] p-5">
                <h3 className="font-heading text-base font-bold text-white">💡 {t("yourSector")}</h3>
                <div className="mt-2">
                  <Cta href="/contact" variant="micro" event="cta_idee_activation">{t("ctaIdea")} →</Cta>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/FaqB2B.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { JsonLd } from "@/components/ui/JsonLd";
import { SectionHead } from "@/components/ui/SectionHead";
import type { QA } from "@/content/site";
import { cn } from "@/lib/utils";

interface FaqB2BProps {
  variant?: SectionVariant;
}

export async function FaqB2B({ variant = "default" }: FaqB2BProps) {
  const t = await getTranslations("b2b.faq");
  const items = t.raw("items") as QA[];
  const over3d = variant === "over3d";
  return (
    <section id="faq" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "bg-surface-dark")}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="mx-auto max-w-3xl px-6">
        <Glass on={over3d}>
          <SectionHead center eyebrow={t("eyebrow")} title={t("title")} />
          <div className="mt-10 space-y-2.5">
            {items.map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/[0.07] bg-white/[0.02]">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-white [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex-none text-xl text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </Glass>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Rewrite WhyKaio, FinalCta and Marquee.** Their grids move one level down so the glass panel can wrap them. The default layout is pixel-identical.

`src/components/sections/WhyKaio.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";
import { cn } from "@/lib/utils";

function Rich({ text }: { text: string }) {
  // renders <b>bold</b> segments
  const parts = text.split(/(<b>[^<]+<\/b>)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("<b>") && p.endsWith("</b>") ? (
          <strong key={i} className="font-semibold text-white">{p.slice(3, -4)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

interface WhyKaioProps {
  variant?: SectionVariant;
}

export async function WhyKaio({ variant = "default" }: WhyKaioProps) {
  const t = await getTranslations("b2b.why");
  const items = t.raw("items") as string[];
  const over3d = variant === "over3d";
  return (
    <section id="pourquoi" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <ScrollReveal>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t("eyebrow")}</p>
              <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{t("title")}</h2>
              <ul className="mt-7 flex flex-col gap-3.5">
                {items.map((w) => (
                  <li key={w} className="flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded-lg border border-accent/30 bg-accent/10 text-xs font-bold text-accent">✓</span>
                    <p className="text-[15px] text-slate-300"><Rich text={w} /></p>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal>
              <div className="rounded-2xl border border-white/[0.07] bg-[radial-gradient(70%_60%_at_70%_10%,rgba(123,47,190,0.2),transparent),#12121A] p-8 text-center">
                <div className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-5xl font-extrabold text-transparent md:text-6xl">{TOTAL_MINUTES_LABEL}</div>
                <p className="mt-1.5 text-slate-400">{t("minutesCaption")}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {PROOF.collaborators.map((c) => (
                    <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300">{c}</span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/FinalCta.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { BriefForm } from "@/components/forms/BriefForm";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PROOF, type ProjectType } from "@/content/site";
import { cn } from "@/lib/utils";

interface FinalCtaProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  defaultType?: ProjectType;
  variant?: SectionVariant;
}

export async function FinalCta({ id = "contact", eyebrow, title, text, defaultType, variant = "default" }: FinalCtaProps) {
  const t = await getTranslations("b2b.finalCta");
  const eb = eyebrow ?? t("eyebrow");
  const ti = title ?? t("title");
  const tx = text ?? t("text");
  const over3d = variant === "over3d";
  return (
    <section
      id={id}
      data-island-chapter={over3d ? "cta" : undefined}
      className={cn(
        "relative overflow-hidden py-20 md:py-24",
        over3d ? "island-over3d" : "border-t border-white/5 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(123,47,190,0.16),transparent_70%)]",
      )}
    >
      {!over3d && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex select-none items-center">
          <div data-motion="parallax" data-axis="x" data-speed="-0.3" className="whitespace-nowrap font-heading text-[22vw] font-extrabold leading-none text-transparent [-webkit-text-stroke:1px_rgba(123,47,190,0.28)]">
            KAIOCORP KAIOCORP
          </div>
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <ScrollReveal>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eb}</p>
              <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{ti}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400 md:text-lg">{tx}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Cta href={`mailto:${PROOF.email}?subject=Brief%20projet%20Fortnite`} variant="ghost" event="cta_email">✉️ {t("emailBtn")}</Cta>
              </div>
              <p className={cn("mt-6 flex items-center gap-2 text-sm", over3d ? "text-slate-400" : "text-slate-500")}>
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px] shadow-accent" />
                {t("responseNote")} · {PROOF.email}
              </p>
            </ScrollReveal>
            <ScrollReveal>
              <BriefForm defaultType={defaultType} />
            </ScrollReveal>
          </div>
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/motion/Marquee.tsx`:
```tsx
import mapsData from "@/data/maps.json";
import type { SectionVariant } from "@/components/ui/Glass";
import type { FortniteMap } from "@/types";
import { cn } from "@/lib/utils";

const TITLES = (mapsData as FortniteMap[]).map((m) => m.title);

interface MarqueeProps {
  variant?: SectionVariant;
}

// Decorative marquee of every map title (duplicates real content → aria-hidden). The CSS loop
// runs without JS; the motion engine bends its speed/direction with scroll velocity.
// over3d: transparent background — the 3D world shows through (spec §3.2).
export function Marquee({ variant = "default" }: MarqueeProps) {
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
    <div data-motion="marquee" aria-hidden="true" className={cn("overflow-hidden border-y border-white/5 py-6 md:py-8", variant === "default" && "bg-surface-dark")}>
      <div className="motion-marquee-track flex w-max whitespace-nowrap">
        {row}
        {row}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Rewrite Hero, Realisations and StatsBand** (the over3d branch is a distinct layout; the default branch is today's code)

`src/components/sections/Hero.tsx`:
```tsx
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroShader } from "@/components/motion/HeroShader";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";
import { cn } from "@/lib/utils";

interface HeroProps {
  variant?: SectionVariant;
}

export async function Hero({ variant = "default" }: HeroProps) {
  const t = await getTranslations("b2b.hero");
  const title = t("title");
  const over3d = variant === "over3d";
  return (
    <section
      data-island-chapter={over3d ? "hero" : undefined}
      className={cn("relative overflow-hidden pb-20 pt-36 md:pt-44", over3d ? "island-over3d flex min-h-[100svh] items-center" : "bg-surface-dark")}
    >
      {over3d ? (
        <>
          {/* Poster = the 3D hero frame (Task 12). Decorative → alt="". Crossfades out once the canvas is live. */}
          <Image src="/images/island-poster.webp" alt="" fill priority sizes="100vw" className="island-poster z-0 object-cover" />
          <div aria-hidden="true" className="island-poster absolute inset-x-0 bottom-0 z-0 h-48 bg-gradient-to-b from-transparent to-surface-dark" />
        </>
      ) : (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(60% 50% at 75% 15%, rgba(123,47,190,0.32), transparent 70%), radial-gradient(50% 45% at 12% 85%, rgba(0,212,255,0.18), transparent 70%)",
            }}
          />
          <HeroShader />
          <div className="hero-grid absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
        </>
      )}

      <div data-motion="parallax" data-speed="0.15" className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <Glass on={over3d} className="max-w-3xl">
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
          <p className={cn("hero-fade-rise mt-5 flex items-center gap-2 text-sm [--d:700ms]", over3d ? "text-slate-400" : "text-slate-500")}>
            <span className="h-1.5 w-1.5 rounded-full bg-primary-light shadow-[0_0_8px] shadow-primary-light" />
            {t("tagline")}
          </p>
        </Glass>
      </div>
    </section>
  );
}
```

`src/components/sections/Realisations.tsx`: keep `ProjectGrid` exactly as it is today (lines 1–73). Replace the `Realisations` function and adjust the imports:
```tsx
// imports: add
import { Glass, type SectionVariant } from "@/components/ui/Glass";
// and replace the content import with
import { REALISATIONS_META, RING_MAPS, type ProjectCardMeta } from "@/content/realisations";

interface RealisationsProps {
  variant?: SectionVariant;
}

export async function Realisations({ variant = "default" }: RealisationsProps) {
  const t = await getTranslations("b2b.realisations");
  if (variant === "default") {
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
  // over3d: the ring chapter. Sticky stage in a 300vh section while the 3D is on; normal flow otherwise.
  // The HTML list keeps all 10 ring maps accessible (no content exists only inside WebGL, spec §7).
  const island = await getTranslations("b2b.island");
  const minutesUnit = t("units.minutes");
  return (
    <section id="realisations" data-island-chapter="ring" className="island-over3d island-chapter--ring relative">
      <div className="island-stage">
        <div className="mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-between gap-6 px-6 pb-10 pt-24 lg:flex-row lg:items-end">
          <Glass on className="max-w-xl">
            <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
            <ol aria-label={island("ringList")} className="mt-6 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
              {RING_MAPS.map((m, i) => (
                <li key={m.id} className="min-w-0">
                  <Link
                    href={`/maps/${m.id}` as `/maps/${string}`}
                    className="font-semibold text-slate-200 underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span aria-hidden="true" className="mr-1.5 font-heading text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {m.title}
                  </Link>
                  <span className="text-slate-400"> · {m.minutes} {minutesUnit}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <Cta href="/realisations" variant="micro" event="cta_voir_realisations">{t("ctaAll")} →</Cta>
            </div>
          </Glass>
        </div>
      </div>
    </section>
  );
}
```
(`Link`, `SectionHead`, `Cta` and `getTranslations` are already imported in this file. `cn` stays used by `ProjectGrid`. Task 10 adds `MapFocusCard` next to the glass panel.)

`src/components/sections/StatsBand.tsx`:
```tsx
import { getTranslations } from "next-intl/server";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import mapsData from "@/data/maps.json";
import { TOTAL_COLLABORATORS, TOTAL_MAPS, TOTAL_MINUTES_LABEL } from "@/lib/stats";

interface StatsBandProps {
  variant?: SectionVariant;
}

export async function StatsBand({ variant = "default" }: StatsBandProps) {
  const t = await getTranslations("b2b.stats");
  const brandCount = (mapsData as { brand?: string }[]).filter((m) => m.brand).length;

  const STATS = [
    { num: TOTAL_MINUTES_LABEL, lbl: t("minutesPlayed") },
    { num: `${TOTAL_MAPS}+`, lbl: t("shipped") },
    { num: `${TOTAL_COLLABORATORS}`, lbl: t("creators") },
    { num: `${brandCount} ${t("brandsUnit")}`, lbl: t("brandActivations") },
  ];

  if (variant === "over3d") {
    // Stats chapter: sticky stage (150vh section) under the rising pillars. While the 3D is live the
    // visible numbers count up with their pillar (IslandJourney writes the aria-hidden layer); screen
    // readers and the static fallback always get the final value.
    return (
      <section data-island-chapter="stats" className="island-over3d island-chapter--stats relative">
        <div className="island-stage">
          <div className="mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-end px-6 pb-10 pt-24">
            <Glass on>
              <div aria-hidden="true" data-motion="sweep" className="motion-scan pointer-events-none absolute inset-x-0 top-0 h-px" />
              <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
                {STATS.map((s, i) => (
                  <div key={s.lbl}>
                    <div className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl lg:text-5xl">
                      <span aria-hidden="true" data-island-stat={i} data-final={s.num}>{s.num}</span>
                      <span className="sr-only">{s.num}</span>
                    </div>
                    <div className="mt-1.5 text-sm text-slate-400">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative border-y border-white/5 bg-gradient-to-b from-primary/[0.07] to-transparent">
      <div aria-hidden="true" data-motion="sweep" className="motion-scan pointer-events-none absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-center lg:grid-cols-4">
        {STATS.map((s) => (
          <ScrollReveal key={s.lbl}>
            <div data-motion="decode" className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl lg:text-5xl">
              {s.num}
            </div>
            <div className="mt-1.5 text-sm text-slate-400">{s.lbl}</div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 11: Layout + page**

In `src/app/[locale]/layout.tsx`, add `suppressHydrationWarning` to the `<html>` element. It is needed because the homepage boot script sets `html[data-island]` before hydration:
```tsx
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} className={`${inter.variable} ${orbitron.variable}`} suppressHydrationWarning>
```

Replace `src/app/[locale]/page.tsx` with:
```tsx
import { Hero } from "@/components/sections/Hero";
import { Opportunity } from "@/components/sections/Opportunity";
import { Audiences } from "@/components/sections/Audiences";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Realisations } from "@/components/sections/Realisations";
import { StatsBand } from "@/components/sections/StatsBand";
import { Marquee } from "@/components/motion/Marquee";
import { Process } from "@/components/sections/Process";
import { WhyKaio } from "@/components/sections/WhyKaio";
import { SectorIdeas } from "@/components/sections/SectorIdeas";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { ISLAND_BOOT_SCRIPT } from "@/lib/three/island/boot";

// The homepage is the 3D journey (spec specs/2026-09-27-3d-island-homepage.md): real sections, new
// order (Stats after Réalisations), every section floating over the world ("over3d").
export default function HomePage() {
  return (
    <main>
      {/* Runs before the sections are parsed: html[data-island] is right on first paint (no sticky pop-in). */}
      <script dangerouslySetInnerHTML={{ __html: ISLAND_BOOT_SCRIPT }} />
      <Hero variant="over3d" />
      <Opportunity variant="over3d" />
      <Audiences variant="over3d" />
      <ServicesGrid variant="over3d" />
      <Realisations variant="over3d" />
      <StatsBand variant="over3d" />
      <Marquee variant="over3d" />
      <Process variant="over3d" />
      <WhyKaio variant="over3d" />
      <SectorIdeas variant="over3d" />
      <FaqB2B variant="over3d" />
      <FinalCta variant="over3d" />
    </main>
  );
}
```

- [ ] **Step 12: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src && npm run build`
Expected: all green, and the build lists `/[locale]` with no errors. Then run `grep -n "HeroShader\|gallery" "src/app/[locale]/page.tsx"`, which should print nothing.

- [ ] **Step 13: Write the e2e helper library `$S/island/lib.mjs`** (used by every later task)

```js
// Shared helpers for the island e2e scripts (CDP on the headless Chromium — see "Verification toolkit").
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { session, sleep } from "../cdp.mjs";

export { session, sleep };
export const BASE = process.env.BASE ?? "http://localhost:3000";
export const DIR = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(DIR, "ref"), { recursive: true });
export const sharp = createRequire("C:/Users/Kaio/Documents/Claude/Portfolio/package.json")("sharp");

export function check(ok, message) {
  if (ok) console.log("  ok   " + message);
  else {
    process.exitCode = 1;
    console.log("  FAIL " + message);
  }
}

export async function waitFor(s, expression, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await s.eval(`return (${expression});`)) === true) return true;
    await sleep(200);
  }
  throw new Error("timeout waiting for: " + expression);
}

/** Wait until the world's smoothed progress stops moving; returns it (dev handle). */
export async function settle(s) {
  let previous = -1;
  for (let i = 0; i < 120; i++) {
    const p = await s.eval("return window.__island ? window.__island.stats.p : -1;");
    if (p >= 0 && Math.abs(p - previous) < 1e-4) return p;
    previous = p;
    await sleep(150);
  }
  return previous;
}

/** Scroll so the camera progress reaches p (dev handle). */
export async function seek(s, p) {
  await s.eval(`window.scrollTo(0, window.__island.scrollFor(${p})); return true;`);
  await waitFor(s, `Math.abs(window.__island.stats.p - ${p}) < 0.003`, 15000);
}

/** Scroll position where a chapter's sticky stage starts pinning (or the section top). */
export function chapterStart(s, name) {
  return s.eval(`const sec = document.querySelector('[data-island-chapter="${name}"]'); const stage = sec.querySelector(".island-stage"); const top = sec.getBoundingClientRect().top + scrollY; const vh = document.documentElement.clientHeight; return stage ? top - Math.min(0, vh - stage.offsetHeight) : top;`);
}

const HIDE_UI = "header, footer, main > :not(.island-layer), [data-motion-progress], .motion-cursor, .motion-curtain { visibility: hidden !important; }";
export function hideUi(s) {
  return s.eval(`if (!document.getElementById("hide-ui")) { const st = document.createElement("style"); st.id = "hide-ui"; st.textContent = ${JSON.stringify(HIDE_UI)}; document.head.append(st); } return true;`);
}
export function showUi(s) {
  return s.eval(`document.getElementById("hide-ui")?.remove(); return true;`);
}

export async function sideBySide(a, b, out) {
  const [ma, mb] = await Promise.all([sharp(a).metadata(), sharp(b).metadata()]);
  await sharp({ create: { width: ma.width + mb.width, height: Math.max(ma.height, mb.height), channels: 3, background: "#000" } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: ma.width, top: 0 }])
    .png()
    .toFile(out);
}

/** Share of pixels whose luminance changed by > 40/255 between two same-size screenshots. */
export async function popRatio(a, b) {
  const [ra, rb] = await Promise.all([a, b].map((f) => sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  const n = ra.info.width * ra.info.height;
  let changed = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const la = 0.2126 * ra.data[o] + 0.7152 * ra.data[o + 1] + 0.0722 * ra.data[o + 2];
    const lb = 0.2126 * rb.data[o] + 0.7152 * rb.data[o + 1] + 0.0722 * rb.data[o + 2];
    if (Math.abs(la - lb) > 40) changed++;
  }
  return changed / n;
}

/** Tracks live WebGL contexts: window.__liveGl() → count not lost. Install before navigation. */
export const LIVE_GL_PATCH = `(() => { const refs = []; const orig = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { const ctx = orig.call(this, type, ...rest); if (ctx && /webgl/.test(type) && !refs.some((r) => r.deref() === ctx)) refs.push(new WeakRef(ctx)); return ctx; }; window.__liveGl = () => refs.filter((r) => { const c = r.deref(); return c && !c.isContextLost(); }).length; })();`;

/** Accumulates CLS into window.__cls. Install before navigation. */
export const CLS_PATCH = `(() => { window.__cls = 0; new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); })();`;

/** Makes WebGL unavailable (no-WebGL fallback test). Install before navigation. */
export const NO_WEBGL_PATCH = `(() => { const orig = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return /webgl/.test(type) ? null : orig.call(this, type, ...rest); }; })();`;
```

- [ ] **Step 14: Static-layout e2e `$S/island/t5-static.mjs`** (dev server running, Chromium on 9333)

```js
// Task 5 — restructured homepage without 3D: order, variants, fallback vs sticky layout, CLS, console.
import { BASE, CLS_PATCH, DIR, check, session, sleep } from "./lib.mjs";

const EXPECTED = ["hero", "?", "pour-qui", "services", "realisations", "stats", "marquee", "process", "pourquoi", "idees", "faq", "contact"];

for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    console.log(`\n${w}x${h} ${reducedMotion}`);
    const s = await session({ width: w, height: h, mobile, reducedMotion });
    await s.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS_PATCH });
    await s.goto(`${BASE}/`);
    await sleep(3500);
    const r = await s.eval(`
      const main = document.querySelector("main");
      const order = [...main.querySelectorAll(":scope > section, :scope > [data-motion='marquee']")].map((el) => el.id || el.dataset.islandChapter || el.dataset.motion || "?");
      const ring = document.querySelector('[data-island-chapter="ring"]');
      const stats = document.querySelector('[data-island-chapter="stats"]');
      const poster = document.querySelector("img.island-poster");
      const stat = [...document.querySelectorAll("[data-island-stat]")];
      return {
        island: document.documentElement.dataset.island,
        order,
        vh: document.documentElement.clientHeight,
        ringH: ring.offsetHeight,
        statsH: stats.offsetHeight,
        stagePos: getComputedStyle(ring.querySelector(".island-stage")).position,
        poster: !!poster && poster.complete && poster.naturalWidth > 0,
        shader: !!document.querySelector(".motion-shader"),
        gallery: !!document.querySelector('[data-motion="gallery"]'),
        ringLinks: ring.querySelectorAll('ol a[href*="/maps/"]').length,
        stats: stat.length,
        // sr-only always holds the final value; the visible layer too unless the 3D is live (count-up, Task 11)
        statsFinal: stat.every((el) => el.nextElementSibling?.textContent === el.dataset.final && (document.documentElement.dataset.island === "live" || el.textContent === el.dataset.final)),
        hscroll: document.documentElement.scrollWidth > innerWidth,
        glass: document.querySelectorAll(".island-glass").length,
      };`);
    check(JSON.stringify(r.order) === JSON.stringify(EXPECTED), `section order ${JSON.stringify(r.order)}`);
    check(r.poster && !r.shader && !r.gallery, "poster present, no HeroShader, no pinned gallery");
    check(r.ringLinks === 10 && r.stats === 4 && r.statsFinal, "10 ring links, 4 stats with their final values");
    check(r.glass >= 11, `glass panels (${r.glass})`);
    check(!r.hscroll, "no horizontal scroll");
    if (reducedMotion === "reduce") {
      check(r.island === "off", `boot script: off under reduced motion (${r.island})`);
      check(r.stagePos === "static" && r.ringH < 1.5 * r.vh, `static flow (ring ${r.ringH}px, stage ${r.stagePos})`);
    } else {
      // pending in Task 5; loading/live once the world exists (re-runs in Tasks 7 and 13)
      check(["pending", "loading", "live"].includes(r.island), `3D decided on under no-preference (${r.island})`);
      check(r.stagePos === "sticky" && r.ringH >= 2.9 * r.vh && r.statsH >= 1.45 * r.vh, `sticky chapters (ring ${r.ringH}px, stats ${r.statsH}px)`);
    }
    for (const name of ["hero", "ring", "stats", "cta"]) {
      await s.eval(`document.querySelector('[data-island-chapter="${name}"]').scrollIntoView(); return true;`);
      await sleep(900);
      await s.shot(`${DIR}/t5-${w}-${reducedMotion}-${name}.png`);
    }
    check((await s.eval("return window.__cls;")) < 0.02, "CLS < 0.02");
    check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
    await s.close();
  }
}
```
Run (dev server up): `CDP_PORT=9333 node "$S/island/t5-static.mjs"`
Expected: every line is `ok` in all 4 runs (no `FAIL`). Then open the 16 screenshots with Read. Reduced motion should show the classic homepage with the poster hero and glass panels. No-preference should show the same panels, with the ring and stats stages pinned; the empty (dark) background behind them is expected at this task.

---

### Task 6: World core + `IslandJourney`: lights, sky, post, world loop, lifecycle, dispose

After this task the homepage runs the real three.js world: sky, fog, lights, post-processing, the full camera journey and the adaptive quality ladder. There is no geometry yet, so it renders the sky and atmosphere changing along the path. The world is lazy-loaded after `load` + idle, synced to the real sections, and fully disposed on navigation.

**Files:**
- Create: `src/lib/three/island/lights.ts`, `sky.ts`, `post.ts`, `world.ts`, `src/components/three/IslandJourney.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Scratch: `$S/island/gpu.mjs`, `proto-ref.mjs`, `shots.mjs`, `t6-live.mjs`, `t6-desync.mjs`, `t6-dispose.mjs`, `bundle-check.mjs`

**Interfaces:**
- Consumes: Tasks 1–4 modules; `afterLoadIdle(cb, timeout?) => cancel` from `@/lib/motion/idle`; `RING_MAPS` + the DOM/CSS contract from Task 5.
- Produces:
  - `lights.ts`: `interface Lights { setDeep(deep: number): void }`; `createLights(ctx: SceneContext): Lights`; `interface PointLightHandle { setOn(on: boolean): void }`; `addPointLight(scene, color, intensity, distance, decay, position: readonly [number, number, number]): PointLightHandle`; `withRim<T extends THREE.MeshStandardMaterial>(material: T, color?, power?, strength?): T`.
  - `sky.ts`: `interface Sky { setDeep(value: number): void }`; `createSky(ctx: SceneContext): Sky`.
  - `post.ts`: `interface PostOptions { width; height; dpr; msaa; bloomScale; grain }`; `interface Post { render(dt); setSize(w, h); setScale(dpr, msaa); setTime(t); setVeil(v); setAberration(v); dispose() }`; `createPost(renderer, scene, camera, o: PostOptions): Post`.
  - `world.ts`: `interface WorldCallbacks { onFirstFrame(); onFocusChange(index: number); onStatsReveal(reveal: readonly number[]); onGiveUp() }`; `interface WorldOptions extends WorldCallbacks { gl: WebGL2RenderingContext; quality: QualitySettings; maps: readonly RingMapInfo[]; minutesUnit: string; reducedMotion: boolean; width: number; height: number; startProgress: number }`; `interface WorldStats { p; dpr; msaa; frames: number; introDone: boolean; tier }`; `interface World { update(targetProgress, rawDt); setSize(w, h); setPointer(x, y); dispose(); readonly stats: Readonly<WorldStats> }`; `createWorld(canvas, opts, signal: AbortSignal): Promise<World | null>` (null = aborted; everything already released). Tasks 8–11 extend `world.ts` only through its `sceneBuilders(ctx, opts, units)` function and its import block.
  - `IslandJourney({ maps: RingMapInfo[]; minutesUnit: string })`. It sets `html[data-island]` and `islandStore.status/focus/unsupported`. In dev only it exposes `window.__island = { stats, anchors, scrollFor(p) }`.

- [ ] **Step 1: Create `lights.ts`** (prototype 392–412; point lights re-homed at the scene root)

```ts
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
}

export function addPointLight(scene: THREE.Scene, color: THREE.ColorRepresentation, intensity: number, distance: number, decay: number, position: readonly [number, number, number]): PointLightHandle {
  const light = new THREE.PointLight(color, intensity, distance, decay);
  light.position.set(position[0], position[1], position[2]);
  scene.add(light);
  return {
    setOn(on) {
      light.intensity = on ? intensity : 0;
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
```

- [ ] **Step 2: Create `sky.ts`** (prototype 330–390; the shader is copied in full)

```ts
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
```

- [ ] **Step 3: Create `post.ts`** (prototype 1366–1394). Fixes: the MSAA samples and bloom resolution follow the render scale, and grain is a uniform.

```ts
// src/lib/three/island/post.ts
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLSL_NOISE } from "./noise";

// Post-processing (prototype lines 1366–1394): MSAA half-float target → bloom → output → grade
// (chromatic aberration, cloud veil, vignette, grain). Changes: MSAA samples and bloom resolution
// follow the render scale; grain is a uniform (0 under reduced motion).

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
  dispose(): void;
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

export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, o: PostOptions): Post {
  let { width, height, dpr } = o;
  const target = new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: o.msaa });
  const composer = new EffectComposer(renderer, target); // renderer already has pixelRatio = dpr
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.75, 0.5, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass({
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
  });
  composer.addPass(grade);
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
    dispose() {
      composer.passes.forEach((pass) => pass.dispose());
      composer.dispose();
    },
  };
}
```

- [ ] **Step 4: Create `world.ts`.** This is the orchestration, update loop, resize, adaptive step-down and disposal (prototype sections 1 and 15–16 minus the DOM). `sceneBuilders` is empty for now; Tasks 8–11 fill it.

```ts
// src/lib/three/island/world.ts
import * as THREE from "three";
import { createCameraRig, type CameraSample } from "./cameraPath";
import { cloudVeil, deepness, visibilityAt } from "./chapters";
import { DisposeBag, disposeGraph } from "./dispose";
import { createLights } from "./lights";
import { clamp, damp, lerp } from "./math";
import { createPost, type Post } from "./post";
import { decidePerf, PERF_WINDOW, type QualitySettings, type RenderScale } from "./quality";
import { createSky } from "./sky";
import type { FrameState, RingMapInfo, SceneContext, Unit } from "./types";

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
  /** 3D opted in under prefers-reduced-motion: no intro swoop, no bobbing, no speed kick, no grain. */
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

/** Scene units in build order; the world yields to the main thread before each entry (short tasks). */
function sceneBuilders(ctx: SceneContext, opts: WorldOptions, units: Unit[]): Array<() => void> {
  // Filled by Tasks 8–11 (island, clouds + particles, map ring, pillars + portal).
  return [];
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
  let post: Post | null = null;
  const release = () => {
    disposeGraph(scene);
    post?.dispose();
    bag.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };

  const units: Unit[] = [];
  let sky: ReturnType<typeof createSky>;
  let lights: ReturnType<typeof createLights>;
  try {
    sky = createSky(ctx);
    lights = createLights(ctx);
    for (const build of sceneBuilders(ctx, opts, units)) {
      await yieldToMain();
      if (signal.aborted) {
        release();
        return null;
      }
      build();
    }
    for (const unit of units) unit.resize?.(width, height); // initial layout (e.g. portrait pillars)
    post = createPost(renderer, scene, camera, {
      width,
      height,
      dpr: scale.dpr,
      msaa: scale.msaa,
      bloomScale: opts.quality.bloomScale,
      grain: opts.reducedMotion ? 0 : GRAIN,
    });
    try {
      await renderer.compileAsync(scene, camera); // every program up front → no stutter on first scroll
    } catch {
      // Older drivers: shaders compile lazily on first render.
    }
  } catch (error) {
    release();
    throw error;
  }
  if (signal.aborted) {
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
  const stats: WorldStats = { p: pSmooth, dpr: scale.dpr, msaa: scale.msaa, frames: 0, introDone: introT >= 1, tier: opts.quality.tier };
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
    t += dt;
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
    camera.rotateZ(cam.roll + Math.sin(t * 0.4) * 0.004 * frame.bob);
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
```

- [ ] **Step 5: Create `src/components/three/IslandJourney.tsx`**

```tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MutableRefObject } from "react";
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

/** Frame loop + pointer + canvas resize. Returns an idempotent stop() that disposes everything. */
function run(world: World, canvas: HTMLCanvasElement, anchors: AnchorsRef, stats: StatsBinding): () => void {
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
  const hideDebug = exposeDebug(world, anchors);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointer);
    resize.disconnect();
    hideDebug();
    world.dispose(); // disposes every GPU resource + forceContextLoss()
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
    islandStore.set({ unsupported: true });
    setStatus("off");
    return null;
  }
  setStatus("loading");
  const stats = bindStats();
  let world: World | null = null;
  let stop: (() => void) | null = null;
  try {
    const { createWorld } = await import("@/lib/three/island/world");
    if (!o.signal.aborted) {
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
          // Deferred: never tear the world down from inside its own update().
          onGiveUp: () =>
            queueMicrotask(() => {
              stop?.();
              setStatus("off");
            }),
        },
        o.signal,
      );
    }
  } catch (error) {
    console.error("[island]", error);
  }
  if (!world) {
    if (!gl.isContextLost()) gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
    stats.restore();
    if (!o.signal.aborted) setStatus("off");
    return null;
  }
  stop = run(world, canvas, o.anchors, stats);
  return stop;
}

export function IslandJourney({ maps, minutesUnit }: IslandJourneyProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const anchorsRef = useRef<Anchor[]>([]);
  const [rmVersion, setRmVersion] = useState(0);
  const pref = useSyncExternalStore(subscribe, getPref, getServerPref);
  const active = useSyncExternalStore(subscribe, getActive, getServerActive);

  // Mount: adopt the stored preference, follow OS reduced-motion changes. Unmount: leave no trace.
  useIsoLayoutEffect(() => {
    islandStore.set({ pref: readPreference(safeStorage()) });
    const media = window.matchMedia(REDUCED_MOTION);
    const onChange = () => setRmVersion((v) => v + 1);
    media.addEventListener("change", onChange);
    return () => {
      media.removeEventListener("change", onChange);
      delete document.documentElement.dataset.island;
      islandStore.reset();
    };
  }, []);

  // Before paint: provisional decision (WebGL2 assumed) — same rule as the inline boot script, which
  // does not run on client-side navigations.
  useIsoLayoutEffect(() => {
    const tier = selectTier({ ...readSignals(window), webgl2: !islandStore.get().unsupported }, pref);
    setStatus(tier === "off" ? "off" : "pending");
  }, [pref, rmVersion]);

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

  // The world: after load + idle; torn down on unmount, preference or reduced-motion change.
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || islandStore.get().status === "off") return;
    const controller = new AbortController();
    let stop: (() => void) | null = null;
    const cancelIdle = afterLoadIdle(() => {
      void startWorld(layer, { pref, maps, minutesUnit, anchors: anchorsRef, signal: controller.signal }).then((s) => {
        if (controller.signal.aborted) s?.();
        else stop = s;
      });
    });
    return () => {
      controller.abort();
      cancelIdle();
      stop?.();
    };
  }, [pref, rmVersion, maps, minutesUnit]);

  return <div ref={layerRef} className="island-layer" aria-hidden="true" />;
}
```

- [ ] **Step 6: Mount it in `src/app/[locale]/page.tsx`**

Replace the file with (Task 5's version + the journey, now an async server component):
```tsx
import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Opportunity } from "@/components/sections/Opportunity";
import { Audiences } from "@/components/sections/Audiences";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Realisations } from "@/components/sections/Realisations";
import { StatsBand } from "@/components/sections/StatsBand";
import { Marquee } from "@/components/motion/Marquee";
import { Process } from "@/components/sections/Process";
import { WhyKaio } from "@/components/sections/WhyKaio";
import { SectorIdeas } from "@/components/sections/SectorIdeas";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { IslandJourney } from "@/components/three/IslandJourney";
import { RING_MAPS } from "@/content/realisations";
import { ISLAND_BOOT_SCRIPT } from "@/lib/three/island/boot";

// The homepage is the 3D journey (spec specs/2026-09-27-3d-island-homepage.md): real sections, new
// order (Stats after Réalisations), every section floating over the world ("over3d").
export default async function HomePage() {
  const t = await getTranslations("b2b.realisations");
  return (
    <main>
      {/* Runs before the sections are parsed: html[data-island] is right on first paint (no sticky pop-in). */}
      <script dangerouslySetInnerHTML={{ __html: ISLAND_BOOT_SCRIPT }} />
      <IslandJourney maps={RING_MAPS} minutesUnit={t("units.minutes")} />
      <Hero variant="over3d" />
      <Opportunity variant="over3d" />
      <Audiences variant="over3d" />
      <ServicesGrid variant="over3d" />
      <Realisations variant="over3d" />
      <StatsBand variant="over3d" />
      <Marquee variant="over3d" />
      <Process variant="over3d" />
      <WhyKaio variant="over3d" />
      <SectorIdeas variant="over3d" />
      <FaqB2B variant="over3d" />
      <FinalCta variant="over3d" />
    </main>
  );
}
```

- [ ] **Step 7: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: all green, no output.

- [ ] **Step 8: Start the servers and check the GPU**

Start `npm run dev` (background) and the Chromium command from the toolkit (background). Then create `$S/island/gpu.mjs`:
```js
import { session } from "./lib.mjs";
const s = await session();
await s.goto("about:blank");
console.log(await s.eval(`const gl = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true }); if (!gl) return "NO HARDWARE WEBGL2"; const ext = gl.getExtension("WEBGL_debug_renderer_info"); return gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER);`));
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/gpu.mjs"`
Expected: a hardware renderer string (e.g. `ANGLE (NVIDIA …, Direct3D11 …)`). If it prints `NO HARDWARE WEBGL2` or mentions SwiftShader, relaunch Chromium adding `--use-angle=d3d11 --enable-gpu` and re-run.

- [ ] **Step 9: Capture the prototype reference frames** (used by every render check from now on)

Start `node "$S/static-server.mjs"` (background, port 4000; the prototype also needs network access to cdn.jsdelivr.net). Create `$S/island/proto-ref.mjs`:
```js
// Reference frames of the prototype (UI hidden) at the render checkpoints.
import { DIR, session, sleep, waitFor } from "./lib.mjs";
const CHECKPOINTS = [0, 0.2, 0.4, 0.7, 0.87, 1];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const s = await session({ width: w, height: h, mobile: w < 768 });
  for (const p of CHECKPOINTS) {
    await s.goto(`http://localhost:4000/playground/3d-proto-a-island.html?nointro&p=${p}`);
    await waitFor(s, `document.getElementById("loader")?.classList.contains("done") === true`, 30000);
    await s.eval(`const st = document.createElement("style"); st.textContent = ".ui, .loader, .nogl { display: none !important; }"; document.head.append(st); return true;`);
    await sleep(2000);
    await s.shot(`${DIR}/ref/proto-${w}-${p}.png`);
    console.log("ref", w, p);
  }
  await s.close();
}
```
Run: `CDP_PORT=9333 node "$S/island/proto-ref.mjs"`. Expected: 12 `ref …` lines and 12 PNGs in `$S/island/ref/`. Look at 2 of them (Read) to confirm they show the island scene without UI.

- [ ] **Step 10: Render-check script `$S/island/shots.mjs`** (reused by Tasks 8–11)

```js
// Renders the live homepage scene (UI hidden) at camera checkpoints and pairs each frame with the prototype's.
// Usage: CDP_PORT=9333 node shots.mjs <tag> [width] [height] [p1,p2,…]
import { existsSync } from "node:fs";
import { BASE, DIR, hideUi, seek, session, sideBySide, sleep, waitFor } from "./lib.mjs";

const [, , tag = "check", w = "1440", h = "900", list = "0,0.2,0.4,0.7,0.87,1"] = process.argv;
const W = Number(w);
const H = Number(h);
const s = await session({ width: W, height: H, mobile: W < 768 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
await hideUi(s);
for (const p of list.split(",").map(Number)) {
  await seek(s, p);
  await sleep(700);
  const out = `${DIR}/port-${tag}-${W}-${p}.png`;
  await s.shot(out);
  const ref = `${DIR}/ref/proto-${W}-${p}.png`;
  if (existsSync(ref)) await sideBySide(ref, out, `${DIR}/cmp-${tag}-${W}-${p}.png`);
  const fps = await s.eval(`return new Promise((r) => { const f0 = window.__island.stats.frames, t0 = performance.now(); setTimeout(() => r(Math.round(((window.__island.stats.frames - f0) * 1000) / (performance.now() - t0))), 1500); });`);
  console.log(`p=${p} fps=${fps} tier=${await s.eval("return window.__island.stats.tier;")} -> ${out}`);
}
console.log("console:", JSON.stringify(s.logs));
await s.close();
```

- [ ] **Step 11: Live boot + chapter sync e2e `$S/island/t6-live.mjs`**

```js
// Task 6 — the world boots after load+idle, crossfades the poster, and follows the real sections.
import { BASE, CLS_PATCH, chapterStart, check, session, settle, sleep, waitFor } from "./lib.mjs";

const s = await session({ width: 1440, height: 900 });
await s.send("Page.addScriptToEvaluateOnNewDocument", { source: CLS_PATCH });
await s.goto(`${BASE}/`);
check((await s.eval(`return document.documentElement.dataset.island;`)) !== "off", "pre-paint decision is not off");
await waitFor(s, `document.documentElement.dataset.island === "live"`, 30000);
await sleep(1500);
const live = await s.eval(`return {
  canvases: document.querySelectorAll(".island-layer canvas").length,
  canvasOpacity: getComputedStyle(document.querySelector(".island-canvas")).opacity,
  posterOpacity: getComputedStyle(document.querySelector("img.island-poster")).opacity,
  ariaHidden: document.querySelector(".island-layer").getAttribute("aria-hidden"),
  tier: window.__island.stats.tier, dpr: window.__island.stats.dpr, msaa: window.__island.stats.msaa };`);
check(live.canvases === 1 && live.canvasOpacity === "1" && live.posterOpacity === "0" && live.ariaHidden === "true", `live + crossfaded ${JSON.stringify(live)}`);
check(live.tier === "high" && live.dpr === 1 && live.msaa === 4, "desktop 1× screen → high tier, DPR 1, MSAA 4");
const f0 = await s.eval(`return window.__island.stats.frames;`);
await sleep(2000);
const f1 = await s.eval(`return window.__island.stats.frames;`);
check((f1 - f0) / 2 > 30, `rendering at ${((f1 - f0) / 2).toFixed(0)} fps`);
await waitFor(s, `window.__island.stats.introDone === true`, 8000);

async function expectAt(y, p, label) {
  await s.eval(`window.scrollTo(0, ${y}); return true;`);
  const got = await settle(s);
  check(Math.abs(got - p) < 0.01, `${label}: p ${got.toFixed(4)} ≈ ${p}`);
}
await expectAt(await s.eval(`const h = document.querySelector('[data-island-chapter="hero"]'); return h.getBoundingClientRect().top + scrollY + h.offsetHeight;`), 0.14, "hero end");
await expectAt(await chapterStart(s, "ring"), 0.27, "ring stage start");
await expectAt(await chapterStart(s, "stats"), 0.59, "stats stage start");
await expectAt(await s.eval(`return document.querySelector('[data-island-chapter="cta"]').getBoundingClientRect().top + scrollY - document.documentElement.clientHeight;`), 0.906, "CTA entering");
await expectAt(await s.eval(`return document.documentElement.scrollHeight;`), 1, "page bottom");
await expectAt(0, 0, "back to the top");
check((await s.eval("return window.__cls;")) < 0.02, "CLS < 0.02 through load + go-live");
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t6-live.mjs"`. Expected: all `ok`.

Then run `CDP_PORT=9333 node "$S/island/shots.mjs" t6` and look at `cmp-t6-1440-0.png`, `cmp-t6-1440-0.4.png` and `cmp-t6-1440-1.png`. Expected: the right half shows the prototype's sky: violet gradient, stars in the upper sky, cyan horizon band at p 0 and 1, dark violet "deep mode" at 0.4. No geometry yet. The framing (horizon height) should match the left half.

- [ ] **Step 12: Review Focus 2 — long DE copy + late height changes keep the camera in sync (`$S/island/t6-desync.mjs`)**

```js
// RF2 — DE copy on a phone + a late height change (FAQ opened): p at chapter starts stays exact.
import { BASE, chapterStart, check, session, settle, sleep, waitFor } from "./lib.mjs";

const s = await session({ width: 390, height: 844, mobile: true });
await s.goto(`${BASE}/de`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 30000);
async function expectAt(y, p, label) {
  await s.eval(`window.scrollTo(0, ${y}); return true;`);
  const got = await settle(s);
  check(Math.abs(got - p) < 0.01, `${label}: p ${got.toFixed(4)} ≈ ${p}`);
}
await expectAt(await chapterStart(s, "ring"), 0.27, "ring stage start (DE, 390 px)");
await expectAt(await chapterStart(s, "stats"), 0.59, "stats stage start (DE, 390 px)");
const grew = await s.eval(`const before = document.documentElement.scrollHeight; document.querySelectorAll("#faq details").forEach((d) => (d.open = true)); return new Promise((r) => setTimeout(() => r(document.documentElement.scrollHeight - before), 800));`);
check(grew > 200, `FAQ opened: page grew ${grew} px`);
const ctaY = await s.eval(`return document.querySelector('[data-island-chapter="cta"]').getBoundingClientRect().top + scrollY - document.documentElement.clientHeight;`);
await expectAt(ctaY, 0.906, "CTA entering after the FAQ grew (anchors re-measured)");
await expectAt(await chapterStart(s, "stats"), 0.59, "stats start unchanged after the FAQ grew");
const stageTop = await s.eval(`return getComputedStyle(document.querySelector('[data-island-chapter="ring"] .island-stage')).top;`);
check(parseFloat(stageTop) <= 0, `ring stage top ${stageTop} (≤ 0 when the stage is taller than the viewport)`);
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t6-desync.mjs"`. Expected: all `ok`. The mobile emulation reports a coarse pointer, so this also runs the `medium` tier.

- [ ] **Step 13: Review Focus 3 — navigation leaks (`$S/island/t6-dispose.mjs`)**

```js
// RF3 — client navigation home ↔ /maps ×5, plus navigating away mid-load, leaves nothing behind.
import { BASE, LIVE_GL_PATCH, check, session, sleep, waitFor } from "./lib.mjs";

async function windowListeners(s) {
  const { result } = await s.send("Runtime.evaluate", { expression: "window" });
  const { listeners } = await s.send("DOMDebugger.getEventListeners", { objectId: result.objectId });
  const count = {};
  for (const l of listeners) count[l.type] = (count[l.type] ?? 0) + 1;
  return count;
}
async function heapMB(s) {
  await s.send("HeapProfiler.collectGarbage");
  const { usedSize } = await s.send("Runtime.getHeapUsage");
  return usedSize / 1048576;
}
const toMaps = `document.querySelector('footer a[href$="/maps"]').click(); return true;`;
const toHome = `document.querySelector('header a[href="/"]').click(); return true;`;

const s = await session({ width: 1440, height: 900 });
await s.send("Page.addScriptToEvaluateOnNewDocument", { source: LIVE_GL_PATCH });
await s.send("HeapProfiler.enable");

// Baseline: /maps loaded directly, once the motion engine has idle-loaded.
await s.goto(`${BASE}/maps`);
await sleep(4000);
const baseline = await windowListeners(s);

await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 30000);
let heapAfterFirst = 0;
for (let round = 1; round <= 5; round++) {
  await s.eval(`window.__kept = window.__island; return true;`);
  await s.eval(toMaps);
  await waitFor(s, `location.pathname.endsWith("/maps")`, 10000);
  await sleep(1500);
  const f0 = await s.eval(`return window.__kept.stats.frames;`);
  await sleep(700);
  const f1 = await s.eval(`return window.__kept.stats.frames;`);
  const state = await s.eval(`return { gl: window.__liveGl(), layers: document.querySelectorAll(".island-layer, .island-canvas").length, attr: document.documentElement.dataset.island ?? null, handle: "__island" in window };`);
  check(f1 === f0, `round ${round}: render loop stopped (frames ${f0} → ${f1})`);
  check(state.gl === 0 && state.layers === 0 && state.attr === null && !state.handle, `round ${round}: no live context / canvas / html[data-island] / dev handle ${JSON.stringify(state)}`);
  const now = await windowListeners(s);
  const drift = ["pointermove", "resize", "scroll"].filter((type) => (now[type] ?? 0) !== (baseline[type] ?? 0));
  check(drift.length === 0, `round ${round}: window listeners back to baseline ${JSON.stringify({ baseline, now })}`);
  await s.eval(toHome);
  await waitFor(s, `document.documentElement.dataset.island === "live"`, 30000);
  const home = await s.eval(`return { gl: window.__liveGl(), canvases: document.querySelectorAll(".island-canvas").length };`);
  check(home.gl === 1 && home.canvases === 1, `round ${round}: exactly one live context + canvas back on home ${JSON.stringify(home)}`);
  if (round === 1) heapAfterFirst = await heapMB(s);
}
const growth = (await heapMB(s)) - heapAfterFirst;
check(growth < 15, `heap growth over 4 more round trips: ${growth.toFixed(1)} MB (< 15)`);

// Navigating away while the world is still loading (a slow CPU widens the window).
await s.send("Emulation.setCPUThrottlingRate", { rate: 6 });
await s.goto(`${BASE}/`);
await waitFor(s, `["loading", "live"].includes(document.documentElement.dataset.island)`, 40000);
await s.eval(toMaps);
await waitFor(s, `location.pathname.endsWith("/maps")`, 10000);
await s.send("Emulation.setCPUThrottlingRate", { rate: 1 });
await sleep(3000);
const aborted = await s.eval(`return { gl: window.__liveGl(), canvases: document.querySelectorAll(".island-canvas").length };`);
check(aborted.gl === 0 && aborted.canvases === 0, `navigation during load: nothing left ${JSON.stringify(aborted)}`);
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t6-dispose.mjs"`. Expected: all `ok`. If a listener count drifts, find the extra handler's `scriptId`/`lineNumber` in the `DOMDebugger.getEventListeners` result. Only island listeners are in scope; report any other drift rather than "fixing" it.

- [ ] **Step 14: Bundle discipline check** (three must not be in the homepage's initial JS)

Stop the dev server. Create `$S/island/bundle-check.mjs`:
```js
// three.js must live in a lazily loaded chunk, never in /[locale]/page's initial chunks.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = "C:/Users/Kaio/Documents/Claude/Portfolio/.next";
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".js")) files.push(p);
  }
})(join(ROOT, "static/chunks"));
const three = files.filter((f) => readFileSync(f, "utf8").includes("WebGLRenderer"));
let total = 0;
for (const f of three) {
  const kb = gzipSync(readFileSync(f)).length / 1024;
  total += kb;
  console.log("three chunk", f.slice(ROOT.length), kb.toFixed(1), "KB gz");
}
console.log("three total", total.toFixed(1), "KB gz");
const manifest = JSON.parse(readFileSync(join(ROOT, "app-build-manifest.json"), "utf8"));
const initial = manifest.pages["/[locale]/page"] ?? [];
const leaked = initial.filter((c) => readFileSync(join(ROOT, c), "utf8").includes("WebGLRenderer"));
console.log(leaked.length === 0 ? "ok: no three code in the homepage's initial chunks" : "FAIL: three in initial chunks " + leaked.join(", "));
```
Run: `npm run build 2>&1 | grep -E "\[locale\]\s" | head -3 && node "$S/island/bundle-check.mjs"`
Expected: the build succeeds, and `/[locale]` First Load JS is at most **baseline + 6 kB** (the baseline comes from Task 5 Step 1). The script prints `ok: no three code in the homepage's initial chunks`, plus one or more three chunks. Record their total gz size; the budget of ≈ 200 KB gz is checked again in Task 13. Restart `npm run dev` for the next tasks.

---

### Task 7: "Expérience 3D" toggle + fallbacks: reduced motion, no WebGL, slow GPU

**Files:**
- Create: `src/components/three/Toggle3D.tsx`
- Modify: `src/components/sections/Hero.tsx`
- Scratch: `$S/island/t7-matrix.mjs`, `t7-nowebgl.mjs`, `t7-stepdown.mjs`

**Interfaces:**
- Consumes: `islandStore`, `safeStorage`, `writePreference` (Task 3); the IslandJourney lifecycle (Task 6), which reacts to `islandStore.pref` and to the OS reduced-motion `change` event; i18n `b2b.island.toggle|on|off` (Task 5).
- Produces: `Toggle3D({ className?: string })`. This is a real `<button aria-pressed>`. When WebGL2 is unsupported it becomes `invisible` + `disabled`: hidden from sight, keyboard and assistive tech, but keeping its space so the centred hero does not shift. Pressing it writes `kc-island-3d` = `on|off` and sets `islandStore.pref`.

- [ ] **Step 1: Create `src/components/three/Toggle3D.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { islandStore, safeStorage, writePreference } from "@/lib/three/island/store";
import { cn } from "@/lib/utils";

// "Expérience 3D : activée / désactivée" (spec §6). Overrides the default (reduced motion → off) per
// visitor; the choice is stored in localStorage. IslandJourney reacts to the store's `pref`.

interface Toggle3DProps {
  className?: string;
}

const subscribe = islandStore.subscribe;
const getEnabled = () => islandStore.get().status !== "off";
const getUnsupported = () => islandStore.get().unsupported;
const getServerEnabled = () => true;
const getServerUnsupported = () => false;

export function Toggle3D({ className }: Toggle3DProps) {
  const t = useTranslations("b2b.island");
  const enabled = useSyncExternalStore(subscribe, getEnabled, getServerEnabled);
  const unsupported = useSyncExternalStore(subscribe, getUnsupported, getServerUnsupported);

  function onClick() {
    const next = enabled ? "off" : "on";
    writePreference(safeStorage(), next);
    islandStore.set({ pref: next });
  }

  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onClick}
      disabled={unsupported}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-white/10 bg-surface-dark/70 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-accent/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        // No WebGL2: 3D is impossible — hidden (not focusable, not announced) but its space is kept (no layout shift).
        unsupported && "invisible",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("relative h-5 w-9 flex-none rounded-full transition-colors", enabled ? "bg-accent" : "bg-white/15")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-surface-dark transition-transform motion-reduce:transition-none", enabled ? "translate-x-[18px]" : "translate-x-0.5")} />
      </span>
      <span>{t("toggle")}</span>
      {/* Both states share one grid cell: the button never changes width (no layout shift). */}
      <span className="grid">
        <span className={cn("col-start-1 row-start-1", !enabled && "invisible")}>{t("on")}</span>
        <span className={cn("col-start-1 row-start-1", enabled && "invisible")}>{t("off")}</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Put the toggle in the Hero** (`src/components/sections/Hero.tsx`)

Add the import: `import { Toggle3D } from "@/components/three/Toggle3D";`. Then, inside `<Glass …>`, right after the tagline paragraph that ends with `{t("tagline")}\n          </p>`, add:
```tsx
          {over3d && <Toggle3D className="hero-fade-rise mt-6 [--d:780ms]" />}
```

- [ ] **Step 3: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src`. Expected: all green, no output.

- [ ] **Step 4: Screenshot check**

Run `CDP_PORT=9333 node "$S/island/t5-static.mjs"` again (dev server up). Its checks must still be `ok`. Look at `t5-1440-reduce-hero.png` and `t5-390-no-preference-hero.png`. The hero shows the toggle under the tagline, reading "Expérience 3D : désactivée" under reduced motion and "… activée" otherwise, and it does not overflow at 390 px.

- [ ] **Step 5: Review Focus 5 — reduced motion × stored preference × toggle (`$S/island/t7-matrix.mjs`)**

```js
// RF5 — reduced motion × stored preference × toggle; rapid toggling; OS setting change mid-visit; keyboard.
import { BASE, CLS_PATCH, LIVE_GL_PATCH, check, session, sleep, waitFor } from "./lib.mjs";

const TOGGLE = `document.querySelector('[data-island-chapter="hero"] button[aria-pressed]')`;
const state = (s) => s.eval(`const b = ${TOGGLE}; return {
  island: document.documentElement.dataset.island,
  pressed: b ? b.getAttribute("aria-pressed") : null,
  label: b ? b.innerText.replace(/\\s+/g, " ").trim() : null,
  canvases: document.querySelectorAll(".island-canvas").length,
  gl: window.__liveGl(),
  introDone: window.__island ? window.__island.stats.introDone : null,
  cls: window.__cls,
  worldChunk: performance.getEntriesByType("resource").some((e) => /three|island_world/i.test(e.name)) };`);
const setStored = (s, v) => s.eval(`${v === null ? `localStorage.removeItem("kc-island-3d")` : `localStorage.setItem("kc-island-3d", "${v}")`}; return true;`);

const MATRIX = [
  // reduced motion, stored preference, expected html[data-island], expected aria-pressed
  ["reduce", null, "off", "false"],
  ["reduce", "on", "live", "true"],
  ["reduce", "off", "off", "false"],
  ["no-preference", null, "live", "true"],
  ["no-preference", "off", "off", "false"],
  ["no-preference", "on", "live", "true"],
];
for (const [rm, stored, island, pressed] of MATRIX) {
  const label = `${rm} + stored ${stored}`;
  const s = await session({ width: 1440, height: 900, reducedMotion: rm });
  await s.send("Page.addScriptToEvaluateOnNewDocument", { source: LIVE_GL_PATCH + CLS_PATCH });
  await s.goto(`${BASE}/`);
  await setStored(s, stored);
  await s.goto(`${BASE}/`);
  if (island === "live") await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
  else await sleep(4500);
  const st = await state(s);
  check(st.island === island && st.pressed === pressed, `${label}: html[data-island]=${st.island}, aria-pressed=${st.pressed}, "${st.label}"`);
  check(pressed === "true" ? /activ|on/i.test(st.label) && !/désactiv/.test(st.label) : /désactiv/.test(st.label), `${label}: visible label matches the state ("${st.label}")`);
  check(st.canvases === (island === "live" ? 1 : 0) && st.gl === st.canvases, `${label}: ${st.canvases} canvas / ${st.gl} live context`);
  if (island === "off") check(!st.worldChunk, `${label}: the world chunk was never requested`);
  if (rm === "reduce" && island === "live") check(st.introDone === true, `${label}: intro swoop skipped under reduced motion`);
  check(st.cls < 0.02, `${label}: CLS ${st.cls.toFixed(4)} < 0.02 (decided before first paint)`);
  check(s.logs.length === 0, `${label}: no console errors/warnings ${JSON.stringify(s.logs)}`);
  await s.close();
}

// Rapid toggling, persistence, off → poster, OS change mid-visit, keyboard.
const s = await session({ width: 1440, height: 900 });
await s.send("Page.addScriptToEvaluateOnNewDocument", { source: LIVE_GL_PATCH });
await s.goto(`${BASE}/`);
await setStored(s, null);
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
for (let i = 0; i < 4; i++) {
  await s.eval(`${TOGGLE}.click(); return true;`); // off, on, off, on — 100 ms apart
  await sleep(100);
}
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
await sleep(1000);
let st = await state(s);
check(st.canvases === 1 && st.gl === 1 && st.pressed === "true", `rapid toggling ends live with one canvas + one context ${JSON.stringify(st)}`);
check((await s.eval(`return localStorage.getItem("kc-island-3d");`)) === "on", "choice persisted in localStorage");
await s.eval(`${TOGGLE}.click(); return true;`);
await sleep(1500);
st = await state(s);
const fallback = await s.eval(`return { poster: getComputedStyle(document.querySelector("img.island-poster")).opacity, stage: getComputedStyle(document.querySelector('[data-island-chapter="ring"] .island-stage')).position };`);
check(st.island === "off" && st.canvases === 0 && st.gl === 0 && fallback.poster === "1" && fallback.stage === "static", `toggle off → poster, static flow, context released ${JSON.stringify({ ...st, ...fallback })}`);

await setStored(s, null);
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
await s.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await sleep(1500);
st = await state(s);
check(st.island === "off" && st.gl === 0, `OS switched to reduced motion (pref auto) → off ${JSON.stringify(st)}`);
await s.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
st = await state(s);
check(st.canvases === 1 && st.gl === 1, `OS back to no-preference → live again on a fresh canvas ${JSON.stringify(st)}`);

await s.eval(`${TOGGLE}.focus(); return document.activeElement === ${TOGGLE};`).then((ok) => check(ok === true, "toggle is keyboard-focusable"));
await s.key(" ", "Space", 32);
await sleep(1500);
check((await state(s)).pressed === "false", "Space toggles it off");
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t7-matrix.mjs"`. Expected: all `ok`.

- [ ] **Step 6: No-WebGL fallback (`$S/island/t7-nowebgl.mjs`)**

```js
// No WebGL → poster + readable static homepage, toggle hidden, world never loaded, zero console noise.
import { BASE, CLS_PATCH, NO_WEBGL_PATCH, check, session, sleep } from "./lib.mjs";

for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  const s = await session({ width: w, height: h, mobile });
  await s.send("Page.addScriptToEvaluateOnNewDocument", { source: NO_WEBGL_PATCH + CLS_PATCH });
  await s.goto(`${BASE}/`);
  await sleep(5000);
  const r = await s.eval(`return {
    island: document.documentElement.dataset.island,
    canvases: document.querySelectorAll(".island-canvas").length,
    toggle: (() => { const b = document.querySelector('button[aria-pressed]'); return !!b && getComputedStyle(b).visibility === "visible"; })(),
    poster: getComputedStyle(document.querySelector("img.island-poster")).opacity,
    stage: getComputedStyle(document.querySelector('[data-island-chapter="ring"] .island-stage')).position,
    worldChunk: performance.getEntriesByType("resource").some((e) => /three|island_world/i.test(e.name)),
    ringLinks: document.querySelectorAll('[data-island-chapter="ring"] ol a').length,
    cls: window.__cls };`);
  check(r.island === "off" && r.canvases === 0, `${w}px: off, no canvas ${JSON.stringify(r)}`);
  check(!r.toggle, `${w}px: toggle hidden (3D impossible)`);
  check(r.poster === "1" && r.stage === "static" && r.ringLinks === 10, `${w}px: poster + static flow + the 10 ring maps as links`);
  check(!r.worldChunk, `${w}px: world chunk never requested`);
  check(r.cls < 0.02, `${w}px: CLS ${r.cls.toFixed(4)}`);
  check(s.logs.length === 0, `${w}px: no console errors/warnings ${JSON.stringify(s.logs)}`);
  await s.close();
}
```
Run: `CDP_PORT=9333 node "$S/island/t7-nowebgl.mjs"`. Expected: all `ok`.

- [ ] **Step 7: Review Focus 4 — slow GPU / slow frames (`$S/island/t7-stepdown.mjs`)**

The ladder measures one window after the intro, so the throttle goes on as soon as the world is live, before the window completes.
```js
// RF4 — slow frames: the step-down ladder runs, then the poster fallback; the user can force 3D back on.
import { BASE, LIVE_GL_PATCH, check, session, sleep, waitFor } from "./lib.mjs";

const s = await session({ width: 1440, height: 900 });
await s.send("Page.addScriptToEvaluateOnNewDocument", { source: LIVE_GL_PATCH });
await s.goto(`${BASE}/`);
await s.eval(`localStorage.removeItem("kc-island-3d"); return true;`);
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
await s.send("Emulation.setCPUThrottlingRate", { rate: 20 });
const start = await s.eval(`window.__kept = window.__island; return { dpr: window.__kept.stats.dpr, msaa: window.__kept.stats.msaa };`);
let last = start;
const t0 = Date.now();
while (Date.now() - t0 < 120000) {
  last = await s.eval(`return { island: document.documentElement.dataset.island, dpr: window.__kept.stats.dpr, msaa: window.__kept.stats.msaa };`);
  if (last.island === "off") break;
  await sleep(1500);
}
await s.send("Emulation.setCPUThrottlingRate", { rate: 1 });
console.log("start", JSON.stringify(start), "end", JSON.stringify(last));
check(last.island === "off" || last.dpr < start.dpr || last.msaa < start.msaa, "slow frames stepped the render scale down (or fell back to the poster)");
if (last.island === "off") {
  const r = await s.eval(`return { canvases: document.querySelectorAll(".island-canvas").length, gl: window.__liveGl(), poster: getComputedStyle(document.querySelector("img.island-poster")).opacity, pressed: document.querySelector('button[aria-pressed]').getAttribute("aria-pressed") };`);
  check(r.canvases === 0 && r.gl === 0 && r.poster === "1" && r.pressed === "false", `gave up cleanly → poster ${JSON.stringify(r)}`);
  await s.eval(`document.querySelector('button[aria-pressed]').click(); return true;`);
  await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
  check(true, "the visitor forced 3D back on after the give-up");
}
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t7-stepdown.mjs"`. Expected: all `ok`; note the start/end scales in your task notes. Only the sky exists at this point, so frames may be cheap enough that the scale steps without giving up; both outcomes pass. **This script is re-run in Task 11 Step 8 and Task 13**, once the full scene makes the give-up path reachable.

---

### Task 8: The island: terrain, water, vegetation, crystals

This task ports prototype lines 414–826 into five modules and plugs them into `world.ts`. The hero and dive frames then show the island.

**Files:**
- Create: `src/lib/three/island/geometry.ts`, `terrain.ts`, `water.ts`, `vegetation.ts`, `crystals.ts`
- Modify: `src/lib/three/island/world.ts` (imports + `sceneBuilders`)

**Interfaces:**
- Consumes: `SceneContext`, `Unit`, `FrameState` (Task 4); `withRim`, `addPointLight` (Task 6); `fbm`, `fogUniforms`, `GLSL_NOISE` (Task 1); `rngFor`, `mulberry32` (Task 1); `clamp`, `sstep`, `lerp` (Task 1).
- Produces:
  - `geometry.ts`: `blobGeometry(detail?, amp?, seed?, freq?): THREE.BufferGeometry`; `composeMatrix(x, y, z, rx, ry, rz, sx, sy?, sz?): THREE.Matrix4` (shared scratch matrix); `interface GeometryKit { crystalGeometry: THREE.OctahedronGeometry; glowTexture: THREE.CanvasTexture; glowSprite(color: THREE.Color, scale: number, opacity?: number): THREE.Sprite }`; `createGeometryKit(ctx): GeometryKit`.
  - `terrain.ts`: `WATERFALL_PHI = 0.95`; `type TopFn = (x, z, rn, nz: SimplexNoise) => number`; `interface IslandParams`; `interface IslandShape { geometry; Rof(phi); topAt(x, z); nz }`; `segDist(x, z, ax, az, bx, bz): number`; `makeIsland(params: IslandParams): IslandShape`; `interface MainIsland extends Unit { group: THREE.Group; shape: IslandShape; material: THREE.MeshStandardMaterial; pond: {x; z}; waterfall: {x; z}; coreY: number }`; `createMainIsland(ctx): MainIsland`.
  - `water.ts`: `createWater(ctx, island: MainIsland): void`.
  - `vegetation.ts`: `createVegetation(ctx, island: MainIsland): void`.
  - `crystals.ts`: `CYAN`, `VIOLET`, `PINK: THREE.Color`; `crystalMaterial(uTime: THREE.IUniform<number>, intensity?: number): THREE.ShaderMaterial`; `interface Crystals extends Unit { debrisGeometry: THREE.BufferGeometry; debrisMaterial: THREE.MeshStandardMaterial }`; `createCrystals(ctx, island: MainIsland, kit: GeometryKit): Crystals`.

**Required changes from the prototype (spec §5), all applied in the code below:**
- **One RNG per module:** `rngFor("vegetation")` and `rngFor("crystals")` replace the prototype's shared `rng` / `R()`. The layout differs from the prototype but is deterministic. The noise seeds (`mulberry32(seed * 977 + 13)`, `blobGeometry` seeds) are kept.
- **Disposal:** everything in the scene graph is released by `disposeGraph(scene)`. The glow canvas texture and the shared crystal geometry are also registered in `ctx.bag`. The terrain probe geometry is disposed right after use.
- **Point lights:** the core's point light is created with `addPointLight` at the scene root, and `setOn(vis.island)` replaces hiding it with its group.
- **Bounded loops:** trees are already bounded (≤ 600 tries). The flower loop becomes `≤ FLOWERS × 20` tries, and `flowers.count = placed`.
- **No module-level DOM:** the glow canvas is created inside `createGeometryKit`.
- **Idle bobbing × `frame.bob`** (0 under reduced motion): island, satellites, debris y.
- Stripped from the prototype: `REDUCED`, `qs`, the global `W/H`, and `renderer.info` tweaks.

- [ ] **Step 1: Create `geometry.ts`** (prototype 616–626 helpers + the glow texture/sprite from 766–775)

```ts
// src/lib/three/island/geometry.ts
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "./rng";
import type { SceneContext } from "./types";

/** Noise-displaced icosahedron (prototype 617–624). Seeded locally, independent of the module RNGs. */
export function blobGeometry(detail = 1, amp = 0.2, seed = 3, freq = 1.7): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const nz = new SimplexNoise({ random: mulberry32(seed) });
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    v.multiplyScalar(1 + amp * nz.noise3d(v.x * freq, v.y * freq, v.z * freq));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();

/** TRS matrix (prototype 626). Returns a SHARED scratch matrix: use it (setMatrixAt) or .clone() it before the next call. */
export function composeMatrix(x: number, y: number, z: number, rx: number, ry: number, rz: number, sx: number, sy = sx, sz = sx): THREE.Matrix4 {
  return _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

export interface GeometryKit {
  /** Shared octahedron for every crystal (prototype 739). */
  crystalGeometry: THREE.OctahedronGeometry;
  /** Radial glow sprite texture (prototype 766–771). */
  glowTexture: THREE.CanvasTexture;
  glowSprite(color: THREE.Color, scale: number, opacity?: number): THREE.Sprite;
}

export function createGeometryKit({ bag }: SceneContext): GeometryKit {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const g = canvas.getContext("2d");
  if (g) {
    const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.22, "rgba(255,255,255,.5)");
    gradient.addColorStop(0.55, "rgba(255,255,255,.1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, 128, 128);
  }
  const glowTexture = bag.add(new THREE.CanvasTexture(canvas));
  const crystalGeometry = bag.add(new THREE.OctahedronGeometry(1, 0));
  return {
    crystalGeometry,
    glowTexture,
    glowSprite(color, scale, opacity = 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTexture, color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity }),
      );
      sprite.scale.setScalar(scale);
      return sprite;
    },
  };
}
```

- [ ] **Step 2: Create `terrain.ts`** (prototype 414–517; `makeIsland` logic unchanged, POND/WFALL become per-instance)

```ts
// src/lib/three/island/terrain.ts
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { withRim } from "./lights";
import { clamp, sstep } from "./math";
import { fbm } from "./noise";
import { mulberry32 } from "./rng";
import type { SceneContext, Unit } from "./types";

// Procedural floating-island generator + the main island (prototype lines 414–517).

export const WATERFALL_PHI = 0.95;

export type TopFn = (x: number, z: number, rn: number, nz: SimplexNoise) => number;

export interface IslandParams {
  radius?: number;
  depth?: number;
  detail?: number;
  seed?: number;
  outline?: number;
  top: TopFn;
  sandFn?: ((x: number, z: number) => number) | null;
}

export interface IslandShape {
  geometry: THREE.BufferGeometry;
  /** Outline radius at polar angle phi. */
  Rof(phi: number): number;
  /** Top-surface height at (x, z). */
  topAt(x: number, z: number): number;
  nz: SimplexNoise;
}

const col = (hex: string) => new THREE.Color(hex);
const PAL = {
  grass: ["#3fae5e", "#5cc46b", "#86d66a", "#2f9a62", "#39b08a"].map(col),
  lip: col("#2a7d4f"),
  soil: col("#7a4a34"),
  sand: col("#ecd08f"),
  rockA: col("#9a7263"),
  rockB: col("#76597a"),
  rockC: col("#4d3b6c"),
  rockD: col("#2a1f45"),
};

/** Distance from (x, z) to the segment a→b. */
export function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number): number {
  const vx = bx - ax;
  const vz = bz - az;
  const t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
  return Math.hypot(x - (ax + vx * t), z - (az + vz * t));
}

/** Island mesh with flat-shaded vertex colours (prototype 422–490; logic unchanged). */
export function makeIsland({ radius = 11, depth = 10, detail = 24, seed = 1, outline = 0.14, top, sandFn = null }: IslandParams): IslandShape {
  const nz = new SimplexNoise({ random: mulberry32(seed * 977 + 13) });
  const Rof = (phi: number) =>
    radius * (1 + outline * nz.noise(Math.cos(phi) * 1.2 + seed, Math.sin(phi) * 1.2) + outline * 0.4 * nz.noise(Math.cos(phi) * 3.1 + 7, Math.sin(phi) * 3.1 - seed));
  const topAt = (x: number, z: number) => {
    const phi = Math.atan2(z, x);
    const rn = Math.min(1, Math.hypot(x, z) / Rof(phi));
    return top(x, z, rn, nz);
  };
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position;
  const n = pos.count;
  const isTop = new Uint8Array(n);
  const fArr = new Float32Array(n);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const phi = Math.atan2(v.z, v.x);
    const Rp = Rof(phi);
    let x: number;
    let y: number;
    let z: number;
    if (v.y >= -1e-5) {
      const rn = Math.min(1, Math.acos(clamp(v.y, -1, 1)) / (Math.PI / 2));
      const rr = Rp * rn;
      x = Math.cos(phi) * rr;
      z = Math.sin(phi) * rr;
      y = top(x, z, rn, nz);
      isTop[i] = 1;
    } else {
      const s = Math.min(1, Math.acos(clamp(-v.y, -1, 1)) / (Math.PI / 2));
      const f = 1 - s;
      fArr[i] = f;
      const rimY = top(Math.cos(phi) * Rp, Math.sin(phi) * Rp, 1, nz);
      const dpt = depth * (1 + 0.22 * nz.noise(Math.cos(phi) * 1.4 + 11, Math.sin(phi) * 1.4 + 11));
      y = rimY - dpt * Math.pow(f, 1.12) - 0.25 * f;
      let rr = Rp * Math.pow(Math.max(0, 1 - Math.pow(f, 1.7)), 0.82);
      const k = sstep(0.0, 0.07, f);
      rr *=
        1 +
        k *
          (0.065 * Math.sin(y * 2.2 + 2.0 * nz.noise(Math.cos(phi) * 2, Math.sin(phi) * 2)) +
            0.14 * nz.noise(Math.cos(phi) * 2.3 + y * 0.13, Math.sin(phi) * 2.3 - y * 0.17));
      rr *= 1 + 0.05 * Math.exp(-f * f * 900);
      x = Math.cos(phi) * rr;
      z = Math.sin(phi) * rr;
    }
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  const nrm = g.attributes.normal;
  const colors = new Float32Array(n * 3);
  const c = new THREE.Color();
  const hashF = (a: number, b: number) => {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = 0; i < n; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const ny = nrm.getY(i);
    const topFace = isTop[i] && isTop[i + 1] && isTop[i + 2];
    const jit = hashF(cx, cz + cy);
    if (topFace) {
      const gn = clamp(0.5 + 0.9 * fbm(nz, cx * 0.13 + 40, cz * 0.13, 3));
      const idx = gn * (PAL.grass.length - 1);
      c.copy(PAL.grass[Math.floor(idx)]).lerp(PAL.grass[Math.min(PAL.grass.length - 1, Math.floor(idx) + 1)], idx % 1);
      if (ny < 0.72) c.lerp(PAL.lip, sstep(0.72, 0.4, ny) * 0.7);
      const phi = Math.atan2(cz, cx);
      const rn = Math.hypot(cx, cz) / Rof(phi);
      if (rn > 0.9 && ny < 0.55) c.lerp(PAL.soil, 0.45);
      if (sandFn) {
        const sd = sandFn(cx, cz);
        if (sd > 0) c.lerp(PAL.sand, sd);
      }
    } else {
      const f = (fArr[i] + fArr[i + 1] + fArr[i + 2]) / 3;
      if (f < 0.03) c.copy(PAL.lip);
      else if (f < 0.1) c.copy(PAL.soil).lerp(PAL.rockA, sstep(0.05, 0.1, f));
      else {
        const t = sstep(0.1, 0.95, f);
        if (t < 0.33) c.copy(PAL.rockA).lerp(PAL.rockB, t / 0.33);
        else if (t < 0.7) c.copy(PAL.rockB).lerp(PAL.rockC, (t - 0.33) / 0.37);
        else c.copy(PAL.rockC).lerp(PAL.rockD, (t - 0.7) / 0.3);
        const band = Math.sin(cy * 1.7 + 2.5 * nz.noise(cx * 0.2, cz * 0.2));
        if (band > 0.55) c.multiplyScalar(1.18);
        else if (band < -0.7) c.multiplyScalar(0.85);
      }
    }
    c.multiplyScalar(0.93 + jit * 0.14);
    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3] = c.r;
      colors[(i + k) * 3 + 1] = c.g;
      colors[(i + k) * 3 + 2] = c.b;
    }
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { geometry: g, Rof, topAt, nz };
}

export interface MainIsland extends Unit {
  group: THREE.Group;
  shape: IslandShape;
  /** Shared flat-shaded vertex-colour material (satellites and pillar rocks reuse it). */
  material: THREE.MeshStandardMaterial;
  pond: { x: number; z: number };
  waterfall: { x: number; z: number };
  /** y of the glowing core under the island (prototype 777–778). */
  coreY: number;
}

export function createMainIsland({ scene }: SceneContext): MainIsland {
  const material = withRim(
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0.0 }),
    new THREE.Color(0.28, 0.45, 1.0),
    3.2,
    0.28,
  );
  // Pond / waterfall anchors from a low-detail probe of the outline (prototype 510–511).
  const probe = makeIsland({ radius: 11, depth: 10.5, detail: 2, seed: 3, top: () => 0 });
  const rw = probe.Rof(WATERFALL_PHI) * 0.995;
  probe.geometry.dispose();
  const waterfall = { x: Math.cos(WATERFALL_PHI) * rw, z: Math.sin(WATERFALL_PHI) * rw };
  const pond = { x: waterfall.x * 0.52, z: waterfall.z * 0.52 };
  const mainTop: TopFn = (x, z, rn, nz) => {
    let y = 0.7 + 0.9 * fbm(nz, x * 0.085, z * 0.085, 3) + 0.22 * nz.noise(x * 0.42, z * 0.42);
    y += 3.6 * Math.exp(-((x + 4.4) ** 2 + (z + 3.6) ** 2) / 19);
    y += 1.4 * Math.exp(-((x + 1.2) ** 2 + (z - 6.0) ** 2) / 7);
    const dp = Math.hypot(x - pond.x, z - pond.z);
    y -= 1.55 * Math.exp(-(dp * dp) / 4.6);
    const ds = segDist(x, z, pond.x, pond.z, waterfall.x, waterfall.z);
    y -= 0.95 * Math.exp(-(ds * ds) / 0.9) * sstep(1.2, 2.6, dp);
    y -= 2.3 * Math.pow(sstep(0.7, 1.0, rn), 1.6);
    return y;
  };
  const shape = makeIsland({
    radius: 11,
    depth: 10.5,
    detail: 30,
    seed: 3,
    top: mainTop,
    sandFn: (x, z) => {
      const dp = Math.hypot(x - pond.x, z - pond.z);
      return sstep(2.9, 2.1, dp) * sstep(1.2, 1.8, dp) * 0.8;
    },
  });
  const group = new THREE.Group();
  group.add(new THREE.Mesh(shape.geometry, material));
  scene.add(group);
  shape.geometry.computeBoundingBox();
  const coreY = (shape.geometry.boundingBox?.min.y ?? -10) - 0.4;

  return {
    group,
    shape,
    material,
    pond,
    waterfall,
    coreY,
    // Chapter culling + idle bob (prototype 1564, 1571)
    update(frame, vis) {
      group.visible = vis.island;
      if (vis.island) group.position.y = Math.sin(frame.t * 0.45) * 0.18 * frame.bob;
    },
  };
}
```

- [ ] **Step 3: Create `water.ts`** (prototype 519–614; replace each `⟪…⟫` with the prototype text as per Global Constraints)

```ts
// src/lib/three/island/water.ts
import * as THREE from "three";
import { lerp } from "./math";
import { fogUniforms, GLSL_NOISE } from "./noise";
import { WATERFALL_PHI, type MainIsland } from "./terrain";
import type { SceneContext } from "./types";

// Pond, stream ribbon and waterfall (prototype lines 519–614).

const WATER_VS = /* glsl */ `⟪prototype L523–L529⟫`;
const WATER_FS = /* glsl */ `⟪prototype L530–L544⟫`;
const FALL_VS = /* glsl */ `⟪prototype L590–L596⟫`;
const FALL_FS = /* glsl */ `⟪prototype L597–L611⟫`;

function ribbon(verts: number[], uvs: number[], index: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  return g;
}

export function createWater({ uTime }: SceneContext, island: MainIsland): void {
  const { pond, waterfall, shape, group } = island;
  const waterMaterial = new THREE.ShaderMaterial({ transparent: true, fog: true, depthWrite: false, uniforms: fogUniforms({ uTime }), vertexShader: WATER_VS, fragmentShader: WATER_FS });
  const pondLevel = shape.topAt(pond.x, pond.z) + 0.74;
  const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(2.35, 40).rotateX(-Math.PI / 2), waterMaterial);
  pondMesh.position.set(pond.x, pondLevel, pond.z);
  group.add(pondMesh);

  // Stream ribbon following the carved channel down to the rim (prototype 551–568)
  const N = 36;
  const wid = 0.62;
  const dx = waterfall.x - pond.x;
  const dz = waterfall.z - pond.z;
  const L = Math.hypot(dx, dz);
  const px = -dz / L;
  const pz = dx / L;
  const verts: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  let end = new THREE.Vector3();
  for (let k = 0; k <= N; k++) {
    const t = lerp(0.3, 1.0, k / N);
    const x = pond.x + dx * t;
    const z = pond.z + dz * t;
    const y = Math.min(pondLevel, shape.topAt(x, z) + 0.24);
    end = new THREE.Vector3(x, y, z);
    verts.push(x + px * wid, y, z + pz * wid, x - px * wid, y, z - pz * wid);
    uvs.push(0, k / N, 1, k / N);
    if (k < N) {
      const a = k * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  group.add(new THREE.Mesh(ribbon(verts, uvs, index), waterMaterial));

  // Waterfall: ballistic arc from the rim down into the cloud sea (prototype 570–613)
  const dirx = Math.cos(WATERFALL_PHI);
  const dirz = Math.sin(WATERFALL_PHI);
  const M = 60;
  const fv: number[] = [];
  const fu: number[] = [];
  const fi: number[] = [];
  for (let k = 0; k <= M; k++) {
    const s = k / M;
    const out = 0.35 + 3.4 * s;
    const y = end.y - 25 * Math.pow(s, 1.75);
    const w = 0.62 + 1.9 * s;
    const cx = end.x + dirx * out;
    const cz = end.z + dirz * out;
    fv.push(cx + px * w, y, cz + pz * w, cx - px * w, y, cz - pz * w);
    fu.push(0, s, 1, s);
    if (k < M) {
      const a = k * 2;
      fi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const fallMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: fogUniforms({ uTime }),
    vertexShader: FALL_VS,
    fragmentShader: FALL_FS,
  });
  group.add(new THREE.Mesh(ribbon(fv, fu, fi), fallMaterial));
}
```

- [ ] **Step 4: Create `vegetation.ts`** (prototype 628–694)

```ts
// src/lib/three/island/vegetation.ts
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { blobGeometry, composeMatrix } from "./geometry";
import { withRim } from "./lights";
import { rngFor } from "./rng";
import { segDist, type MainIsland } from "./terrain";
import type { SceneContext } from "./types";

// Trees, flowers, boulders on the main island (prototype lines 628–694).

const col = (hex: string) => new THREE.Color(hex);
const LEAF_COLORS = ["#2fa56a", "#3fbf74", "#1f8f63", "#ff79b4", "#ff9fcf", "#c98bff"].map(col);
const PINE_COLORS = ["#1f8a66", "#2a9d74", "#17775c"].map(col);
const FLOWER_COLORS = ["#ffd1ea", "#ff8cc6", "#fff4c2", "#b8f3ff"].map(col);
const FLOWERS = 170;

interface TreeSpot {
  x: number;
  z: number;
  y: number;
  kind: "pine" | "round";
}

export function createVegetation(_ctx: SceneContext, island: MainIsland): void {
  const rng = rngFor("vegetation");
  const R = rng.range;
  const { pond, waterfall, shape, group } = island;
  const avoidWater = (x: number, z: number) => Math.hypot(x - pond.x, z - pond.z) > 3.4 && segDist(x, z, pond.x, pond.z, waterfall.x, waterfall.z) > 1.7;

  const spots: TreeSpot[] = [];
  for (let tries = 0; spots.length < 19 && tries < 600; tries++) {
    const a = R(0, Math.PI * 2);
    const r = Math.sqrt(R(0.02, 1)) * 8.6;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!avoidWater(x, z)) continue;
    if (spots.some((t) => Math.hypot(t.x - x, t.z - z) < 2.1)) continue;
    spots.push({ x, z, y: shape.topAt(x, z), kind: rng.next() < 0.42 ? "pine" : "round" });
  }

  const foliage = withRim(new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8, metalness: 0 }), new THREE.Color(0.45, 0.4, 1.0), 2.6, 0.5);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5e3d34, flatShading: true, roughness: 0.9 });
  const trunkGeometry = new THREE.CylinderGeometry(0.13, 0.24, 1, 5).translate(0, 0.5, 0);
  const canopyGeometry = blobGeometry(1, 0.22, 11);
  const coneParts = [0, 1, 2].map((k) => new THREE.ConeGeometry(1 - k * 0.24, 1.25, 7).translate(0, 0.55 + k * 0.72, 0));
  const pineGeometry = mergeGeometries(coneParts.map((g) => g.toNonIndexed()));
  coneParts.forEach((g) => g.dispose());
  pineGeometry.computeVertexNormals();

  const rounds = spots.filter((t) => t.kind === "round");
  const pines = spots.filter((t) => t.kind === "pine");
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, spots.length);
  const canopies = new THREE.InstancedMesh(canopyGeometry, foliage, rounds.length * 3);
  const pineMesh = new THREE.InstancedMesh(pineGeometry, foliage, pines.length);
  const leaf = new THREE.Color();
  let ti = 0;
  let ci = 0;
  for (const t of rounds) {
    const h = R(0.9, 1.35);
    trunks.setMatrixAt(ti++, composeMatrix(t.x, t.y - 0.2, t.z, R(-0.08, 0.08), 0, R(-0.08, 0.08), 1, h, 1));
    const lc = LEAF_COLORS[Math.floor(R(0, LEAF_COLORS.length))];
    const s = R(0.72, 1.0);
    const blobs: [number, number, number, number][] = [
      [0, h + s * 0.55, 0, s],
      [s * 0.62, h + s * 0.2, R(-0.4, 0.4), s * 0.68],
      [-s * 0.55, h + s * 0.3, R(-0.4, 0.4), s * 0.62],
    ];
    blobs.forEach(([ox, oy, oz, ss], k) => {
      canopies.setMatrixAt(ci, composeMatrix(t.x + ox, t.y - 0.2 + oy, t.z + oz, R(0, 6), R(0, 6), R(0, 6), ss, ss * 0.88, ss));
      canopies.setColorAt(ci++, leaf.copy(lc).multiplyScalar(k ? 0.9 : 1.0));
    });
  }
  pines.forEach((t, k) => {
    const s = R(0.66, 0.92);
    trunks.setMatrixAt(ti++, composeMatrix(t.x, t.y - 0.2, t.z, 0, 0, 0, 0.6, 0.7, 0.6));
    pineMesh.setMatrixAt(k, composeMatrix(t.x, t.y + 0.3, t.z, 0, R(0, 6), 0, s * 1.05, s * 1.45, s * 1.05));
    pineMesh.setColorAt(k, PINE_COLORS[k % PINE_COLORS.length]);
  });
  group.add(trunks, canopies, pineMesh);

  // Flowers — placement loop BOUNDED (the prototype's `while (k < 170)` could spin forever).
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.6, emissive: 0x220a22 }), FLOWERS);
  let placed = 0;
  for (let tries = 0; placed < FLOWERS && tries < FLOWERS * 20; tries++) {
    const a = R(0, Math.PI * 2);
    const r = Math.sqrt(R(0, 1)) * 9.2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!avoidWater(x, z)) continue;
    flowers.setMatrixAt(placed, composeMatrix(x, shape.topAt(x, z) + 0.05, z, 0, 0, 0, R(0.6, 1.2)));
    flowers.setColorAt(placed, FLOWER_COLORS[(placed + 1) % FLOWER_COLORS.length]);
    placed++;
  }
  flowers.count = placed;
  group.add(flowers);

  const boulders = new THREE.InstancedMesh(blobGeometry(0, 0.25, 21), withRim(new THREE.MeshStandardMaterial({ color: 0x8b7a9e, flatShading: true, roughness: 0.9 })), 9);
  for (let i = 0; i < 9; i++) {
    const a = R(0, Math.PI * 2);
    const r = R(3, 9.5);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = R(0.35, 0.9);
    boulders.setMatrixAt(i, composeMatrix(x, shape.topAt(x, z) + s * 0.2, z, R(0, 3), R(0, 3), R(0, 3), s, s * 0.7, s));
  }
  group.add(boulders);
}
```

- [ ] **Step 5: Create `crystals.ts`** (prototype 696–826)

```ts
// src/lib/three/island/crystals.ts
import * as THREE from "three";
import { blobGeometry, composeMatrix, type GeometryKit } from "./geometry";
import { addPointLight, withRim } from "./lights";
import { fbm, fogUniforms } from "./noise";
import { rngFor } from "./rng";
import { makeIsland, type MainIsland } from "./terrain";
import { sstep } from "./math";
import type { SceneContext, Unit } from "./types";

// Crystals (instanced, emissive, flat-shaded via derivatives), glowing core, satellite islands and
// orbiting debris (prototype lines 696–826).

export const CYAN = new THREE.Color(0.05, 0.85, 1.25);
export const VIOLET = new THREE.Color(0.75, 0.22, 1.35);
export const PINK = new THREE.Color(1.2, 0.35, 0.95);

const CRYSTAL_VS = /* glsl */ `⟪prototype L703–L720⟫`;
const CRYSTAL_FS = /* glsl */ `⟪prototype L721–L735⟫`;

export function crystalMaterial(uTime: THREE.IUniform<number>, intensity = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ fog: true, uniforms: fogUniforms({ uTime, uInt: { value: intensity } }), vertexShader: CRYSTAL_VS, fragmentShader: CRYSTAL_FS });
}

export interface Crystals extends Unit {
  /** Shared with the pillars' drifting rocks. */
  debrisGeometry: THREE.BufferGeometry;
  debrisMaterial: THREE.MeshStandardMaterial;
}

interface Debris {
  r: number;
  a: number;
  y: number;
  s: number;
  w: number;
  ph: number;
  rx: number;
  ry: number;
}

export function createCrystals({ scene, uTime }: SceneContext, island: MainIsland, kit: GeometryKit): Crystals {
  const rng = rngFor("crystals");
  const R = rng.range;
  const { shape, group, coreY } = island;
  const up = new THREE.Vector3(0, 1, 0);

  // Clusters on the island top + veins out of the underside (prototype 740–764)
  const spots: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  ([[-6.8, -1.2], [2.8, -6.4], [-2.6, 6.9]] as const).forEach(([cx, cz], ci) => {
    const n = ci === 0 ? 6 : 4;
    for (let k = 0; k < n; k++) {
      const x = cx + R(-0.9, 0.9);
      const z = cz + R(-0.9, 0.9);
      const h = R(0.8, 1.9) * (k === 0 ? 1.4 : 1);
      spots.push({ m: composeMatrix(x, shape.topAt(x, z) + h * 0.55, z, R(-0.35, 0.35), R(0, 3), R(-0.35, 0.35), h * 0.28, h, h * 0.28).clone(), c: ci === 1 ? VIOLET : CYAN });
    }
  });
  for (let k = 0; k < 18; k++) {
    const a = R(0, Math.PI * 2);
    const f = R(0.18, 0.72);
    const Rp = shape.Rof(a) * Math.pow(1 - Math.pow(f, 1.7), 0.82) * 0.92;
    const y = shape.topAt(Math.cos(a) * shape.Rof(a), Math.sin(a) * shape.Rof(a)) - 10.5 * Math.pow(f, 1.12);
    const q = new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(Math.cos(a), -0.6, Math.sin(a)).normalize());
    const s = R(0.4, 1.0);
    spots.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * Rp, y, Math.sin(a) * Rp), q, new THREE.Vector3(s * 0.3, s * 1.2, s * 0.3)), c: rng.next() < 0.5 ? CYAN : VIOLET });
  }
  const crystals = new THREE.InstancedMesh(kit.crystalGeometry, crystalMaterial(uTime, 1.0), spots.length);
  spots.forEach((s, i) => {
    crystals.setMatrixAt(i, s.m);
    crystals.setColorAt(i, s.c);
  });
  group.add(crystals);

  // Glowing core under the island (prototype 776–796) — its point light lives at the scene root.
  const core = new THREE.Group();
  core.position.set(0, coreY, 0);
  const coreCrystals = new THREE.InstancedMesh(kit.crystalGeometry, crystalMaterial(uTime, 1.5), 7);
  coreCrystals.setMatrixAt(0, composeMatrix(0, -1.6, 0, 0, 0.4, 0, 1.2, 3.8, 1.2));
  coreCrystals.setColorAt(0, CYAN);
  for (let k = 1; k < 7; k++) {
    const a = (k / 6) * Math.PI * 2;
    const q = new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(Math.cos(a) * 0.7, -1, Math.sin(a) * 0.7).normalize());
    const s = R(0.5, 0.85);
    coreCrystals.setMatrixAt(k, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * 0.8, 0.2, Math.sin(a) * 0.8), q, new THREE.Vector3(0.32 * s, 1.9 * s, 0.32 * s)));
    coreCrystals.setColorAt(k, k % 2 ? VIOLET : CYAN);
  }
  core.add(coreCrystals, kit.glowSprite(new THREE.Color(0.2, 0.9, 1.6), 13, 0.9), kit.glowSprite(new THREE.Color(0.8, 0.25, 1.4), 26, 0.35));
  group.add(core);
  const coreLight = addPointLight(scene, 0x4fd2ff, 85, 30, 1.7, [0, coreY + 1.5, 0]);

  // Satellite islands for depth (prototype 798–813)
  const smallTop = (x: number, z: number, rn: number, nz: Parameters<typeof fbm>[0]) => 0.35 + 0.5 * fbm(nz, x * 0.25, z * 0.25, 2) - 1.1 * Math.pow(sstep(0.62, 1, rn), 1.5);
  const satellites = ([[-19, -1.5, -7, 2.6, 5], [17.5, 5.5, -13, 2.1, 7], [-12, 8.5, -27, 3.0, 9], [24, -6, 4, 1.6, 12]] as const).map(([x, y, z, r, seed]) => {
    const isl = makeIsland({ radius: r, depth: r * 1.6, detail: 9, seed, top: smallTop, outline: 0.18 });
    const mesh = new THREE.Mesh(isl.geometry, island.material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = R(0, 6);
    const cr = new THREE.InstancedMesh(kit.crystalGeometry, crystalMaterial(uTime, 1.1), 2);
    cr.setMatrixAt(0, composeMatrix(0.2, 0.9, 0.1, 0.2, 0, 0.1, 0.25, 0.9, 0.25));
    cr.setColorAt(0, CYAN);
    cr.setMatrixAt(1, composeMatrix(-0.3, 0.6, 0.35, -0.3, 0, -0.2, 0.18, 0.6, 0.18));
    cr.setColorAt(1, VIOLET);
    mesh.add(cr);
    group.add(mesh);
    return { mesh, y0: y, phase: R(0, 6) };
  });

  // Orbiting debris (prototype 815–826)
  const debrisGeometry = blobGeometry(1, 0.32, 5, 1.3);
  const debrisMaterial = withRim(new THREE.MeshStandardMaterial({ vertexColors: false, flatShading: true, roughness: 0.92 }), new THREE.Color(0.35, 0.4, 1.0), 2.6, 0.45);
  const debrisMesh = new THREE.InstancedMesh(debrisGeometry, debrisMaterial, 46);
  debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const debrisColors = ["#7d6a8e", "#6a5680", "#9b7a6a", "#574870"].map((c) => new THREE.Color(c));
  const debris: Debris[] = [];
  for (let i = 0; i < 46; i++) {
    debris.push({ r: R(13, 28), a: R(0, Math.PI * 2), y: R(-11, 5), s: R(0.16, i < 8 ? 1.0 : 0.55), w: R(0.015, 0.05) * (rng.next() < 0.5 ? 1 : -1), ph: R(0, 6), rx: R(0, 6), ry: R(0, 6) });
    debrisMesh.setColorAt(i, debrisColors[i % debrisColors.length]);
  }
  group.add(debrisMesh);

  return {
    debrisGeometry,
    debrisMaterial,
    // Island life (prototype 1570–1579): core spin, satellite bob, debris orbit.
    update(frame, vis) {
      coreLight.setOn(vis.island);
      if (!vis.island) return;
      const { t, dt, bob } = frame;
      core.rotation.y += dt * 0.25;
      for (const s of satellites) {
        s.mesh.position.y = s.y0 + Math.sin(t * 0.6 + s.phase) * 0.35 * bob;
        s.mesh.rotation.y += dt * 0.03;
      }
      debris.forEach((d, i) => {
        const a = d.a + t * d.w;
        debrisMesh.setMatrixAt(i, composeMatrix(Math.cos(a) * d.r, d.y + Math.sin(t * 0.7 + d.ph) * 0.3 * bob, Math.sin(a) * d.r, d.rx + t * 0.2, d.ry + t * 0.13, 0, d.s));
      });
      debrisMesh.instanceMatrix.needsUpdate = true;
    },
  };
}
```

- [ ] **Step 6: Plug the island into `world.ts`**

Add to the import block:
```ts
import { createCrystals } from "./crystals";
import { createGeometryKit, type GeometryKit } from "./geometry";
import { createMainIsland, type MainIsland } from "./terrain";
import { createVegetation } from "./vegetation";
import { createWater } from "./water";
```
Replace the whole `sceneBuilders` function with:
```ts
/** Scene units in build order; the world yields to the main thread before each entry (short tasks). */
function sceneBuilders(ctx: SceneContext, opts: WorldOptions, units: Unit[]): Array<() => void> {
  let kit!: GeometryKit;
  let island!: MainIsland;
  return [
    () => {
      kit = createGeometryKit(ctx);
      island = createMainIsland(ctx);
      units.push(island);
    },
    () => createWater(ctx, island),
    () => createVegetation(ctx, island),
    () => units.push(createCrystals(ctx, island, kit)),
  ];
}
```

- [ ] **Step 7: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src && grep -rn "⟪" src/lib/three`
Expected: tests, tsc and eslint all green; the grep prints **nothing** (every GLSL body pasted).

- [ ] **Step 8: Render check vs the prototype**

Run (dev server + Chromium up): `CDP_PORT=9333 node "$S/island/shots.mjs" t8 1440 900 0,0.2` and `CDP_PORT=9333 node "$S/island/shots.mjs" t8 390 844 0,0.2`
Expected: `fps` ≥ 55 on desktop at both points; the console list is `[]`. Open `cmp-t8-1440-0.png`, `cmp-t8-1440-0.2.png`, `cmp-t8-390-0.png` and `cmp-t8-390-0.2.png`.

- **p 0:** the floating island at the same size and framing as the prototype (left). Check the grassy top with trees (pink/green round canopies and pines), flowers, pond, stream and waterfall on the front-right edge, rock underside with crystal veins, cyan core glow below, and the 4 satellite islands and debris.
- **p 0.2:** the orbit under the island.

The placement of trees, crystals and debris differs from the prototype because of the per-module RNG. That is expected and correct; colours, lighting, rim light and scale must match. There are no clouds, particles, ring, pillars or portal yet.

- [ ] **Step 9: Regression — lifecycle with real geometry**

Run: `CDP_PORT=9333 node "$S/island/t6-live.mjs" && CDP_PORT=9333 node "$S/island/t6-dispose.mjs"`
Expected: all `ok`. The heap-growth and listener checks now cover the island's geometries, textures and instanced meshes.

---

### Task 9: Clouds (tiered, 4 zones) + particles

**Files:**
- Create: `src/lib/three/island/clouds.ts`, `src/lib/three/island/clouds.test.ts`, `src/lib/three/island/particles.ts`
- Modify: `src/lib/three/island/world.ts` (imports + `sceneBuilders`)
- Scratch: `$S/island/t9-gates.mjs`

**Interfaces:**
- Consumes: `CLOUD_Y`, `PORTAL_POS`, `Visibility` (Task 4); `QualitySettings` (Task 3); `fogUniforms` (Task 1); `rngFor`, `mulberry32`, `Rng` (Task 1); `MainIsland.coreY` (Task 8).
- Produces:
  - `clouds.ts`: `type CloudZone = "sea" | "path" | "background" | "portal"`; `interface CloudPlan { detail; sea; background; portal }`; `cloudPlan(q: Pick<QualitySettings, "cloudDetail" | "cloudCountScale">): CloudPlan`; `createClouds(ctx, coreY: number): Unit`.
  - `particles.ts`: `createParticles(ctx): void`.

**Required changes from the prototype (spec §4–§5), all applied in the code below:**
- **4 zones:** one shared puff geometry and material feed 4 InstancedMeshes: sea (the annulus, prototype 894–900), path (the 8 guaranteed dive/climb clusters, 901), background (903) and portal (905). Each zone gets a computed bounding sphere, +1.5 for the vertex drift, and `frustumCulled = true`. The background zone is gated by `vis.cloudBackground` and the portal zone by `vis.cloudPortal` (Ruling 9).
- **Tiers:** puff detail = `quality.cloudDetail` (5 high / 3 medium); sea, background and portal cluster counts × `cloudCountScale` (−40 % on medium); path clusters are never thinned. Particle counts × `particleScale` (−50 % on medium).
- **RNG:** `rngFor("clouds")` and `rngFor("particles")`; the puff displacement noise keeps `mulberry32(77)`.
- **Bounded loops:** sea ≤ 2000 tries, portal clouds ≤ 200 tries (as in the prototype, now explicit `for` loops).
- **Shared uniforms:** `ctx.uTime` and `ctx.uPixelRatio` replace the global `U_TIME` / `U_PR`.

- [ ] **Step 1: Write the failing test** (`src/lib/three/island/clouds.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { cloudPlan } from "./clouds";
import { settingsFor } from "./quality";

describe("cloudPlan (spec §4: clouds detail and count per tier)", () => {
  it("high tier = prototype: detail 5, 64 sea / 8 background / 11 portal clusters", () => {
    expect(cloudPlan(settingsFor("high", 1))).toEqual({ detail: 5, sea: 64, background: 8, portal: 11 });
  });
  it("medium tier: detail 3 and −40 % clusters (path clusters are never thinned)", () => {
    expect(cloudPlan(settingsFor("medium", 1))).toEqual({ detail: 3, sea: 38, background: 5, portal: 7 });
  });
});
```
Run: `npx vitest run src/lib/three/island/clouds.test.ts`. Expected: FAIL, `Failed to resolve import "./clouds"`.

- [ ] **Step 2: Create `clouds.ts`** (prototype 828–911)

```ts
// src/lib/three/island/clouds.ts
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CLOUD_Y, PORTAL_POS } from "./chapters";
import { fogUniforms } from "./noise";
import type { QualitySettings } from "./quality";
import { mulberry32, rngFor } from "./rng";
import type { SceneContext, Unit } from "./types";

// Instanced cloud puffs (prototype lines 828–911), split into 4 zones so whole zones can be culled:
// sea (annulus under the island), path (the puffs the camera dives / climbs through), background
// (hero depth layers) and portal (cradling the portal). Detail + counts follow the quality tier.

export type CloudZone = "sea" | "path" | "background" | "portal";

export interface CloudPlan {
  detail: number;
  sea: number;
  background: number;
  portal: number;
}

/** Cluster counts per zone. The 8 camera-path clusters are never thinned (the dive/climb veil needs them). */
export function cloudPlan(q: Pick<QualitySettings, "cloudDetail" | "cloudCountScale">): CloudPlan {
  return {
    detail: q.cloudDetail,
    sea: Math.round(64 * q.cloudCountScale),
    background: Math.round(8 * q.cloudCountScale),
    portal: Math.round(11 * q.cloudCountScale),
  };
}

const PATH_CLUSTERS: readonly (readonly [number, number])[] = [
  [15, 6], [11, -3], [18, 12], [2, -44], [-6, -40], [7, -48], [0, -36], [-3, -52],
];

const CLOUD_VERTEX = /* glsl */ `⟪prototype L842–L855⟫`;
const CLOUD_FRAGMENT = /* glsl */ `⟪prototype L856–L875⟫`;

function puffGeometry(detail: number): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const nz = new SimplexNoise({ random: mulberry32(77) });
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.multiplyScalar(1 + 0.11 * nz.noise3d(v.x * 2.1, v.y * 2.1, v.z * 2.1) + 0.05 * nz.noise3d(v.x * 4.7, v.y * 4.7, v.z * 4.7));
    if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.3;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function createClouds({ scene, uTime, quality }: SceneContext, coreY: number): Unit {
  const plan = cloudPlan(quality);
  const rng = rngFor("clouds");
  const R = rng.range;
  const portal = new THREE.Vector3(...PORTAL_POS);
  const material = new THREE.ShaderMaterial({
    fog: true,
    uniforms: fogUniforms({
      uTime,
      uSun: { value: new THREE.Vector3(0.25, 0.5, -0.83).normalize() },
      uLit: { value: new THREE.Color(0.36, 0.17, 0.42) },
      uShade: { value: new THREE.Color(0.075, 0.036, 0.19) },
      uUnder: { value: new THREE.Color(0.035, 0.016, 0.1) },
      uRimC: { value: new THREE.Color(0.08, 0.36, 0.7) },
      uCore: { value: new THREE.Vector3(0, coreY, 0) },
      uPortal: { value: portal },
    }),
    vertexShader: CLOUD_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
  });
  const geometry = puffGeometry(plan.detail);

  const zones: Record<CloudZone, THREE.Matrix4[]> = { sea: [], path: [], background: [], portal: [] };
  const cluster = (zone: CloudZone, cx: number, cy: number, cz: number, size: number, n = 7) => {
    for (let k = 0; k < n; k++) {
      const a = R(0, Math.PI * 2);
      const d = Math.sqrt(R(0, 1)) * size * 1.25;
      const r = size * (k === 0 ? 1.0 : R(0.42, 0.8));
      const x = cx + Math.cos(a) * d * 1.3;
      const z = cz + Math.sin(a) * d;
      const dome = (1 - d / (size * 1.25)) * size * 0.45;
      zones[zone].push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, cy + r * 0.3 + dome, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R(0, 6), 0)),
          new THREE.Vector3(r * R(1.05, 1.35), r * R(0.85, 1.05), r * R(1.0, 1.25)),
        ),
      );
    }
  };

  // sea: annulus around / below the island (bounded: ≤ 2000 tries)
  for (let placed = 0, tries = 0; placed < plan.sea && tries < 2000; tries++) {
    const a = R(0, Math.PI * 2);
    const r = 9 + Math.pow(R(0, 1), 1.35) * 125;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x, z) < 17) continue;
    cluster("sea", x, CLOUD_Y + R(-1.5, 1.2), z, R(3.2, 6.2) * (r > 60 ? 1.5 : 1), 6);
    placed++;
  }
  // path: guaranteed puffs on the camera's dive & climb
  for (const [x, z] of PATH_CLUSTERS) cluster("path", x, CLOUD_Y + R(-0.6, 0.6), z, R(3.6, 4.8), 7);
  // background: high clouds behind the island (hero depth layers)
  for (let i = 0; i < plan.background; i++) {
    const a = R(-2.8, -0.35);
    const r = R(75, 150);
    cluster("background", Math.cos(a) * r, R(-2, 10), Math.sin(a) * r, R(5, 9), 8);
  }
  // portal: clouds cradling the portal (bounded: ≤ 200 tries)
  for (let i = 0, n = 0; n < plan.portal && i < 200; i++) {
    const a = R(0, Math.PI * 2);
    const r = R(15, 40);
    const x = portal.x + Math.cos(a) * r * 1.3;
    const z = portal.z + Math.sin(a) * r * 0.7 - 6;
    if (Math.abs(x) < 16 && z > portal.z - 4) continue;
    cluster("portal", x, portal.y - R(13, 18), z, R(3.5, 6.5), 6);
    n++;
  }

  const meshes = {} as Record<CloudZone, THREE.InstancedMesh>;
  for (const zone of Object.keys(zones) as CloudZone[]) {
    const list = zones[zone];
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    list.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.computeBoundingSphere();
    if (mesh.boundingSphere) mesh.boundingSphere.radius += 1.5; // the vertex shader drifts puffs by ≤ 0.8 / 0.12
    mesh.frustumCulled = true; // whole zone skipped when outside the view
    scene.add(mesh);
    meshes[zone] = mesh;
  }

  return {
    update(_frame, vis) {
      meshes.background.visible = vis.cloudBackground;
      meshes.portal.visible = vis.cloudPortal;
    },
  };
}
```
Run: `npx vitest run src/lib/three/island/clouds.test.ts`. Expected: PASS, 2 tests. Importing three in node works; the test never builds meshes.

- [ ] **Step 3: Create `particles.ts`** (prototype 913–960)

```ts
// src/lib/three/island/particles.ts
import * as THREE from "three";
import { rngFor, type Rng } from "./rng";
import type { SceneContext } from "./types";

// Fireflies around the island + dust drifting along the camera path (prototype lines 913–960).
// Counts scale with the quality tier (medium: −50 %).

const PARTICLE_VS = /* glsl */ `⟪prototype L926–L939⟫`;
const PARTICLE_FS = /* glsl */ `⟪prototype L940–L947⟫`;

interface ParticleStyle {
  size: number;
  hdr: number;
  colA: readonly [number, number, number];
  colB: readonly [number, number, number];
  fog: number;
}

function makeParticles({ uTime, uPixelRatio }: SceneContext, rng: Rng, count: number, spawn: (i: number) => [number, number, number], style: ParticleStyle): THREE.Points {
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set(spawn(i), i * 3);
    seed[i] = rng.next();
    size[i] = style.size * rng.range(0.5, 1.3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime, uPR: uPixelRatio, uHdr: { value: style.hdr }, uA: { value: new THREE.Vector3(...style.colA) }, uB: { value: new THREE.Vector3(...style.colB) }, uFog: { value: style.fog } },
    vertexShader: PARTICLE_VS,
    fragmentShader: PARTICLE_FS,
  });
  const points = new THREE.Points(g, m);
  points.frustumCulled = false;
  return points;
}

export function createParticles(ctx: SceneContext): void {
  const rng = rngFor("particles");
  const R = rng.range;
  const scale = ctx.quality.particleScale;
  const fireflies = makeParticles(ctx, rng, Math.round(420 * scale), () => {
    const a = R(0, Math.PI * 2);
    const r = R(4, 22);
    return [Math.cos(a) * r, R(-8, 9), Math.sin(a) * r];
  }, { size: 3.2, hdr: 2.4, colA: [1.0, 0.78, 0.45], colB: [0.2, 0.85, 1.2], fog: 0.0001 });
  const dust = makeParticles(ctx, rng, Math.round(1500 * scale), (i) => {
    const zone = i % 3;
    if (zone === 0) {
      const a = R(0, Math.PI * 2);
      const r = R(0, 26);
      return [Math.cos(a) * r, R(-48, -30), Math.sin(a) * r];
    }
    if (zone === 1) return [R(-24, 24), R(-56, -30), R(-60, -18)];
    return [R(-30, 30), R(-10, 36), R(-100, -40)];
  }, { size: 2.0, hdr: 1.6, colA: [0.55, 0.45, 1.2], colB: [0.2, 0.9, 1.2], fog: 0.00025 });
  ctx.scene.add(fireflies, dust);
}
```

- [ ] **Step 4: Plug them into `world.ts`**

Add to the import block:
```ts
import { createClouds } from "./clouds";
import { createParticles } from "./particles";
```
Replace `sceneBuilders` with:
```ts
/** Scene units in build order; the world yields to the main thread before each entry (short tasks). */
function sceneBuilders(ctx: SceneContext, opts: WorldOptions, units: Unit[]): Array<() => void> {
  let kit!: GeometryKit;
  let island!: MainIsland;
  return [
    () => {
      kit = createGeometryKit(ctx);
      island = createMainIsland(ctx);
      units.push(island);
    },
    () => createWater(ctx, island),
    () => createVegetation(ctx, island),
    () => units.push(createCrystals(ctx, island, kit)),
    () => units.push(createClouds(ctx, island.coreY)),
    () => createParticles(ctx),
  ];
}
```

- [ ] **Step 5: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src && grep -rn "⟪" src/lib/three`
Expected: all green; the grep prints nothing.

- [ ] **Step 6: Render check, both tiers**

Run: `CDP_PORT=9333 node "$S/island/shots.mjs" t9 1440 900 0,0.2,0.24,0.87` then `CDP_PORT=9333 node "$S/island/shots.mjs" t9 390 844 0,0.24,0.87`
Expected:
- The desktop output lines say `tier=high` with fps ≥ 55. The mobile lines say `tier=medium` (coarse pointer) and fps is recorded.
- Screenshots:
  - `cmp-t9-1440-0.png`: the violet cloud sea under the island, and high background clouds behind it, as in the prototype.
  - `port-t9-1440-0.24.png`: the camera inside the cloud layer, with the pink-violet veil.
  - `cmp-t9-1440-0.87.png`: climbing through the clouds toward the (not yet built) portal glow.
  - Fireflies around the island and dust along the path are visible as soft points.
  - The medium-tier mobile frames look the same, only sparser and lower-poly.

- [ ] **Step 7: Culling gates must not pop (`$S/island/t9-gates.mjs`)**

```js
// Culling gates must be invisible: crossing a gate changes no more pixels than an equal step just before it.
// Usage: node t9-gates.mjs gates=0.25,0.55,0.8    |    node t9-gates.mjs sweep=0.24,0.27
import { BASE, DIR, check, hideUi, popRatio, session, sleep, waitFor } from "./lib.mjs";

const arg = process.argv[2] ?? "gates=0.25,0.55,0.8";
const s = await session({ width: 1440, height: 900 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
await hideUi(s);
async function frameAt(p, file) {
  await s.eval(`window.scrollTo(0, window.__island.scrollFor(${p})); return true;`);
  await waitFor(s, `Math.abs(window.__island.stats.p - ${p}) < 0.0003`, 20000);
  await sleep(300);
  await s.shot(file);
  return file;
}
if (arg.startsWith("gates=")) {
  for (const g of arg.slice(6).split(",").map(Number)) {
    const a = await frameAt(g - 0.0045, `${DIR}/gate-${g}-a.png`);
    const b = await frameAt(g - 0.0015, `${DIR}/gate-${g}-b.png`);
    const c = await frameAt(g + 0.0015, `${DIR}/gate-${g}-c.png`);
    const control = await popRatio(a, b);
    const crossing = await popRatio(b, c);
    check(crossing < control + 0.005, `gate ${g}: crossing changes ${(crossing * 100).toFixed(2)} % vs control ${(control * 100).toFixed(2)} % — no pop`);
  }
} else {
  const [from, to] = arg.slice(6).split(",").map(Number);
  const ratios = [];
  let previous = await frameAt(from, `${DIR}/sweep-0.png`);
  for (let i = 1; from + i * 0.003 <= to + 1e-9; i++) {
    const current = await frameAt(from + i * 0.003, `${DIR}/sweep-${i}.png`);
    ratios.push(await popRatio(previous, current));
    previous = current;
  }
  const sorted = [...ratios].sort((x, y) => x - y);
  const median = sorted[Math.floor(sorted.length / 2)];
  const worst = Math.max(...ratios);
  check(worst < median + 0.005, `sweep ${from} → ${to}: worst step ${(worst * 100).toFixed(2)} % vs median ${(median * 100).toFixed(2)} % — no pop`);
}
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t9-gates.mjs" gates=0.25,0.55,0.8`
Expected: all `ok`. If a gate pops, widen that zone's range in `visibilityAt` (`chapters.ts`), update the matching `chapters.test.ts` case first (RED → GREEN), re-run, and record the new range for the spec notes.

---

### Task 10: Map ring + `MapFocusCard`

**Files:**
- Create: `src/lib/three/island/mapRing.ts`, `src/components/three/MapFocusCard.tsx`
- Modify: `src/lib/three/island/world.ts` (imports + `sceneBuilders`), `src/components/sections/Realisations.tsx`
- Scratch: `$S/island/t10-ring.mjs`, `$S/island/t10-keys.mjs`, `$S/island/t10-resize.mjs`

**Interfaces:**
- Consumes: `RING_CENTER`, `RING_RADIUS` (Task 4); `addPointLight` (Task 6); `fogUniforms`, `GLSL_FOG_ADD` (Task 1); `DisposeBag` (Task 4); `RingMapInfo`, `SceneContext`, `Unit` (Task 4); `islandStore` (Task 3), with `focus` written by IslandJourney from `onFocusChange` (Task 6).
- Produces:
  - `mapRing.ts`: `interface MapRingOptions { maps: readonly RingMapInfo[]; minutesUnit: string; onFocusChange(index: number): void }`; `createMapRing(ctx, o: MapRingOptions): Unit`.
  - `MapFocusCard({ maps: RingMapInfo[]; minutesUnit: string })`. It renders only while `status === "live"`: root `div[data-island-focus]` with an `h3 > a[href="/maps/<id>"]`.

**Required changes from the prototype (spec §4–§5), all applied in the code below:**
- **Screens come from `maps` (RING_MAPS, i.e. maps.json):** the thumbnail is `m.thumbnail` (`/images/maps/<id>.jpg`, not the prototype's `/public/...`). The label reads `creator · minutes UNIT · tag`, with the unit localised (`b2b.realisations.units.minutes`).
- **Thumbnails** load in the background (no LoadingManager, no 9 s gate), and in-flight loads are aborted through `bag.defer`. A missing image leaves the screen dark and logs nothing.
- **Label fonts** are read from `--font-orbitron` / `--font-inter` (the real next/font families) and loaded with `document.fonts.load` before drawing.
- **The ring point light** lives at the root (`addPointLight`) and follows `vis.ring`.
- **Focus callback:** `onFocusChange(best)` fires only when the best-aligned screen changes and its score is > 0.3 (it replaces the prototype's `setHud`). The HUD DOM is gone; MapFocusCard renders it in HTML.
- **Screen bob × `frame.bob`.**

- [ ] **Step 1: Create `mapRing.ts`** (prototype 962–1135)

```ts
// src/lib/three/island/mapRing.ts
import * as THREE from "three";
import { RING_CENTER, RING_RADIUS } from "./chapters";
import type { DisposeBag } from "./dispose";
import { addPointLight } from "./lights";
import { damp, DEG, sstep } from "./math";
import { fogUniforms, GLSL_FOG_ADD } from "./noise";
import type { RingMapInfo, SceneContext, Unit } from "./types";

// Chapter 2 — ring of map screens (prototype lines 962–1135). Screens come from maps.json (via
// RingMapInfo), labels use the real next/font families, the focused screen is reported to the host.

const SCR_W = 6.4;
const SCR_H = 3.6;

// GLSL bodies: ⟪prototype Lx–Ly⟫ = paste that prototype template literal verbatim (see Global Constraints).
const GLSL_SDF = `float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }`;
const FACE_VS = /* glsl */ `⟪prototype L983–L989⟫`;
const FACE_FS = /* glsl */ `⟪prototype L1037–L1055⟫`;
const HALO_FS = /* glsl */ `⟪prototype L1062–L1081⟫`;
const TRACK_FS = /* glsl */ `⟪prototype L1096–L1107⟫`;
const FLOOR_FS = /* glsl */ `⟪prototype L1116–L1131⟫`;

interface Screen {
  group: THREE.Group;
  face: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  halo: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  label: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  base: THREE.Vector3;
  focus: number;
}

export interface MapRingOptions {
  maps: readonly RingMapInfo[];
  minutesUnit: string;
  onFocusChange(index: number): void;
}

interface LabelFonts {
  heading: string;
  body: string;
}

function cssFontFamily(variable: "--font-orbitron" | "--font-inter"): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || "sans-serif";
}

function labelTexture(m: RingMapInfo, index: number, minutesUnit: string, fonts: LabelFonts): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 154;
  const g = c.getContext("2d");
  if (g) {
    g.textBaseline = "alphabetic";
    g.font = `700 30px ${fonts.heading}`;
    g.fillStyle = "#00D4FF";
    g.fillText(String(index + 1).padStart(2, "0"), 6, 52);
    g.fillStyle = "rgba(255,255,255,.25)";
    g.fillRect(70, 40, 60, 2);
    g.font = `800 46px ${fonts.heading}`;
    g.fillStyle = "#F5F2FF";
    g.fillText(m.title, 150, 56);
    g.font = `600 26px ${fonts.body}`;
    g.fillStyle = "rgba(214,204,255,.72)";
    g.fillText(`${m.creator}   ·   ${m.minutes} ${minutesUnit.toUpperCase()}   ·   ${m.tag}`, 150, 112);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Map thumbnail drawn into a 1024×576 canvas (prototype 1012–1025). Never blocks the first frame. */
function loadThumbnail(url: string, anisotropy: number, bag: DisposeBag): THREE.Texture {
  const texture = new THREE.Texture();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    if (bag.disposed) return;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 576;
    c.getContext("2d")?.drawImage(img, 0, 0, 1024, 576);
    texture.image = c;
    texture.needsUpdate = true;
  };
  img.onerror = () => undefined; // missing thumbnail → the screen stays dark; never break the scene
  img.src = url;
  bag.defer(() => {
    img.onload = null;
    img.onerror = null;
    img.removeAttribute("src"); // abort the download
  });
  return texture;
}

export function createMapRing({ scene, renderer, bag, uTime }: SceneContext, o: MapRingOptions): Unit {
  const group = new THREE.Group();
  scene.add(group);
  const center = new THREE.Vector3(...RING_CENTER);
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const bodyGeometry = (() => {
    const w = SCR_W + 0.3;
    const h = SCR_H + 0.3;
    const r = 0.34;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 6 }).translate(0, 0, -0.2);
  })();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x14101f, metalness: 0.75, roughness: 0.3, envMapIntensity: 1.4 });
  const faceGeometry = new THREE.PlaneGeometry(SCR_W, SCR_H);
  const haloGeometry = new THREE.PlaneGeometry(SCR_W + 3.2, SCR_H + 3.2);
  const labelGeometry = new THREE.PlaneGeometry(SCR_W * 0.9, SCR_W * 0.9 * 0.15);

  const screens: Screen[] = o.maps.map((m, i) => {
    const ang = (70 + i * 30) * DEG;
    const base = new THREE.Vector3(center.x + Math.cos(ang) * RING_RADIUS, center.y + Math.sin(i * 1.3) * 0.5, center.z + Math.sin(ang) * RING_RADIUS);
    const g = new THREE.Group();
    g.position.copy(base);
    const face = new THREE.Mesh(
      faceGeometry,
      new THREE.ShaderMaterial({
        fog: true,
        uniforms: fogUniforms({ uMap: { value: loadThumbnail(m.thumbnail, anisotropy, bag) }, uFocus: { value: 0 }, uTime, uSeed: { value: i * 0.137 } }),
        vertexShader: FACE_VS,
        fragmentShader: FACE_FS,
      }),
    );
    face.position.z = -0.035;
    const halo = new THREE.Mesh(
      haloGeometry,
      new THREE.ShaderMaterial({
        fog: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: fogUniforms({ uFocus: { value: 0 }, uTime, uSeed: { value: i * 0.7 } }),
        vertexShader: FACE_VS,
        fragmentShader: HALO_FS,
      }),
    );
    halo.position.z = -0.02;
    const label = new THREE.Mesh(labelGeometry, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
    label.position.set(-0.3, SCR_H / 2 + 0.85, 0);
    g.add(new THREE.Mesh(bodyGeometry, bodyMaterial), face, halo, label);
    group.add(g);
    return { group: g, face, halo, label, base, focus: 0 };
  });

  // Ring structure: glowing tracks + floor diagram (prototype 1092–1133)
  const trackMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, uniforms: fogUniforms({ uTime }), vertexShader: FACE_VS, fragmentShader: TRACK_FS });
  for (const [radius, tube, radial] of [[RING_RADIUS, 0.045, 6], [RING_RADIUS + 1.3, 0.02, 4]] as const) {
    const track = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, radial, 240), trackMaterial);
    track.rotation.x = Math.PI / 2;
    track.position.copy(center).y -= 3.3;
    group.add(track);
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 56).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true, uniforms: fogUniforms({ uTime }), vertexShader: FACE_VS, fragmentShader: FLOOR_FS }),
  );
  floor.position.copy(center).y -= 4.6;
  group.add(floor);
  const light = addPointLight(scene, 0x8a4dff, 60, 40, 1.6, RING_CENTER);

  // Labels need the real next/font families; drawn once they are loaded (never blocks the first frame).
  const fonts: LabelFonts = { heading: cssFontFamily("--font-orbitron"), body: cssFontFamily("--font-inter") };
  void Promise.all([
    document.fonts.load(`800 46px ${fonts.heading}`),
    document.fonts.load(`700 30px ${fonts.heading}`),
    document.fonts.load(`600 26px ${fonts.body}`),
  ])
    .catch(() => undefined)
    .then(() => {
      if (bag.disposed) return;
      screens.forEach((s, i) => {
        s.label.material.map = labelTexture(o.maps[i], i, o.minutesUnit, fonts);
        s.label.material.opacity = 0.95;
        s.label.material.needsUpdate = true;
      });
    });

  const forward = new THREE.Vector3();
  const toScreen = new THREE.Vector3();
  const dummy = new THREE.Object3D();
  const facing = new THREE.Quaternion();
  let lastFocus = -1;

  return {
    // Bob, turn toward the camera, focus the screen in view (prototype 1581–1604)
    update(frame, vis) {
      light.setOn(vis.ring);
      group.visible = vis.ring;
      if (!vis.ring) return;
      const { camera, t, dt, bob } = frame;
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      let best = -1;
      let bestF = 0;
      screens.forEach((s, i) => {
        s.group.position.set(s.base.x, s.base.y + Math.sin(t * 0.8 + i) * 0.22 * bob, s.base.z);
        dummy.position.copy(s.group.position);
        dummy.lookAt(center.x, s.group.position.y, center.z);
        facing.copy(dummy.quaternion);
        dummy.lookAt(camera.position);
        facing.slerp(dummy.quaternion, 0.5);
        s.group.quaternion.copy(facing);
        toScreen.copy(s.group.position).sub(camera.position);
        const dist = toScreen.length();
        const align = toScreen.normalize().dot(forward);
        const f = sstep(0.86, 0.985, align) * sstep(26, 12, dist);
        s.focus = damp(s.focus, f, 5, dt);
        s.face.material.uniforms.uFocus.value = s.focus;
        s.halo.material.uniforms.uFocus.value = s.focus;
        s.group.scale.setScalar(1 + s.focus * 0.07);
        if (s.label.material.map) s.label.material.opacity = 0.1 + 0.9 * s.focus;
        if (f > bestF) {
          bestF = f;
          best = i;
        }
      });
      if (best >= 0 && bestF > 0.3 && best !== lastFocus) {
        lastFocus = best;
        o.onFocusChange(best);
      }
    },
  };
}
```

- [ ] **Step 2: Create `src/components/three/MapFocusCard.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/routing";
import { islandStore } from "@/lib/three/island/store";
import type { RingMapInfo } from "@/lib/three/island/types";

// HTML card for the ring screen the camera faces (spec §3.1). Only rendered while the 3D is live;
// the ring chapter's HTML list carries the same maps for everyone else.

interface MapFocusCardProps {
  maps: RingMapInfo[];
  minutesUnit: string;
}

const subscribe = islandStore.subscribe;
const getFocus = () => islandStore.get().focus;
const getLive = () => islandStore.get().status === "live";
const getServerFocus = () => 0;
const getServerLive = () => false;

export function MapFocusCard({ maps, minutesUnit }: MapFocusCardProps) {
  const focus = useSyncExternalStore(subscribe, getFocus, getServerFocus);
  const live = useSyncExternalStore(subscribe, getLive, getServerLive);
  const map = maps[focus];
  if (!live || !map) return null;
  return (
    <div data-island-focus className="island-glass relative w-full max-w-sm shrink-0 lg:text-right">
      <p aria-hidden="true" className="font-heading text-4xl font-extrabold leading-none text-white md:text-5xl">
        {String(focus + 1).padStart(2, "0")}
        <small className="ml-1.5 text-base font-semibold tracking-[0.14em] text-slate-400">/{maps.length}</small>
      </p>
      <div key={map.id} className="island-swap">
        <h3 className="mt-3 font-heading text-sm font-bold uppercase tracking-[0.08em] text-white md:text-base">
          <Link
            href={`/maps/${map.id}` as `/maps/${string}`}
            className="after:absolute after:inset-0 after:rounded-[1.25rem] hover:text-accent focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
          >
            {map.title}
            <span aria-hidden="true"> ↗</span>
          </Link>
        </h3>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {map.creator} · {map.minutes} {minutesUnit}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Render the card in the ring chapter** (`src/components/sections/Realisations.tsx`)

Add the import `import { MapFocusCard } from "@/components/three/MapFocusCard";`. In the over3d branch, right after the closing `</Glass>` (the list panel), add:
```tsx
          <MapFocusCard maps={RING_MAPS} minutesUnit={minutesUnit} />
```
It sits in the stage's flex row: bottom-right on desktop, below the panel on mobile. It renders nothing until the 3D is live, and it is in normal flow, so the pinned stage grows instead of overlapping.

- [ ] **Step 4: Plug the ring into `world.ts`**

Add to the import block: `import { createMapRing } from "./mapRing";`. Then add this entry at the end of the `sceneBuilders` array (after `() => createParticles(ctx),`):
```ts
    () => units.push(createMapRing(ctx, { maps: opts.maps, minutesUnit: opts.minutesUnit, onFocusChange: opts.onFocusChange })),
```

- [ ] **Step 5: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src && grep -rn "⟪" src/lib/three`
Expected: all green; the grep prints nothing.

- [ ] **Step 6: Render check**

Run: `CDP_PORT=9333 node "$S/island/shots.mjs" t10 1440 900 0.3,0.4,0.5` and `CDP_PORT=9333 node "$S/island/shots.mjs" t10 390 844 0.4`
Expected: fps ≥ 55 on desktop. Open `cmp-t10-1440-0.4.png` and compare it with the prototype. The screens float on the ring with real map thumbnails, the focused screen is brighter and scaled, and the halo line is animated. Its label is drawn in **Orbitron** (the square geometric face, not a fallback sans); zoom with the Read tool if needed. The glowing tracks and floor diagram sit under the ring. On mobile the camera pulls back (portrait framing) and the screens remain legible.

- [ ] **Step 7: Ring chapter e2e (`$S/island/t10-ring.mjs`)**

```js
// Ring chapter: the focus card follows the camera through the 10 screens in ring order; its link is real.
import { BASE, check, seek, session, sleep, waitFor } from "./lib.mjs";

const RING_ORDER = ["clutch-realistics-1v2", "martoz-1v1-build-fights", "martoz-turtle-fights-ffa", "pro-endgame-cup-duo", "clutch-realistics-2v3", "boxfight-2v2-ranked", "carlife-tycoon", "the-box", "senses-rush", "rift-racers-alpine"];
const s = await session({ width: 1440, height: 900 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
check((await s.eval(`return !!document.querySelector("[data-island-focus]");`)) === true, "card mounted once live");
const seen = [];
for (let i = 0; i <= 12; i++) {
  await seek(s, 0.28 + i * 0.0225);
  await sleep(900);
  const r = await s.eval(`const a = document.querySelector("[data-island-focus] a"); if (!a) return null; const b = a.closest("[data-island-focus]").getBoundingClientRect(); return { href: a.getAttribute("href"), onScreen: b.top >= 0 && b.bottom <= innerHeight + 1 };`);
  if (r) seen.push(r);
}
const ids = [...new Set(seen.map((r) => r.href.split("/").pop()))];
const order = ids.map((id) => RING_ORDER.indexOf(id));
check(ids.length >= 8 && order.every((v) => v >= 0), `focus walked through ${ids.length} ring maps: ${ids.join(", ")}`);
check(order.every((v, i) => i === 0 || v > order[i - 1]), "focus follows the ring order");
check(seen.every((r) => r.onScreen), "card always on screen while the stage is pinned");
const status = await s.eval(`return fetch(document.querySelector("[data-island-focus] a").href).then((r) => r.status);`);
check(status === 200, `card link opens a real map page (HTTP ${status})`);
const focusable = await s.eval(`const a = document.querySelector("[data-island-focus] a"); a.focus(); return document.activeElement === a;`);
check(focusable === true, "card link is keyboard-focusable");
check((await s.eval(`return document.querySelectorAll('[data-island-chapter="ring"] ol a').length;`)) === 10, "HTML list still carries all 10 maps");
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t10-ring.mjs"`. Expected: all `ok`.

- [ ] **Step 8: Keyboard path through the pinned ring chapter (`$S/island/t10-keys.mjs`)**

```js
// Keyboard: 10 list links → "Voir toutes les réalisations" → focus card link, all visible inside the pinned stage.
import { BASE, check, seek, session, sleep, waitFor } from "./lib.mjs";

for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  const s = await session({ width: w, height: h, mobile });
  await s.goto(`${BASE}/`);
  await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
  await seek(s, 0.4);
  await s.eval(`document.querySelector('[data-island-chapter="ring"] ol a').focus(); return true;`);
  const path = [];
  for (let i = 0; i < 12; i++) {
    path.push(await s.eval(`const a = document.activeElement; const b = a.getBoundingClientRect(); return { href: a.getAttribute("href"), inRing: !!a.closest('[data-island-chapter="ring"]'), onScreen: b.top >= 0 && b.bottom <= innerHeight };`));
    await s.key("Tab", "Tab", 9);
    await sleep(250);
  }
  check(path.every((r) => r.inRing), `${w}px: 12 focus stops inside the ring chapter`);
  check(path.slice(0, 10).every((r) => /\/maps\//.test(r.href ?? "")) && /\/realisations$/.test(path[10].href ?? "") && /\/maps\//.test(path[11].href ?? ""), `${w}px: order = 10 maps, all réalisations, card ${JSON.stringify(path.map((r) => r.href))}`);
  check(path.every((r) => r.onScreen), `${w}px: every focused element is inside the viewport`);
  check(s.logs.length === 0, `${w}px: no console errors/warnings ${JSON.stringify(s.logs)}`);
  await s.close();
}
```
Run: `CDP_PORT=9333 node "$S/island/t10-keys.mjs"`. Expected: all `ok`. If a stop is off-screen on mobile, the stage is taller than the viewport and pins by its bottom, so the list's top links can be hidden while pinned. In that case, make the list a 2-column grid from 360 px (`grid-cols-2` instead of `sm:grid-cols-2` in the Realisations `<ol>`) to shorten the stage, and re-run.

- [ ] **Step 9: Review Focus 1 — resize / orientation while pinned in the ring (`$S/island/t10-resize.mjs`)**

```js
// RF1 — resize / orientation while pinned in the ring chapter: canvas, camera, anchors, stage and card follow.
import { BASE, DIR, check, seek, session, settle, sleep, waitFor } from "./lib.mjs";

const s = await session({ width: 1440, height: 900 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
await seek(s, 0.41);

const PROGRESS_AT = `(() => { const A = window.__island.anchors, y = scrollY; if (y <= A[0].y) return A[0].p; for (let i = 1; i < A.length; i++) if (y < A[i].y) return A[i - 1].p + ((y - A[i - 1].y) / (A[i].y - A[i - 1].y)) * (A[i].p - A[i - 1].p); return A[A.length - 1].p; })()`;

async function resizeTo(label, width, height, mobile) {
  await s.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  await sleep(1200);
  const p = await settle(s);
  const expected = await s.eval(`return ${PROGRESS_AT};`);
  check(Math.abs(p - expected) < 0.01, `${label}: camera follows the re-measured anchors (p ${p.toFixed(4)} vs ${expected.toFixed(4)})`);
  await seek(s, 0.41); // back into the ring chapter at this size
  await sleep(900);
  const r = await s.eval(`const c = document.querySelector(".island-canvas"); const card = document.querySelector("[data-island-focus]"); const b = card && card.getBoundingClientRect();
    return { cw: c.clientWidth, ch: c.clientHeight, bw: c.width, bh: c.height, dpr: window.__island.stats.dpr, vw: innerWidth, vh: innerHeight,
      card: !!card && b.top >= 0 && b.bottom <= innerHeight + 1, href: card ? card.querySelector("a").getAttribute("href") : null,
      hscroll: document.documentElement.scrollWidth > innerWidth,
      stageTop: parseFloat(getComputedStyle(document.querySelector('[data-island-chapter="ring"] .island-stage')).top) };`);
  check(r.cw === r.vw && r.ch === r.vh && Math.abs(r.bw - Math.round(r.vw * r.dpr)) <= 1 && Math.abs(r.bh - Math.round(r.vh * r.dpr)) <= 1, `${label}: canvas + drawing buffer follow the viewport ${JSON.stringify(r)}`);
  check(r.card && /\/maps\/[\w-]+$/.test(r.href ?? ""), `${label}: focus card on screen with a map link (${r.href})`);
  check(!r.hscroll && r.stageTop <= 0, `${label}: no horizontal scroll, stage top ${r.stageTop}px`);
  await s.shot(`${DIR}/t10-resize-${width}x${height}.png`);
}
await resizeTo("desktop 1440×900", 1440, 900, false);
await resizeTo("rotated to portrait 900×1440", 900, 1440, false);
await resizeTo("back to 1440×900", 1440, 900, false);
await resizeTo("phone 390×844", 390, 844, true);
await resizeTo("phone landscape 844×390 (stage taller than the viewport)", 844, 390, true);
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/t10-resize.mjs"`. Expected: all `ok`. Open the 5 `t10-resize-*.png` files: no stretched frame, no letterboxing, and the card is visible. In 844×390 the stage is pinned by its bottom, so the card is at the bottom edge.

---

### Task 11: Stat pillars + portal (count-up, portal charge, deep link, every culling gate)

**Files:**
- Create: `src/lib/three/island/pillars.ts`, `src/lib/three/island/portal.ts`
- Modify: `src/lib/three/island/world.ts` (imports + final `sceneBuilders`)
- Scratch: `$S/island/t11-stats-portal.mjs`

**Interfaces:**
- Consumes: `pillarReveal`, `portalCharge`, `STAT_*`, `PORTAL_POS` (Task 4); `crystalMaterial`, `CYAN`, `VIOLET`, `PINK`, `Crystals.debrisGeometry/debrisMaterial` (Task 8); `makeIsland`, `MainIsland.material` (Task 8); `GeometryKit`, `blobGeometry`, `composeMatrix` (Task 8); `addPointLight`, `withRim` (Task 6); the IslandJourney stats binding (Task 6: `onStatsReveal` → `countUpText` into `[data-island-stat]`).
- Produces:
  - `pillars.ts`: `interface PillarDeps { kit: GeometryKit; islandMaterial: THREE.MeshStandardMaterial; debrisGeometry: THREE.BufferGeometry; debrisMaterial: THREE.MeshStandardMaterial }`; `createPillars(ctx, deps: PillarDeps, onStatsReveal: (reveal: readonly number[]) => void): Unit`.
  - `portal.ts`: `createPortal(ctx, kit: GeometryKit): Unit`.

**Required changes from the prototype (spec §4–§5), all applied in the code below:**
- **Pillars:** one per StatsBand stat (`STAT_COUNT` = 4), with the prototype heights (Ruling 4). The reveal comes from `pillarReveal(p, i)`. `onStatsReveal` is called only when a value changes (≈ p 0.6 → 0.72) plus once on the first frame. The per-frame label projection and the DOM writes are gone; IslandJourney writes the count-up only on those callbacks, which is the "per-frame DOM only while active" rule. Portrait layout via `resize()` (prototype 1496–1497). Pillar bob × `frame.bob`. `rngFor("pillars")`. The stats point light is at the root and follows `vis.stats`.
- **Portal:** the swirl particle count is × `particleScale`, the sway is × `frame.bob`, and `rngFor("portal")`. The point light is at the root and follows `vis.portal`. Charge = `portalCharge(p)`.

- [ ] **Step 1: Create `pillars.ts`** (prototype 1137–1212)

```ts
// src/lib/three/island/pillars.ts
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { pillarReveal, STAT_BASE_Y, STAT_COUNT, STAT_Z } from "./chapters";
import { crystalMaterial, CYAN, PINK, VIOLET } from "./crystals";
import { composeMatrix, type GeometryKit } from "./geometry";
import { addPointLight } from "./lights";
import { lerp, sstep } from "./math";
import { fbm, fogUniforms } from "./noise";
import { rngFor } from "./rng";
import { makeIsland } from "./terrain";
import type { SceneContext, Unit } from "./types";

// Chapter 3 — stat crystals rising from floating rocks (prototype lines 1137–1212).

const PILLAR_VS = /* glsl */ `⟪prototype L1164–L1170⟫`;
const PILLAR_FS = /* glsl */ `⟪prototype L1171–L1193⟫`;

/** One per StatsBand stat, tallest first (prototype 1144–1146). */
const SPECS: readonly { x: number; h: number; color: THREE.Color }[] = [
  { x: -10.5, h: 8.6, color: CYAN },
  { x: -3.5, h: 7.0, color: VIOLET },
  { x: 3.5, h: 5.8, color: new THREE.Color(0.3, 0.55, 1.4) },
  { x: 10.5, h: 4.8, color: PINK },
];

export interface PillarDeps {
  kit: GeometryKit;
  islandMaterial: THREE.MeshStandardMaterial;
  debrisGeometry: THREE.BufferGeometry;
  debrisMaterial: THREE.MeshStandardMaterial;
}

interface Pillar {
  g: THREE.Group;
  material: THREE.ShaderMaterial;
  ring: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  glow: THREE.Sprite;
  H: number;
  phase: number;
  y0: number;
  x0: number;
  z0: number;
}

export function createPillars({ scene, uTime }: SceneContext, deps: PillarDeps, onStatsReveal: (reveal: readonly number[]) => void): Unit {
  const rng = rngFor("pillars");
  const R = rng.range;
  const group = new THREE.Group();
  scene.add(group);
  const smallTop = (x: number, z: number, rn: number, nz: Parameters<typeof fbm>[0]) => 0.3 + 0.35 * fbm(nz, x * 0.3, z * 0.3, 2) - 1.0 * Math.pow(sstep(0.6, 1, rn), 1.5);

  const pillars: Pillar[] = SPECS.slice(0, STAT_COUNT).map((sp, i) => {
    const g = new THREE.Group();
    g.position.set(sp.x, STAT_BASE_Y + Math.sin(i * 1.9) * 0.6, STAT_Z + Math.abs(sp.x) * 0.25);
    const rock = makeIsland({ radius: 2.7, depth: 4.2, detail: 10, seed: 40 + i, top: smallTop, outline: 0.16 });
    g.add(new THREE.Mesh(rock.geometry, deps.islandMaterial));
    const body = new THREE.CylinderGeometry(0.9, 1.05, sp.h, 6, 1).translate(0, sp.h / 2, 0);
    const tip = new THREE.ConeGeometry(0.9, 1.7, 6, 1).translate(0, sp.h + 0.85, 0);
    const geometry = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]);
    body.dispose();
    tip.dispose();
    const H = sp.h + 1.7;
    const shards = new THREE.InstancedMesh(deps.kit.crystalGeometry, crystalMaterial(uTime, 1.2), 4);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + R(0, 1);
      const s = R(0.35, 0.6);
      shards.setMatrixAt(k, composeMatrix(Math.cos(a) * 1.9, R(0.2, 0.9), Math.sin(a) * 1.9, R(-0.4, 0.4), 0, R(-0.4, 0.4), s * 0.3, s * 1.1, s * 0.3));
      shards.setColorAt(k, sp.color);
    }
    g.add(shards);
    const material = new THREE.ShaderMaterial({ fog: true, uniforms: fogUniforms({ uTime, uReveal: { value: 0 }, uH: { value: H }, uC: { value: sp.color } }), vertexShader: PILLAR_VS, fragmentShader: PILLAR_FS });
    const pillar = new THREE.Mesh(geometry, material);
    pillar.position.y = 0.2;
    g.add(pillar);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.025, 4, 90),
      new THREE.MeshBasicMaterial({ color: sp.color.clone().multiplyScalar(2.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }),
    );
    ring.rotation.x = Math.PI / 2 + 0.25;
    g.add(ring);
    const glow = deps.kit.glowSprite(sp.color.clone().multiplyScalar(1.3), 7, 0);
    g.add(glow);
    group.add(g);
    return { g, material, ring, glow, H, phase: R(0, 6), y0: g.position.y, x0: sp.x, z0: g.position.z };
  });
  const light = addPointLight(scene, 0x6a8cff, 70, 40, 1.6, [0, -40, -46]);

  // Drifting rocks in the deep for parallax (prototype 1203–1211) — shares the debris geometry/material.
  const rockColors = ["#4a3d62", "#5a4a70", "#3a2f52"].map((c) => new THREE.Color(c));
  const rocks = new THREE.InstancedMesh(deps.debrisGeometry, deps.debrisMaterial, 26);
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1;
    const s = R(0.25, 1.3);
    rocks.setMatrixAt(i, composeMatrix(side * R(15, 34), R(-58, -34), R(-80, -30), R(0, 6), R(0, 6), R(0, 6), s, s * R(0.6, 1), s));
    rocks.setColorAt(i, rockColors[i % 3]);
  }
  group.add(rocks);

  const reveal = pillars.map(() => 0);
  let reported = false;

  return {
    update(frame, vis) {
      light.setOn(vis.stats);
      group.visible = vis.stats;
      // Count-up source: report only real changes (≈ p 0.6 → 0.72), plus the first frame.
      let changed = !reported;
      for (let i = 0; i < pillars.length; i++) {
        const r = pillarReveal(frame.p, i);
        if (r !== reveal[i] && (Math.abs(r - reveal[i]) > 1e-3 || r === 0 || r === 1)) {
          reveal[i] = r;
          changed = true;
        }
      }
      if (changed) {
        reported = true;
        onStatsReveal(reveal);
      }
      if (!vis.stats) return;
      pillars.forEach((pl, i) => {
        const r = reveal[i];
        pl.material.uniforms.uReveal.value = r;
        pl.g.position.y = pl.y0 + Math.sin(frame.t * 0.7 + pl.phase) * 0.18 * frame.bob;
        pl.ring.position.y = lerp(0.5, pl.H * 0.78, r);
        pl.ring.rotation.z += frame.dt * 0.5;
        pl.ring.material.opacity = r;
        pl.glow.position.y = pl.H * r;
        pl.glow.material.opacity = 0.35 * r;
      });
    },
    // Portrait: pillars closer together and slightly smaller (prototype 1496–1497)
    resize(width, height) {
      const portrait = width / height < 0.9;
      for (const pl of pillars) {
        pl.g.position.x = pl.x0 * (portrait ? 0.5 : 1);
        pl.g.position.z = portrait ? STAT_Z + Math.abs(pl.x0) * 0.1 : pl.z0;
        pl.g.scale.setScalar(portrait ? 0.85 : 1);
      }
    },
  };
}
```

- [ ] **Step 2: Create `portal.ts`** (prototype 1214–1318)

```ts
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

const RING_VS = /* glsl */ `⟪prototype L1222⟫`;
const RING_FS = /* glsl */ `⟪prototype L1223–L1234⟫`;
const DISC_VS = /* glsl */ `⟪prototype L1244⟫`;
const DISC_FS = /* glsl */ `⟪prototype L1245–L1266⟫`;
const SWIRL_VS = /* glsl */ `⟪prototype L1297–L1308⟫`;
const SWIRL_FS = /* glsl */ `⟪prototype L1309–L1313⟫`;

export function createPortal({ scene, uTime, uPixelRatio, quality }: SceneContext, kit: GeometryKit): Unit {
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
    // Charge + slow sway / arc spin (prototype 1630–1637)
    update(frame, vis) {
      light.setOn(vis.portal);
      portal.visible = vis.portal;
      if (!vis.portal) return;
      const { t, bob } = frame;
      uCharge.value = portalCharge(frame.p);
      portal.rotation.z = Math.sin(t * 0.2) * 0.04 * bob;
      arcs[0].rotation.set(0.32 + Math.sin(t * 0.3) * 0.08, 0.18, t * 0.3);
      arcs[1].rotation.set(-0.28, 0.4 + Math.sin(t * 0.25) * 0.08, -t * 0.2);
      arcs[2].rotation.set(0.12, -0.3, t * 0.12);
      shardGroup.rotation.z = t * 0.05;
    },
  };
}
```

- [ ] **Step 3: Final `sceneBuilders` in `world.ts`**

Change the crystals import to `import { createCrystals, type Crystals } from "./crystals";`, and add:
```ts
import { createPillars } from "./pillars";
import { createPortal } from "./portal";
```
Replace `sceneBuilders` with the final version:
```ts
/** Scene units in build order; the world yields to the main thread before each entry (short tasks). */
function sceneBuilders(ctx: SceneContext, opts: WorldOptions, units: Unit[]): Array<() => void> {
  let kit!: GeometryKit;
  let island!: MainIsland;
  let crystals!: Crystals;
  return [
    () => {
      kit = createGeometryKit(ctx);
      island = createMainIsland(ctx);
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
    () => units.push(createPortal(ctx, kit)),
  ];
}
```

- [ ] **Step 4: Static checks**

Run: `npm test && npx tsc --noEmit && npx eslint src && grep -rn "⟪" src/lib/three`
Expected: all green; the grep prints nothing. Also run `grep -rn "window\.\|document\." src/lib/three/island/*.ts | grep -v "^\S*:\s*//"` and check by eye that every hit is inside a function body (no module-level DOM access).

- [ ] **Step 5: Full-journey render check**

Run: `CDP_PORT=9333 node "$S/island/shots.mjs" t11` and `CDP_PORT=9333 node "$S/island/shots.mjs" t11 390 844`
Expected: 6 + 6 frames. Every `cmp-t11-*` pair matches the prototype's composition and palette, including the per-module RNG differences:
- p 0.7: 4 crystal pillars risen on floating rocks, with rings and shards; drifting rocks in the deep.
- p 0.87: climbing through the clouds toward the portal glow.
- p 1: the charged portal (ring, dark frame, swirl disc, arcs, shards, particle swirl), framed as in the prototype.
- On mobile the pillars sit closer together (portrait layout).
- Desktop fps ≥ 55 at every point; record the mobile (medium) fps.

- [ ] **Step 6: Stats count-up, portal and deep link (`$S/island/t11-stats-portal.mjs`)**

```js
// Stats numbers count up with the pillars (final values always in the sr-only layer); the portal is
// reached; a deep link to #contact starts at the portal with no fly-through and final numbers.
import { BASE, DIR, check, hideUi, seek, session, showUi, sleep, waitFor } from "./lib.mjs";

const read = (s) => s.eval(`return [...document.querySelectorAll("[data-island-stat]")].map((el) => ({ shown: el.textContent, final: el.dataset.final, sr: el.nextElementSibling.textContent }));`);
const s = await session({ width: 1440, height: 900 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
await seek(s, 0.59);
await sleep(500);
let st = await read(s);
check(st.length === 4 && st.every((x) => x.sr === x.final), "sr-only layer holds the final values");
check(st.every((x) => /^0/.test(x.shown) && x.shown !== x.final), `before the rise the numbers read 0: ${st.map((x) => x.shown).join(" | ")}`);
await seek(s, 0.64);
await sleep(500);
st = await read(s);
check(st.some((x) => x.shown !== x.final && !/^0([.,]0)?(\D|$)/.test(x.shown)), `mid-rise numbers are counting: ${st.map((x) => x.shown).join(" | ")}`);
await seek(s, 0.8);
await sleep(500);
st = await read(s);
check(st.every((x) => x.shown === x.final), `numbers land exactly on the final values: ${st.map((x) => x.shown).join(" | ")}`);
await hideUi(s);
await seek(s, 1);
await sleep(800);
await s.shot(`${DIR}/t11-portal-1440.png`);
await showUi(s);
check(s.logs.length === 0, `no console errors/warnings ${JSON.stringify(s.logs)}`);
await s.close();

const d = await session({ width: 1440, height: 900 });
await d.goto(`${BASE}/#contact`);
await waitFor(d, `document.documentElement.dataset.island === "live"`, 40000);
const r = await d.eval(`return { p: window.__island.stats.p, intro: window.__island.stats.introDone, frames: window.__island.stats.frames, numbers: [...document.querySelectorAll("[data-island-stat]")].every((el) => el.textContent === el.dataset.final) };`);
check(r.p > 0.85 && r.intro === true, `deep link /#contact starts at the portal without a fly-through ${JSON.stringify(r)}`);
check(r.numbers, "deep link: stat numbers already final");
check(d.logs.length === 0, `deep link: no console errors/warnings ${JSON.stringify(d.logs)}`);
await d.close();
```
Run: `CDP_PORT=9333 node "$S/island/t11-stats-portal.mjs"`. Expected: all `ok`; `t11-portal-1440.png` shows the charged portal.

- [ ] **Step 7: Every culling gate is invisible**

Run: `CDP_PORT=9333 node "$S/island/t9-gates.mjs" gates=0.17,0.25,0.5,0.55,0.7,0.8,0.9`, then `CDP_PORT=9333 node "$S/island/t9-gates.mjs" sweep=0.237,0.272` (the island gate switches on camera y −30 somewhere inside that segment).
Expected: all `ok` (no gate adds more than 0.5 % changed pixels over its control step). If one pops, widen that gate (tests first, as in Task 9 Step 7).

- [ ] **Step 8: Re-run the lifecycle suites on the full scene**

Run: `CDP_PORT=9333 node "$S/island/t6-live.mjs" && CDP_PORT=9333 node "$S/island/t6-dispose.mjs" && CDP_PORT=9333 node "$S/island/t7-stepdown.mjs" && CDP_PORT=9333 node "$S/island/t10-resize.mjs"`
Expected: all `ok`. The full scene now makes the give-up path of `t7-stepdown` reachable under the 20× CPU throttle. If it still only steps, run it once more with `rate: 40` and record which path ran.

---

### Task 12: The poster (rendered from the scene)

**Files:**
- Modify: `public/images/island-poster.webp` (the real render replaces the Task 5 placeholder); possibly `src/components/sections/Hero.tsx` (poster `object-position`, Step 3)
- Scratch: `$S/island/poster.mjs`, `$S/island/t12-handoff.mjs`

**Interfaces:**
- Consumes: the live world on the production build; `hideUi`, `sharp` (lib.mjs).
- Produces: `public/images/island-poster.webp`, 1600×900 or smaller, ≤ 80 KB, showing the settled hero frame (p 0, intro finished, pointer centred).

- [ ] **Step 1: Production server**

Stop `npm run dev`. Run `npm run build && npm start` (background; http://localhost:3000). The prod build has no dev overlay and no `__island` handle.

- [ ] **Step 2: Capture + encode (`$S/island/poster.mjs`)**

```js
// Renders the settled hero frame of the live scene into public/images/island-poster.webp (≤ 80 KB).
import { statSync } from "node:fs";
import { BASE, DIR, hideUi, session, sharp, sleep, waitFor } from "./lib.mjs";

const OUT = "C:/Users/Kaio/Documents/Claude/Portfolio/public/images/island-poster.webp";
const RAW = `${DIR}/poster-raw.png`;
const s = await session({ width: 1920, height: 1080 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
await sleep(7000); // intro swoop (3.4 s) + camera damping settle; pointer never moved → centred
await hideUi(s);
await sleep(400);
await s.shot(RAW);
if (s.logs.length) console.log("console:", JSON.stringify(s.logs));
await s.close();
for (const [width, quality] of [[1600, 72], [1600, 64], [1600, 56], [1600, 48], [1440, 48], [1280, 45]]) {
  const info = await sharp(RAW).resize(width, Math.round((width * 9) / 16)).webp({ quality, effort: 6 }).toFile(OUT);
  console.log(`${width}px q${quality}: ${info.size} bytes`);
  if (info.size <= 80 * 1024) break;
}
console.log("final", statSync(OUT).size, "bytes");
```
Run: `CDP_PORT=9333 node "$S/island/poster.mjs"`
Expected: the final line reports ≤ 81920 bytes. Open `public/images/island-poster.webp` (Read). It shows the island hero frame as in `ref/proto-1440-0.png`, with no text, header, cursor or UI.

- [ ] **Step 3: Handoff + mobile crop check (`$S/island/t12-handoff.mjs`)**

Rebuild and restart so the new file is served: `npm run build && npm start`. Then create:
```js
// Poster (static fallback) vs the settled live frame, desktop; poster crop on a phone.
import { BASE, DIR, hideUi, session, sideBySide, sleep, waitFor } from "./lib.mjs";

const POSTER_ONLY = `header, footer, [data-motion-progress], .motion-cursor, main > :not(.island-layer):not([data-island-chapter="hero"]), [data-island-chapter="hero"] > :not(.island-poster) { visibility: hidden !important; }`;
const posterOnly = (s) => s.eval(`const st = document.createElement("style"); st.textContent = ${JSON.stringify(POSTER_ONLY)}; document.head.append(st); return true;`);

const a = await session({ width: 1440, height: 900, reducedMotion: "reduce" });
await a.goto(`${BASE}/`);
await sleep(3000);
await posterOnly(a);
await sleep(300);
await a.shot(`${DIR}/t12-poster-1440.png`);
await a.close();

const b = await session({ width: 1440, height: 900 });
await b.goto(`${BASE}/`);
await waitFor(b, `document.documentElement.dataset.island === "live"`, 40000);
await sleep(7000);
await hideUi(b);
await sleep(300);
await b.shot(`${DIR}/t12-live-1440.png`);
await b.close();
await sideBySide(`${DIR}/t12-poster-1440.png`, `${DIR}/t12-live-1440.png`, `${DIR}/t12-handoff.png`);

const m = await session({ width: 390, height: 844, mobile: true, reducedMotion: "reduce" });
await m.goto(`${BASE}/`);
await sleep(3000);
await posterOnly(m);
await sleep(300);
await m.shot(`${DIR}/t12-poster-390.png`);
await m.close();
console.log("done");
```
Run: `CDP_PORT=9333 node "$S/island/t12-handoff.mjs"`, then open `t12-handoff.png` and `t12-poster-390.png`.
- **Desktop:** the left (poster) and right (live) halves show the same island, framing and colours. The poster's bottom fade and small animation or grain differences are normal.
- **Mobile:** if the island is cut off at the right edge (the desktop frame has it shifted right by `shift [0.3, 0.03]`), change the poster `<Image>` in `Hero.tsx` from `className="island-poster z-0 object-cover"` to `className="island-poster z-0 object-cover object-[62%_50%]"`. Then `npx tsc --noEmit && npx eslint src && npm run build && npm start`, and re-run the script until the island is visible behind the glass panel at 390 px.

- [ ] **Step 4: LCP spot check**

Run one mobile Lighthouse pass on `/` (the Task 13 runner: edit `lh-run.mjs` first, as described in Task 13 Step 5). Expected: the LCP element is either the hero `h1` or the poster `img`, and LCP ≤ 2.5 s. If the poster makes LCP > 2.5 s on mobile, apply spec §10's mitigation: lower the webp quality (Step 2 loop) first. If that is still not enough, report back instead of switching to a CSS-gradient poster (that is a user decision).

---

### Task 13: Final verification: full e2e suite, contrast, Lighthouse, bundle, screenshots, video

**Files:**
- Create: `reports/lighthouse/island-*.json` (git-ignored raw reports)
- Scratch: `$S/island/contrast.mjs`, `$S/island/blur-fps.mjs`, `$S/island/chapters.mjs`; edits to `$S/lh/lh-run.mjs` and `$S/record-proto.mjs`

**Interfaces:**
- Consumes: everything above.
- Produces: the numbers and artefacts Task 14 writes into the docs.

- [ ] **Step 1: Static gate** (stop any server first)

Run: `npm test && npx tsc --noEmit && npx eslint src && npm run build`
Expected: all green (≈ 120 tests: 30 pre-existing + 85 island modules + 2 clouds + 3 RING_MAPS); build 0 errors.

- [ ] **Step 2: Bundle**

Run: `node "$S/island/bundle-check.mjs"`
Expected: `ok: no three code in the homepage's initial chunks`. The `three total` should be ≈ 200 KB gz (spec §4). If it is > 260 KB gz, look for an accidental `three/webgpu` or `three/addons/Addons.js` import (`grep -rn "three/" src`) before going further.

- [ ] **Step 3: Full dev e2e regression**

Start `npm run dev` (background) with Chromium on 9333, then run in order:
```bash
for t in t5-static t6-live t6-desync t6-dispose t7-matrix t7-nowebgl t7-stepdown t10-ring t10-keys t10-resize t11-stats-portal; do echo "== $t"; CDP_PORT=9333 node "$S/island/$t.mjs" || echo "!! $t exited non-zero"; done
CDP_PORT=9333 node "$S/island/t9-gates.mjs" gates=0.17,0.25,0.5,0.55,0.7,0.8,0.9
CDP_PORT=9333 node "$S/island/t9-gates.mjs" sweep=0.237,0.272
```
Expected: no `FAIL` line and no `!!` line anywhere.

- [ ] **Step 4: Contrast of glass panels over the brightest frames (`$S/island/contrast.mjs`)** (spec §7; Lighthouse cannot see a canvas background)

```js
// Worst-case WCAG contrast of glass-panel text over the live 3D backdrop, at many camera positions.
import { BASE, DIR, check, seek, session, sharp, sleep, waitFor } from "./lib.mjs";

const CHECKPOINTS = [0, 0.1, 0.2, 0.27, 0.35, 0.45, 0.556, 0.59, 0.7, 0.8, 0.85, 0.906, 0.95, 1];
const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (r, g, b) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
// Text colours inside each visible panel, skipping text that sits on its own opaque background (buttons).
const PANELS = `return [...document.querySelectorAll(".island-glass")].map((panel) => {
  const r = panel.getBoundingClientRect();
  if (r.bottom <= 0 || r.top >= innerHeight || r.width === 0) return null;
  const colors = new Set();
  for (const n of panel.querySelectorAll("*")) {
    if (![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
    const cs = getComputedStyle(n);
    if (cs.visibility !== "visible" || cs.opacity === "0") continue;
    let own = false;
    for (let a = n; a && a !== panel; a = a.parentElement) {
      const s = getComputedStyle(a);
      const alpha = (s.backgroundColor.match(/[\\d.]+/g) || [0, 0, 0, 0]).map(Number)[3] ?? 1;
      if (s.backgroundImage !== "none" || alpha >= 0.9) { own = true; break; }
    }
    if (own) continue;
    const m = cs.color.match(/[\\d.]+/g).map(Number);
    if (m.length > 3 && m[3] < 1) continue; // transparent (bg-clip-text gradients) — judged visually
    colors.add(m.slice(0, 3).join(","));
  }
  return { x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(innerWidth, r.right) - Math.max(0, r.left), h: Math.min(innerHeight, r.bottom) - Math.max(0, r.top), colors: [...colors] };
}).filter(Boolean);`;

let worst = { ratio: 99 };
for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  const s = await session({ width: w, height: h, mobile });
  await s.goto(`${BASE}/`);
  await waitFor(s, `document.documentElement.dataset.island === "live" && window.__island?.stats.introDone === true`, 40000);
  for (const p of CHECKPOINTS) {
    await seek(s, p);
    await sleep(500);
    const panels = await s.eval(PANELS);
    await s.eval(`const st = document.createElement("style"); st.id = "hide-text"; st.textContent = ".island-glass * { visibility: hidden !important; }"; document.head.append(st); return true;`);
    await sleep(150);
    const file = `${DIR}/contrast-${w}-${p}.png`;
    await s.shot(file);
    await s.eval(`document.getElementById("hide-text").remove(); return true;`);
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const panel of panels) {
      const values = [];
      for (let y = Math.floor(panel.y); y < Math.floor(panel.y + panel.h); y += 2)
        for (let x = Math.floor(panel.x); x < Math.floor(panel.x + panel.w); x += 2) {
          const o = (y * info.width + x) * 3;
          values.push(lum(data[o], data[o + 1], data[o + 2]));
        }
      values.sort((a, b) => a - b);
      const backdrop = values[Math.floor(values.length * 0.995)] ?? 0; // brightest 0.5 % of the panel
      for (const c of panel.colors) {
        const [r, g, b] = c.split(",").map(Number);
        const cr = ratio(lum(r, g, b), backdrop);
        if (cr < worst.ratio) worst = { ratio: cr, color: c, p, width: w };
        if (cr < 4.5) check(false, `${w}px p=${p}: text rgb(${c}) only ${cr.toFixed(2)}:1 over the brightest backdrop`);
      }
    }
  }
  await s.close();
}
check(worst.ratio >= 4.5, `worst glass-panel text contrast ${worst.ratio.toFixed(2)}:1 ${JSON.stringify(worst)}`);
```
Run: `CDP_PORT=9333 node "$S/island/contrast.mjs"`
Expected: the final line is `ok` (≥ 4.5:1). If a colour fails, apply the remedy ladder in this order and re-run after each rung:
1. Change that element's over3d text from `text-slate-400` to `text-slate-300` in its section.
2. Raise `.island-glass` background alpha from 0.72 to 0.8 in `motion.css` (a deviation from spec §3.3 to report).

Stop at the first rung that passes.

- [ ] **Step 5: Lighthouse on the production build**

Replace `$S/lh/lh-run.mjs` with this version (CDP port from the env, reduced-motion argument, island state in the summary line):
```js
// Lighthouse via Node API on the headless Chromium (CDP_PORT), forcing prefers-reduced-motion (default no-preference).
import { writeFileSync } from "node:fs";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import puppeteer from "puppeteer-core";

const [, , url, formFactor, out, reducedMotion = "no-preference"] = process.argv;
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${process.env.CDP_PORT ?? 9222}`, defaultViewport: null });
const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reducedMotion }]);
const flags = { output: "json", onlyCategories: ["performance", "accessibility", "best-practices", "seo"], logLevel: "error" };
const result = await lighthouse(url, flags, formFactor === "desktop" ? desktopConfig : undefined, page);
writeFileSync(out, result.report);
const lhr = result.lhr;
const cat = (k) => Math.round(lhr.categories[k].score * 100);
const a = (k) => lhr.audits[k].displayValue;
const state = await page
  .evaluate(() => ({ reduce: matchMedia("(prefers-reduced-motion: reduce)").matches, island: document.documentElement.dataset.island ?? null, motion: document.documentElement.classList.contains("motion-ready") }))
  .catch(() => "n/a");
console.log(`${url} [${formFactor}${reducedMotion === "reduce" ? ", reduced" : ""}] P${cat("performance")} A${cat("accessibility")} BP${cat("best-practices")} SEO${cat("seo")} | LCP ${a("largest-contentful-paint")} TBT ${a("total-blocking-time")} CLS ${a("cumulative-layout-shift")} | after-run ${JSON.stringify(state)}`);
await page.close();
await browser.disconnect();
```
Stop the dev server, then run `npm run build && npm start` (background). Keep the machine otherwise idle: close Roblox/OBS, because CPU contention skewed the last audit by 5–8 points. Then run:
```bash
R="C:/Users/Kaio/Documents/Claude/Portfolio/reports/lighthouse"; cd "$S/lh"
CDP_PORT=9333 node lh-run.mjs http://localhost:3000/ desktop "$R/island-home-desktop.json"
for i in 1 2 3; do CDP_PORT=9333 node lh-run.mjs http://localhost:3000/ mobile "$R/island-home-mobile-$i.json"; done
CDP_PORT=9333 node lh-run.mjs http://localhost:3000/ mobile "$R/island-home-mobile-reduced.json" reduce
CDP_PORT=9333 node lh-run.mjs http://localhost:3000/realisations mobile "$R/island-realisations-mobile.json"
CDP_PORT=9333 node lh-run.mjs http://localhost:3000/services mobile "$R/island-services-mobile.json"
CDP_PORT=9333 node lh-run.mjs http://localhost:3000/maps mobile "$R/island-maps-mobile.json"
CDP_PORT=9333 node lh-run.mjs http://localhost:3000/maps desktop "$R/island-maps-desktop.json"
```
Expected:
- Home desktop: **P ≥ 90, A 100, BP 100, CLS ≤ 0.02**, `after-run {"island":"live"}`.
- Home mobile: median of the 3 runs **P ≥ 80**, A 100, BP 100, CLS ≤ 0.02, `"island":"live"`.
- Home mobile reduced: `"island":"off"`, A 100, BP 100.
- Other pages ≥ 95 mobile, as before this work.
- SEO 92 on localhost is the known canonical artefact (100 in prod). BP 96 on `/maps` is the known missing `sprite-pillars.jpg` (400).

If home mobile < 80, open the JSON's `bootup-time` / `long-tasks` audits. A long task from the world build means adding a `yieldToMain()` split inside the heaviest builder (usually `createMainIsland`: split the probe and the main island into two `sceneBuilders` entries). Re-measure, and report what changed.

- [ ] **Step 6: Desktop fps with the glass blur in view (`$S/island/blur-fps.mjs`, prod)**

```js
// backdrop-filter over a live canvas re-blurs every frame: check fps with the biggest panels on screen.
import { BASE, check, session, sleep, waitFor } from "./lib.mjs";

const FPS = `return new Promise((resolve) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else resolve(Math.round((n * 1000) / (performance.now() - t0))); }; requestAnimationFrame(tick); });`;
const s = await session({ width: 1440, height: 900 });
await s.goto(`${BASE}/`);
await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
await sleep(6000);
for (const id of ["services", "faq", "contact"]) {
  await s.eval(`document.getElementById("${id}").scrollIntoView(); return true;`);
  await sleep(1500);
  const fps = await s.eval(FPS);
  check(fps >= 55, `#${id} in view: ${fps} fps (≥ 55)`);
}
await s.close();
```
Run: `CDP_PORT=9333 node "$S/island/blur-fps.mjs"`. Expected: all `ok`. If any view is < 55 fps, delete the `backdrop-filter` rule from `motion.css` (a spec deviation to report), rebuild, and re-run this step and Step 4.

- [ ] **Step 7: Final screenshots per chapter (`$S/island/chapters.mjs`, prod)**

```js
// Final screenshots per chapter, desktop + mobile, 3D on and the reduced-motion fallback.
import { BASE, DIR, session, sleep, waitFor } from "./lib.mjs";

const stage = (name, f) => `(() => { const s = document.querySelector('[data-island-chapter="${name}"]'); const g = s.querySelector(".island-stage"); const top = s.getBoundingClientRect().top + scrollY; const vh = document.documentElement.clientHeight; return top - Math.min(0, vh - g.offsetHeight) + Math.max(0, s.offsetHeight - g.offsetHeight) * ${f}; })()`;
const STOPS = {
  hero: "0",
  services: `document.getElementById("services").getBoundingClientRect().top + scrollY`,
  ring: stage("ring", 0.45),
  stats: stage("stats", 0.9),
  process: `document.getElementById("process").getBoundingClientRect().top + scrollY`,
  cta: `(() => { const c = document.querySelector('[data-island-chapter="cta"]'); return c.getBoundingClientRect().top + scrollY + Math.max(0, c.offsetHeight - document.documentElement.clientHeight); })()`,
};
for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const s = await session({ width: w, height: h, mobile, reducedMotion });
    await s.goto(`${BASE}/`);
    if (reducedMotion === "no-preference") await waitFor(s, `document.documentElement.dataset.island === "live"`, 40000);
    await sleep(6000);
    for (const [name, expr] of Object.entries(STOPS)) {
      await s.eval(`window.scrollTo(0, ${expr}); return true;`);
      await sleep(2500);
      await s.shot(`${DIR}/final-${w}-${reducedMotion}-${name}.png`);
    }
    console.log(w, reducedMotion, "console:", JSON.stringify(s.logs));
    await s.close();
  }
}
```
Run: `CDP_PORT=9333 node "$S/island/chapters.mjs"`. Expected: 24 screenshots and every `console: []`. Review them all:
- 3D: every chapter renders and matches its section (spec §1.1).
- Fallback: poster hero and a readable static page, nothing hidden (spec §1.3).

- [ ] **Step 8: Scroll-through videos**

In `$S/record-proto.mjs`, directly after the line `await s.goto(URL_);`, insert:
```js
for (let i = 0; i < 120 && (await s.eval("return document.documentElement.dataset.island ?? null;")) !== "live"; i++) await sleep(250);
```
(This waits for the world before filming; the script's existing 3.5 s wait then covers the intro swoop.) Then run:
```bash
CDP_PORT=9333 node "$S/record-proto.mjs" http://localhost:3000/ "$S/island/video/home-desktop.mp4" 1440 900
CDP_PORT=9333 node "$S/record-proto.mjs" http://localhost:3000/ "$S/island/video/home-mobile.mp4" 390 844
```
Expected: two MP4s. For each, the JSON line has `seconds` ≥ 40 and the `console:` line is `[]`. Watch both (e.g. extract 12 frames with `ffmpeg -i <mp4> -vf fps=1/4 "$S/island/video/f%02d.png"` and Read them). Also judge the poster → live handoff at the start: this is the user decision listed in Task 14.

- [ ] **Step 9: Stop everything**

Stop `npm start`, the static server (if still running) and Chromium. Leave no background process running.

---

### Task 14: Docs + whole-branch review

**Files:**
- Modify: `specs/2026-09-27-3d-island-homepage.md`, `CLAUDE.md`, `CACHE.md`, `.claude/rules/components.md`

**Interfaces:**
- Consumes: the Task 13 numbers and artefacts, the Rulings list above, and every deviation recorded during Tasks 5–13.
- Produces: up-to-date docs, a reviewed branch and a hand-off report. **No commit.**

- [ ] **Step 1: Spec status + implementation notes**

In `specs/2026-09-27-3d-island-homepage.md`, change the status line to `**Status:** implemented (branch feat/motion-design, uncommitted) — see §11`. Append a `## 11. Implementation notes (<date>)` section containing:
- (a) Rulings 1–18 from this plan, one line each.
- (b) Every deviation found during execution: gate ranges widened in Task 9/11, contrast remedy rung, blur removal, poster `object-position`, extra `yieldToMain` splits.
- (c) The Lighthouse table from Task 13 Step 5: page × desktop/mobile P/A/BP/SEO/CLS, plus the reduced-motion row.
- (d) The bundle size (three total KB gz) and desktop/mobile fps per chapter.
- (e) The testing gotcha: this machine reports reduced motion, so emulate `no-preference`; the functional e2e needs the dev server (`window.__island`); Lighthouse, video and poster need the prod server.

- [ ] **Step 2: `CLAUDE.md`**

- In "Tech Stack & Commands", add: `- 3D homepage: three.js 0.170 (vanilla, no R3F) — src/lib/three/island (world + scene modules, pure helpers unit-tested), src/components/three (IslandJourney / Toggle3D / MapFocusCard); loaded after load+idle via afterLoadIdle, home only`.
- In "Gotchas", add:
  - Never import `three` or `@/lib/three/island/world` statically. `IslandJourney` is the only entry, through a dynamic import. `bundle-check` guards this.
  - `html[data-island]` = `pending | loading | live | off`, set pre-paint by the inline boot script in `app/[locale]/page.tsx` (+ `suppressHydrationWarning` on `<html>`). The sticky ring/stats chapters exist only while it is not `off`.
  - The 3D layer is `position: fixed; z-index: -1`, so do not give `<html>` a background.
  - The toggle choice is `localStorage["kc-island-3d"]` = `on | off`.
  - Regenerate the poster with the Task 12 script (`plans/2026-09-27-3d-island-homepage.md`) after any visual change to the hero frame.
  - Update the "Status" header date/line.

- [ ] **Step 3: `.claude/rules/components.md`**

Add one rule line: `- 3D (homepage): components never import three; the world is reached only through IslandJourney's dynamic import. Canvas labels use the next/font families via --font-orbitron / --font-inter. Sections support variant="over3d" (Glass panel, transparent background) — keep the default variant unchanged for other pages.`

- [ ] **Step 4: `CACHE.md`**

Add a new top entry under "Dernières actions" in French, following the file's style:
- **Title:** "Homepage 3D « Floating Island » — IMPLÉMENTÉE (non commitée)".
- **What shipped:** modules, new section order, toggle, poster, fallbacks.
- **Verification:** unit test count, e2e suites and results, contrast worst ratio, Lighthouse table, bundle, fps, video paths in the scratchpad.
- **Deviations / rulings:** point to spec §11.
- **Open questions for Kaio:** the 3 decisions below.

Update "Dernière mise à jour", the "État de vérification" section, and add the 3D gotchas to "Pièges connus".

- [ ] **Step 5: Whole-branch review**

Use superpowers:requesting-code-review. Dispatch a **fresh** reviewer on the most capable model over the branch diff, restricted to this feature's files: `git diff --stat` shows the rest of the uncommitted motion work, so list the files from the File Structure table. Give it the spec, this plan's Rulings and the **Review Focus** list as the checklist. It must check each Review Focus item against the code and the e2e scripts in `$S/island/`.

For every Critical/Important finding:
1. Write a failing repro first: a vitest case for pure logic, or a CDP script in `$S/island/`.
2. Fix it.
3. Re-run the repro plus Task 13 Steps 1 and 3.

Record the findings and fixes in `CACHE.md` under "Revue finale".

- [ ] **Step 6: Final gate + hand-off**

Run: `npm test && npx tsc --noEmit && npx eslint src && npm run build`. Expected: all green.

Report to the user. Do **not** commit or push. The report covers:
- The Lighthouse table, and a link to the videos and the final screenshots.
- The rulings and any deviations.
- These decisions for the user:
  1. **Poster → live handoff:** keep the intro swoop when the canvas replaces the poster, or skip the swoop while the poster is on screen (watch the start of `home-desktop.mp4`).
  2. **Pillar heights:** keep the fixed descending heights (Ruling 4), or derive them from data.
  3. **Commit strategy:** the branch `feat/motion-design` still holds the uncommitted motion-design work plus this feature. Commit them separately (motion first)?

---

## Spec coverage (self-review)

| Spec | Where |
|---|---|
| §1.1 chapters render + sync, screenshots, video | Tasks 6 (sync), 8–11 (render checks), 13 Steps 7–8 |
| §1.2 Lighthouse budgets, CLS | Task 13 Step 5 (+ CLS checks in Tasks 5–7) |
| §1.3 no-WebGL / reduced motion / low-end → poster + static | Task 5 Step 14, Task 7 Steps 5–7 |
| §1.4 dispose on navigation | Task 6 Step 13 (RF3), re-run Tasks 8, 11, 13 |
| §1.5 tsc / eslint / test / build | every task; Task 13 Step 1, Task 14 Step 6 |
| §2 non-goals (home only, no R3F, no model files, no copy change) | Global Constraints; Rulings 12–13 |
| §3.1 modules + components | Tasks 1–4, 6, 8–11; Toggle3D Task 7; MapFocusCard Task 10 |
| §3.2 scroll → p by sections, gaps, CSS sticky, Lenis + pSmooth, Marquee | Task 2 (tests), Task 5 (sticky CSS, order), Task 6 (`damp` in world, measurement), RF2 |
| §3.3 over3d glass panels, no HeroShader/gallery on home, fixed canvas | Task 5; Ruling 1–2; contrast Task 13 Step 4 |
| §4 poster, budget, tiers, step-down fix, constant light count, per-frame DOM, cloud zones | Task 12; Task 6 Step 14 + Task 13 Step 2; Task 3; Task 6 (`measurePerf`); `addPointLight` Task 6; Task 11 (count-up on change only); Task 9 |
| §5 porting fixes (client-only, dispose, no global side effects, fonts, thumbnails, no debug hooks, bounded loops) | Global Constraints; Task 4 `dispose`; Task 8 (flowers); Task 10 (fonts, thumbnails); Ruling 15 |
| §6 reduced motion + toggle (localStorage, immediate load, RM + 3D behaviour) | Tasks 3, 6, 7 (RF5); Ruling 10 |
| §7 a11y + SEO (DOM order, aria-hidden canvas, focusable card, `aria-pressed`, HTML list, contrast) | Tasks 5, 7, 10 (Steps 7–8), 13 Step 4 |
| §9 verification list | Tasks 2–4 (unit), 6–11 (CDP e2e), 13 |
| §10 risks | step-down (RF4), LCP (Task 12 Step 4), contrast (Task 13 Step 4), desync (RF2), bundle (Task 6 Step 14) |

---

## Appendix A — `cdp.mjs` (recreate in `$S/` if `$TOOLS` is gone)

```js
// Minimal CDP driver for the debug Chrome on :9222 (no Playwright available).
// Opens a fresh tab with emulated media/viewport, then exposes goto/eval/shot/mouse/wheel/key.
import { writeFileSync } from "node:fs";

const BASE = `http://127.0.0.1:${process.env.CDP_PORT ?? 9222}`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function session({ width = 1440, height = 900, mobile = false, reducedMotion = "no-preference" } = {}) {
  const target = await (await fetch(`${BASE}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else if (m.method) listeners.forEach((l) => l(m));
  };
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  const send = (method, params = {}) =>
    new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });

  const logs = [];
  listeners.push((m) => {
    if (m.method === "Runtime.exceptionThrown") logs.push("EXC " + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 300));
    if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type))
      logs.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
  });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reducedMotion }] });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await send("Page.bringToFront");

  return {
    send,
    logs,
    on: (fn) => listeners.push(fn),
    async goto(url, waitMs = 0) {
      const loaded = new Promise((r) => listeners.push((m) => m.method === "Page.loadEventFired" && r()));
      await send("Page.navigate", { url });
      await loaded;
      if (waitMs) await sleep(waitMs);
    },
    async eval(body) {
      const { result, exceptionDetails } = await send("Runtime.evaluate", {
        expression: `(async () => { ${body} })()`,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true,
      });
      if (exceptionDetails) return "EVAL ERROR: " + (exceptionDetails.exception?.description ?? exceptionDetails.text);
      return result.value;
    },
    async shot(file, clip) {
      const { data } = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); // clip is PAGE-relative: prefer no clip
      writeFileSync(file, Buffer.from(data, "base64"));
    },
    async mouse(x, y) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, pointerType: "mouse" }); },
    async click(x, y) {
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    },
    async wheel(deltaY, x = 700, y = 450) { await send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX: 0, deltaY }); },
    async key(key, code = key, vk = 0) {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk });
    },
    async close() {
      ws.close();
      await fetch(`${BASE}/json/close/${target.id}`);
    },
  };
}
```
