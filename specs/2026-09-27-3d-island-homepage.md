# 3D "Floating Island" homepage — spec

**Date:** 2026-09-27 · **Status:** spec approved (2026-09-27) — plan: `plans/2026-09-27-3d-island-homepage.md`
**Builds on:** `specs/2026-09-26-motion-design.md` (motion engine stays; this adds a 3D layer).
**Reference prototype (source of truth for visuals):** `playground/3d-proto-a-island.html`
(1677 lines, three.js 0.170, all procedural). Video: prototype A sent 2026-09-27.

**Decisions (user, via AskUserQuestion):** full 3D scroll journey · assets built in code (no
Epic/Fortnite IP, no model files) · 3D loaded after the page (mobile Lighthouse ~80–90 accepted) ·
direction A "Floating island" · the **homepage becomes the 3D journey**; other pages keep today's
design · Stats moves after Réalisations · reduced-motion visitors get a static fallback **plus an
opt-in "Expérience 3D" toggle**.

## 1. Goal & success criteria

The homepage is an Awwwards-grade real-time 3D journey (island → map ring → crystal pillars → portal)
that carries the real B2B content, without breaking content, SEO, accessibility or the other pages.

Done when:
1. Every chapter below renders and syncs with its section — screenshots (1440×900 + 390×844) and a
   scroll-through video.
2. Home: Lighthouse **desktop Perf ≥ 90**, **mobile Perf ≥ 80**, **A11y 100**, **BP 100**,
   **CLS ≤ 0.02**. Other pages unchanged (≥ 95 mobile).
3. No WebGL / reduced motion (toggle off) / low-end tier → poster + readable static homepage, nothing
   hidden, no console errors.
4. Navigating away from home disposes everything (no WebGL context, listener or rAF left; verified).
5. `tsc`, `eslint src`, `npm test`, `npm run build` pass.

## 2. Non-goals

- No 3D on other pages; no persistent canvas across routes.
- No React Three Fiber; no external model/texture files other than the existing map thumbnails and one
  generated poster image.
- No change to copy, locales or data (except the section order on home).

## 3. Architecture

### 3.1 Modules (vanilla three.js 0.170, TypeScript, client-only)

`src/lib/three/island/` — each file ports a block of the prototype (line refs = prototype):

| File | Ports | Responsibility |
|---|---|---|
| `rng.ts` | 262–296 | seeded `mulberry32`; **one RNG per module** (`rngFor(name)`) so skipping/reordering units never changes layouts |
| `noise.ts` | 262–296 | `fbm`, `GLSL_NOISE`, `GLSL_FOG_ADD`, `fogUniforms()` |
| `sky.ts` | 330–390 | sky dome shader (stars, horizon, `uDeep`) + PMREM environment |
| `lights.ts` | 392–412 | hemi/key/rim/bounce + `withRim()` |
| `terrain.ts` | 414–517 | `makeIsland()` + main island |
| `water.ts` | 520–614 | pond, stream, waterfall |
| `vegetation.ts` | 617–694 | trees, flowers (bounded placement loop), boulders |
| `crystals.ts` | 696–826 | crystal material (shared), core, satellites, debris |
| `clouds.ts` | 828–911 | instanced cloud puffs — **detail and count per quality tier** |
| `particles.ts` | 913–960 | fireflies + dust |
| `mapRing.ts` | 962–1135 | 10 screens from `maps.json`, ring track, floor diagram, focus logic |
| `pillars.ts` | 1137–1212 | 4 stat pillars (heights from data) |
| `portal.ts` | 1214–1318 | ring, frame, vortex, arcs, shards, swirl particles |
| `cameraPath.ts` | 1320–1364 | keyframes + sampling (pure parts unit-tested) |
| `post.ts` | 1366–1394 | composer, bloom, grade pass (AA, veil, vignette, grain) |
| `quality.ts` | — | tier selection (pure, unit-tested) + adaptive step-down |
| `progress.ts` | — | scroll → camera progress mapping from section ranges (pure, unit-tested) |
| `world.ts` | 1484–1666 | `createWorld(canvas, opts) → { update(p, dt), setSize(), setPointer(), dispose() }` |

`src/components/three/`:
- `IslandJourney.tsx` (client) — mounted by the home page: poster, canvas, lazy-load of `world.ts`
  after `load` + idle (same `afterLoadIdle` as the motion engine), rAF loop, resize, pointer,
  progress from sections, crossfade poster → canvas, dispose on unmount.
- `MapFocusCard.tsx` (client) — HTML card for the focused map in the ring chapter (title, creator,
  minutes, **real link** to `/maps/[id]`), fed by a low-frequency callback from the world.
- `Toggle3D.tsx` (client) — "Expérience 3D" switch (see §6).

### 3.2 Scroll → camera progress

The camera progress `p ∈ [0,1]` (prototype keyframe space) is driven by the **real homepage sections**,
not a fake track. `progress.ts` maps the scroll position piecewise-linearly through section ranges
measured on load/resize (ResizeObserver on `main`):

| Homepage section (new order) | `p` range | Scene |
|---|---|---|
| Hero | 0 → 0.14 | island, intro swoop |
| Opportunity + Audiences + Services | 0.14 → 0.27 | orbit past the waterfall, under the core, dive through the clouds |
| **Réalisations** (sticky, ~300vh) | 0.27 → 0.556 | map ring; `MapFocusCard` follows the focused screen |
| **Stats** (sticky, ~150vh) | 0.59 → 0.80 | pillars rise, numbers count up |
| Process + WhyKaio + SectorIdeas + FAQ | 0.80 → 0.906 | slow climb through the clouds |
| FinalCta (contact) | 0.906 → 1 | portal charges, frames the brief form |

- Gaps between ranges (0.556→0.59) are interpolated across the section boundary.
- Sticky chapters use **CSS `position: sticky`** (no ScrollTrigger pin → no pin-spacer jumps).
- Smoothing: Lenis (already running via the motion engine) + the prototype's damped `pSmooth`.
- Marquee stays between Stats and Process, transparent background.

### 3.3 Content over the world

- Sections get a `variant="over3d"`: transparent section background, content in dark glass panels
  (`rgba(10,10,15,0.72)`, `backdrop-blur` desktop only), contrast AA verified.
- The home no longer renders `HeroShader`, the flat pinned gallery or the section background
  gradients; those remain for other pages and for the fallback.
- Canvas: `position: fixed; inset: 0; z-index: 0; aria-hidden; pointer-events: none`.

## 4. Loading & performance

- **Poster:** `public/images/island-poster.webp` (≤ 80 KB, rendered from the 3D scene at the hero
  frame) as the hero background immediately; the canvas fades in over it on its first frame.
- **Budget:** three.js core + used addons + scene ≈ 200 KB gz, loaded only on home, after load+idle.
- **Quality tiers** (`quality.ts`, pure):
  - `high` (fine pointer, ≥ 8 GB `deviceMemory` or unknown, not `saveData`): prototype settings, DPR ≤ 1.5.
  - `medium` (touch/coarse pointer or `deviceMemory` 4): DPR 1, clouds detail 5 → 3 and count −40 %,
    particles −50 %, bloom at half resolution, MSAA 2.
  - `off` (no WebGL2, `saveData`, `deviceMemory` < 4, reduced motion without opt-in): poster only.
  - Adaptive step-down kept (150 frames < 45 fps → lower DPR), fixed: MSAA samples follow DPR, dt
    clamp no longer masks < 20 fps.
- **Recompile stutter fix:** point lights stay in the scene with intensity 0 instead of toggling
  visibility (constant light count → no shader recompiles on first scroll).
- **Per-frame DOM:** stats labels and readouts update only while their chapter is active; no
  `querySelector` in the loop.
- Clouds (~80 % of triangles) are split into 4 InstancedMeshes by zone (sea, dive path, high
  background, portal); zones not visible from the current chapter's camera range are hidden.

## 5. Porting fixes (from the prototype audit)

- Everything client-only (dynamic import); no module-level `window/document` access.
- **Full dispose** on unmount: rAF cancelled, listeners removed, Lenis untouched (owned by the motion
  engine), every geometry/material/texture/render target/composer pass disposed, renderer
  `dispose()` + `forceContextLoss()`; shared resources disposed once.
- No `history.scrollRestoration`, no global `scrollTo`, no `body` class toggles, no DOM text rewriting
  (word splits done in JSX / by the motion engine).
- Fonts for canvas labels read the real `next/font` family from `--font-orbitron` / `--font-inter`.
- Thumbnails from `maps.json` `thumbnail` paths (`/images/maps/<id>.jpg`, no `/public`).
- Strip debug hooks (`window.__proto`, `?p=`, `?nointro`, `renderer.info` tweaks).
- Flower placement loop bounded.

## 6. Reduced motion & the 3D toggle

- Default: `prefers-reduced-motion: reduce` → tier `off` (poster + static site), same rule as the
  motion engine.
- `Toggle3D` in the hero ("Expérience 3D : activée / désactivée") overrides the default per visitor
  (`localStorage`, wrapped in try/catch). Turning it on loads the world immediately; off disposes it.
- With 3D on under reduced motion: camera still follows scroll (it is user-driven), but the intro
  swoop, idle bobbing speed-FOV kick and grain are disabled.

## 7. Accessibility & SEO

- All content remains HTML in DOM order; canvas `aria-hidden`; focusable `MapFocusCard` link;
  toggle is a real `button` with `aria-pressed`.
- The ring chapter keeps an HTML list of the 10 maps (visually compact, accessible) so no content
  exists only inside WebGL.
- A11y 100 includes contrast of glass panels over the brightest sky frame.

## 8. Files

**New:** `src/lib/three/island/*` (18 files above + tests for `progress`, `cameraPath`, `quality`),
`src/components/three/{IslandJourney,MapFocusCard,Toggle3D}.tsx`, `public/images/island-poster.webp`.
**Modified:** `src/app/[locale]/page.tsx` (order + `over3d` variants + `IslandJourney`),
`src/components/sections/{Hero,Opportunity,Audiences,ServicesGrid,Realisations,StatsBand,Process,WhyKaio,SectorIdeas,FaqB2B,FinalCta}.tsx` + `src/components/motion/Marquee.tsx` (`variant="over3d"` prop), `src/app/motion.css`
(glass panels, sticky chapters), `package.json` (`three@^0.170.0`, `@types/three`), docs.
**Removed from home only:** `HeroShader`, pinned gallery.

## 9. Verification

1. Unit: `progress.ts` mapping (ranges, clamping, gaps), `cameraPath.ts` (endpoints = prototype keys,
   continuity), `quality.ts` (tier table).
2. CDP e2e (motion forced on, headless Chromium with GPU): canvas live, chapter sync at 6 scroll
   points, `MapFocusCard` updates + link, pillars reveal, portal charge, toggle on/off, reduced-motion
   fallback, no-WebGL fallback, navigation away disposes (context lost, no rAF).
3. Screenshots desktop + mobile per chapter; scroll-through video.
4. Lighthouse home desktop/mobile (motion forced on) + other pages unchanged.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Mobile GPU cost (clouds) | `medium` tier, adaptive step-down, poster fallback |
| LCP moves to the poster image | ≤ 80 KB webp, `fetchpriority=high`; measure; fall back to CSS gradient poster if LCP > 2.5 s mobile |
| Text contrast over bright sky | glass panels; a11y audit on brightest frames |
| Long sections desync the camera | ranges measured from real section offsets, recomputed on resize/content change |
| Bundle size | home-only dynamic import after idle; tree-shaken addons |
