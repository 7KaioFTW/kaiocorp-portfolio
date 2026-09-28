# 3D "Floating Island" homepage — spec

**Date:** 2026-09-27 · **Status:** implemented (branch feat/motion-design, uncommitted) — see §11
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

## 11. Implementation notes (2026-09-28)

Built across Tasks 1–14 on `feat/motion-design`, uncommitted (see §11(e) hand-off decision on commit
strategy). Task 14 also removed the homepage code the 3D version made dead (`HeroShader`,
`src/lib/motion/shader.ts(+test)`, the `gallery` motion preset, and the `default`/`gallery` branches of
the six home-only components) — see CACHE.md "Revue finale" for the cleanup evidence.

### (a) Rulings

**Plan rulings 1–18** (verbatim from the plan):

1. Canvas layer uses z-index −1, not 0. A fixed layer there paints above the propagated `<html>` background
   and below every in-flow section and the footer, with no shared-layout change; z-index 0 would cover the
   non-positioned footer.
2. Poster location: the Hero's background image (`next/image`, `priority`), fades out on the first 3D frame,
   stays for the static fallback. Over3d sections are always transparent with glass panels; "those remain for
   the fallback" = the components' **default** variants keep their gradients, HeroShader and the gallery —
   later superseded on the homepage and removed in Task 14 (see (b) below and R14-4).
3. The 10 ring maps are the fixed `RING_MAPS` list in `src/content/realisations.ts` (prototype's 10, prototype
   order), fields from `maps.json`; `boxfight-2v2-ranked` uses `BOXFIGHT` (no "Ranked" data tag);
   `sprite-pillars` excluded (missing thumbnail).
4. Pillar heights: the prototype's fixed descending heights 8.6/7.0/5.8/4.8 are kept (data units are
   incompatible, so data-proportional heights would be meaningless). Settled by the user (R14-2): kept fixed.
5. Stats labels sit under the pillars as a glass grid (not projected onto pillar tips every frame).
6. Prototype chrome (loader, chapter rail, progress bar, ALT/CAP readout, scroll hint, scrims) is not ported;
   the site header, motion progress bar and glass panels replace it.
7. Toggle "on" overrides reduced motion / saveData / deviceMemory < 4 (tier `medium` on constrained devices);
   it never overrides missing WebGL2. Software-only GL counts as "no WebGL" unless opted in.
8. Adaptive step-down ladder: DPR 1.5 → 1 → 0.85, MSAA capped at 2 once stepping then to 0; below 20 fps at
   the floor it gives up to the poster. Measured over 150 unclamped frames after a 30-frame warm-up.
9. Cloud zones: 4 InstancedMeshes with computed bounding spheres + frustum culling; background/portal
   p-gated, medium tier −40 % on sea/background/portal; the 8 camera-path clusters never thinned.
   **Overridden by measurement in Task 9** — see (b).
10. Reduced motion with 3D opted in: intro swoop, speed-FOV kick, chromatic-aberration kick and grain are off;
    idle bob amplitude 0. Pointer parallax stays (user-driven).
11. Count-up accessibility: visible layer `aria-hidden`, final value in an `sr-only` sibling.
12. New i18n keys `b2b.island.{toggle,on,off,ringList}` in the 4 routed locales only.
13. Helper modules beyond the spec's 18: `math`, `chapters`, `types`, `dispose`, `geometry`, `store`, `boot`,
    `countUp`, plus `src/components/ui/Glass.tsx`.
14. Thumbnails no longer block the first frame; screens stay dark until their image arrives.
15. A dev-only `window.__island` handle (`stats`, `anchors`, `scrollFor(p)`), stripped from production by
    `NODE_ENV`.
16. `<html suppressHydrationWarning>` added in `app/[locale]/layout.tsx` (the boot script sets `data-island`
    before hydration).
17. Home Hero is full height (`min-h-[100svh]`); over3d tagline/FinalCta note use slate-400 (later remedied
    to slate-300, see (b) D1); FinalCta over3d drops the outlined KAIOCORP drift.
18. "Turning it on loads the world immediately" goes through the same `afterLoadIdle` (next idle period,
    ≤ 1.5 s timeout).

**Controller rulings** (from `progress.md`, grouped by task):

- **Setup:** no per-task commits (plan Global Constraints + harness rule); per-task BASE/HEAD are index
  snapshots, review packages are `git diff` between tree hashes. Pre-flight scan delegated to a fresh agent
  (plan is 6.7k lines).
- **Task 3:** `selectTier()` with pref `'on'` downgrades saveData/deviceMemory<4 to `'medium'` (explicit
  opt-in beats heuristics; never overrides missing WebGL2).
- **Task 5:** over3d StatsBand numbers use `text-2xl sm:text-3xl md:text-4xl xl:text-5xl` ("3 marques" clipped
  at 1024/390 with the brief's sizes) — readability outranks verbatim brief sizes.
- **Pre-flight ruling B1** (carried into Task 6): the `ResizeObserver` that re-measures sections must also
  observe every `.island-stage`, not only `main` — cost if wrong: one extra observer.
- **Pre-flight ruling S3** (carried into Task 6): `IslandJourney` reads `islandStore.get().pref` inside its
  boot effect, so returning visitors get no default-pref flash.
- **Task 6:** `createPost(…, bag)` registers RT/passes/composer in the `DisposeBag`; `Post.dispose` removed.
- **Pre-flight ruling S2** (carried into Task 7): `Toggle3D` reflects the *effective* state (3D running or
  not) — clicking while not running always (re)starts the world unless WebGL2 is missing, even if the
  stored pref is already `"on"`; an e2e covers pref `"on"` + world gave up.
- **Task 7:** no GPU probe on 3D-off visits (a no-WebGL2 device may show the toggle until pressed, then it
  hides); `cdp.mjs` allowlists the known `sprite-pillars.jpg` 400 until the thumbnail exists; SwiftShader
  deprecation warning on GPU-less machines accepted.
- **Task 8:** `t6-live` flake was a test defect (wait-until-still without a target check) → e2e wait now
  requires `|p−target| < 0.01`.
- **Task 9 (overridden zone ranges):** accepted the implementer's override of the cloud zone ranges —
  background hidden only 0.25–0.33 & 0.66–0.75 (was `p<0.25||p>0.8`); portal zone hidden only 0.25–0.38 (was
  `p>0.55`); the 0.8 gate also moved to 0.75. Evidence: the old gates popped (0.9 % px on portrait at 0.8) and
  hid portal clouds that are visible in the hero (4–5 % of frame); the new gates change 0 px at every tested
  viewport. Clouds are 91–99 % of high-tier triangles (spec estimated ~80 %) — accepted, Lighthouse is the
  real gate. The brief's gate script false-failed at 0.55/0.8 (camera acceleration, not a pop) → replaced by
  the frozen-time `t9-zones.mjs`.
- **Task 10:** `world.ts` compiles into a 1×1 render target (programs 45→32, 0 compiles on ring entry, was
  78–83 ms/frame); `mapRing` uses a blank initial label texture + incremental GPU uploads (first ring frame
  47–89 ms → ~6 ms); the brief's resize check used `innerWidth` (incl. scrollbar) → fixed to `clientWidth`.
  Carried to Task 11: under reduced motion with 3D opted in, freeze the ambient shader clock (water/clouds/
  fireflies/grain) so the scene moves only with scroll. Mobile ring layout = option A (compact heading top,
  bottom band = focus card + horizontal scroll-snap chip row). Glass panels made slightly more opaque than
  the spec's 0.72 on desktop to reach contrast AA (≥ 5.43:1).
- **Task 11:** accepted the exact per-gate test's gate changes — ring appear 0.17→0.075 (phones only), stats
  0.5→0.34 (all sizes); portrait stats chapter fades the ring out (≈ p 0.556→0.60) instead of a hard cut at
  0.7 (the hard cut covered the pillars 0.59–0.70 on phones, then popped); accepted the dithered fade tail
  (< 25 % opacity) and the exact pillar-reveal draw (throttled value only feeds the count-up); fps checks
  deferred to Task 13 (headless runs uncapped ~360 fps); aspect-band checks (0.9–1.0 and 1.0–1.3) carried to
  Task 13; scratch-script edits stay outside the review package. Accepted small additions (portal-charge
  readback in dev stats; idle spins scaled to 0 under reduced motion). Accepted the forced on/off comparison
  at the same `p` (100/100) in place of the brief's `t9-gates.mjs` Step 7 check, which assumed the old gate
  values 0.17/0.5 — the gate changes are ledgered and the swap compares like with like.
- **Task 12:** Lighthouse on this machine runs through `strip-proxy.mjs` (a session-scratchpad script, not in
  the repo — see (e); :3200 → :3000, drops only
  `referrer-policy`, which Lighthouse doesn't audit); Step 4 passes in intent (the poster is not the LCP
  element; LCP 2.6 s is the pre-existing hero-text paint).
- **Task 13:** accepted D1 (contrast) as one scoped CSS rule instead of ~20 per-component edits; accepted
  `t13-contrast-v3.mjs` (+`-split`) as the contrast evidence over the brief's `contrast.mjs` (4 sampling
  defects, documented); accepted home mobile P median 79 vs the plan's ≥ 80 (the user's decision is
  "mobile ~80–90 accepted"; 78–81 across 5 runs straddles 80, machine-load skew measured; the prescribed
  builder split was proven ineffective — one `makeIsland` call is 86 % of the task). F1 (chunk `makeIsland`,
  spread the first-frame upload, or yield after the three.js chunk eval) stays open for the user (§11(e)).
- **Task 14 (this task):** homepage-only default variants (Hero, Audiences, Realisations, StatsBand, WhyKaio,
  Marquee defaults), `HeroShader`, `src/lib/motion/shader.ts` (+test) and the `gallery` preset were dead code
  once home is always 3D → removed (project rule: no dead code; git history `d1db62c` holds all of it).
  Git: no commits this task; diff vs `d1db62c` via index snapshot; pillar-heights decision already settled;
  the stale CACHE.md "toujours non commitée" line is fixed (the motion work is committed in `d1db62c` — only
  this 3D feature's files remain uncommitted).
- **Final review fix wave** (review: "ready with fixes", 0 Critical, 2 Important):
  - **I1** — a give-up mid-page must not throw the reader: stop rendering at once, switch to "off" with the
    reader anchored to the section under the viewport top (measured before, compensated after the collapse);
    fallback if anchoring proved unreliable: defer "off" until the reader is above the ring chapter (not
    needed — anchoring held in every e2e case, including a Lenis smooth scroll in flight).
  - **I2** — `webglcontextlost` runs the same give-up path (poster, status "off", toggle off; the toggle restarts
    a fresh canvas); no restore attempt; `dispose` skips `forceContextLoss()` on an already-lost context.
  - **F1** — chunk `makeIsland` with byte-identical output (geometry-hash unit test); re-measure mobile
    Lighthouse 3× through the proxy.
  - **Minors fixed**: the toggle's accessible name is constant, "Expérience 3D" (the "activée / désactivée"
    words and the label's trailing colon are `aria-hidden`, `aria-pressed` alone carries the state); the docs
    say where the testing tools live (see (e)).
  - **Residual fixes** (scoped re-review): (b) an OS `prefers-reduced-motion` flip mid-page gets the same
    section anchoring (in the media `change` listener, both directions) — it closes the Review Focus 5 "OS
    change mid-visit" gap; (a) a context lost during the build ends in the give-up path, never "live": the
    shader-compile wait is bounded (`compilePrograms`: stops on context loss, abort/dispose, or after 10 s —
    three's `compileAsync` polls every 10 ms with no exit), and the build stops at the first lost-context check.
    **Parked**: one black frame per resize step; the hero dips dark for ~1 s when the 3D is turned off.

### (b) Deviations found during execution

- **Task 9 — cloud zone gate ranges widened** (see ruling above): background hidden only in
  `[0.25, 0.33] ∪ [0.66, 0.75]`; portal hidden only in `[0.25, 0.38]`.
- **Task 11 — culling gates widened**: ring appear gate `0.17 → 0.075` (phones only, ≥ 0.01 margin — no wider
  window exists); stats gate `0.5 → 0.34` (all sizes, ≥ 0.04 margin).
- **Task 11 fix round 1 — portrait ring fade**: replaced the hard cut of the map ring at `p 0.7` with a smooth
  fade `0.556 → 0.6` on portrait aspects (`ringFade()` in `chapters.ts`), plus a dithered coverage tail below
  25 % opacity and an exact (non-throttled) pillar-reveal draw value, to remove a 99.5 %-of-frame pop on
  phones.
- **Task 13 — contrast remedy rung 1**: `src/app/motion.css` — `.island-glass .text-slate-400 { color: rgb(203
  213 225); }` (glass-panel secondary text slate-400 → slate-300; slate-400 measured 3.4–4.3:1 over the
  brightest frames behind the panels, slate-300 ≥ 5.8:1). Worst ratio after: **4.90:1** (desktop, the 14
  brief checkpoints). Rung 2 (glass alpha 0.72 → 0.8) was simulated but **not applied** (not needed).
- **Task 13 fix round 1 — mobile ring-panel contrast, separately verified**: the below-`lg` ring/focus-card
  glass units (heading, chips, active chip, CTA, focus card — not covered by the desktop-oriented 4.90:1
  measurement above) were measured on their own with `t13-contrast-ring-mobile.mjs`: worst **7.22:1** at
  390×844 (the active chip's number), **6.61:1** at 360×740 — both ≥ 4.5:1, 0 FAIL, no remedy needed.
  (`task-13-report.md` "Fix round 1", Item 1.)
- **Task 13 — blur removal not applied**: `backdrop-filter: blur(12px)` kept; measured fps 358–359 with the
  blur in view (desktop, prod), well above the 55 fps floor.
- **Task 12 — poster `object-position`**: `src/components/sections/Hero.tsx`'s poster `<Image>` gets
  `object-[62%_50%]` so the island stays framed behind the glass panel at 390 px (default `object-cover`
  cropped the right-hand satellite island and the waterfall edge).
- **Task 13 — no `yieldToMain()` split added**: V8 profiling showed the prescribed split (kit | island probe)
  removes at most ~7 ms (×4 simulated) / ~2 ms real time from a 408 ms simulated task — far below run-to-run
  TBT noise (630–770 ms). Left open as finding F1 — done in the final fix wave by chunking inside
  `makeIsland` instead (see the last deviation below).
- **Home mobile Lighthouse P**: median **79** against the plan's "≥ 80 budget", accepted as within the user's
  "mobile ~80–90 accepted" decision (5 runs span 78–81, with Roblox + OBS running — a known 5–8 pt skew).
  Superseded by the final fix wave: **84** after F1 (see (c)).
- **Task 14 (this task) — dead-code cleanup**: removed the `variant`/default branches of `Hero`, `Audiences`,
  `Realisations`, `StatsBand`, `WhyKaio` and `Marquee` (home-only, always `over3d`); deleted `HeroShader.tsx`,
  `src/lib/motion/shader.ts` (+ test), `src/lib/motion/presets/gallery.ts`; removed `ProjectGrid`'s `gallery`
  variant (kept the `grid` behaviour, and the other six sections' default variants, byte-for-byte unchanged);
  removed the now-dead `.motion-shader`/`.hero-grid` rules from `motion.css`. The `island-over3d` class was
  **kept** — it is queried by the e2e script `$S/island/t5-others.mjs` (session scratchpad, not in the repo —
  see (e); it counts `.island-over3d` elements), even though no CSS selector styles it.
- **Final review fix wave — reading position kept by app code**: when the 3D gives up mid-page (slow GPU, or a
  lost WebGL context), `IslandJourney` stops rendering, commits the "off" state synchronously (`flushSync`),
  then scrolls so the section under the viewport top keeps its offset (`window.scrollTo`, whole pixels rounded
  up). This departs from §5 / the global constraint "no global `scrollTo` from app code" — ruled by the
  controller (I1). Lenis would write a stale position back during a smooth wheel scroll, so the motion engine
  gained one listener, `motion:scroll-to` (detail `{ top }`) → `lenis.scrollTo(top, { immediate: true, force:
  true })`; Lenis stays owned by the engine.
- **Final review fix wave — `makeIsland` in steps (F1)**: the island generator is a generator function that
  yields after the base mesh, every 8 190 vertices of its two loops and after the normals; `makeIsland()`
  drains it at once (satellites, pillar rocks, probe), the main island drains it with `yieldToMain()` between
  steps (the world's builder loop now awaits an async builder). Same work in the same order: the geometry is
  byte-identical (sha256 of every attribute recorded before the change, `terrain.test.ts`).

### (c) Lighthouse (Task 13 Step 5, through `strip-proxy.mjs` :3200 → :3000 — scratchpad tool, see (e))

| Page × form factor | P | A | BP | SEO | LCP | TBT | CLS | island |
|---|---|---|---|---|---|---|---|---|
| home desktop | **100** | 100 | 100 | 92 | 0.6 s | 30 ms | 0 | live |
| home mobile (median of 3) | **79** | 100 | 100 | 92 | 2.6 s | 740 ms | 0 | live |
| home mobile, reduced motion | 96 | 100 | 100 | 92 | 2.6 s | 120 ms | 0 | off |
| /realisations mobile | 97 | 100 | 100 | 92 | 2.6 s | 10 ms | 0 | n/a |
| /services mobile | 99 | 100 | 100 | 92 | 2.0 s | 10 ms | 0 | n/a |
| /maps mobile | 98 | 100 | 100 | 92 | 2.5 s | 20 ms | 0 | n/a |
| /maps desktop | 100 | 100 | 96 | 92 | 0.5 s | 0 ms | 0 | n/a |
| home mobile, 3D forced on (extra) | 81 | 100 | 100 | 92 | 2.3 s | 700 ms | 0 | live |
| home mobile, on `chrome-headless-shell` (extra, no GPU) | 97 | 100 | 100 | 92 | — | 70 ms | 0 | **off** (poster-only score) |
| **home mobile after F1** (final fix wave, median of 3 after a warm-up run) | **84** | 100 | 100 | 92 | 2.6 s | 520 ms | 0 | live |
| home mobile before F1, same session and setup (median of 3 after a warm-up run) | 78 | 100 | 100 | 92 | 2.6 s | 860 ms | 0 | live |
| home desktop after F1 (1 run) | 100 | 100 | 100 | 92 | 0.6 s | 0 ms | 0 | live |

Home desktop P100 and every A11y/BP/CLS target pass. Home mobile median 79 (Task 13) was 1 point under the
plan's ≥ 80 line; after F1 (final fix wave) it is **84** (5 runs 83–85): the ~410 ms simulated `makeIsland`
long task is gone from every run. SEO 92 and /maps BP 96 are pre-existing localhost/sprite-pillars artefacts.

### (d) Bundle size and fps

- **three.js total: 130.5 KB gz** (below the spec's ≈ 200 KB target and the 260 KB alarm). Whole lazily
  loaded 3D payload ≈ **158.8 KB gz** (three 130.5, world chunk 19.0, post-processing 7.5, shader chunk 1.8).
  The only initial (non-lazy) chunk touching the island is 4.6 KB gz (store + toggle, no `WebGLRenderer`).
- **fps per chapter** (headless Chromium, RTX 4080 SUPER, uncapped ~360 Hz — a lower bound, not a display
  rate):

  | View | hero (p0) | services (p0.2) | ring (p0.4) | stats (p0.7) | portal (p1) |
  |---|---|---|---|---|---|
  | desktop 1440×900, CPU ×1 | 359 | 358 | 359 | 360 | 360 |
  | mobile 390×844, CPU ×1 | 359 | 359 | 359 | 359 | 359 |
  | mobile 390×844, CPU ×4 (throttled record) | 333 | — | 358 | 338 | — |

  Blur in view (desktop, prod): #services 358 fps, #faq 359 fps, #contact 358 fps — no blur removal needed.

### (e) Testing gotchas

- **The verification tools are not in the repo.** Every e2e script cited here and in the plan (`$S/island/*.mjs`:
  `lib.mjs`, `t5-*` … `t14-*`, the final-wave `tf-*`), `bundle-check.mjs` (three never in the homepage's initial
  chunks), `cdp.mjs`, `lh/lh-run.mjs` and `lh/strip-proxy.mjs` live in the session scratchpad
  (`%TEMP%\claude\…\scratchpad\island-tools`), a temp directory that can be cleaned. Nothing in the repo runs
  them or enforces what they checked. The plan gives `bundle-check.mjs` in full (Task 6, Step 14), plus `cdp.mjs`
  (Appendix A), `lib.mjs`, `lh-run.mjs` and the first version of each task's e2e script; `strip-proxy.mjs`, the
  fix-round edits and the `t11-gates-exact`/`t13-*`/`tf-*` scripts exist only in the scratchpad.
- This machine reports `prefers-reduced-motion: reduce` natively (Windows animation effects off) — every
  motion/3D check must emulate `"no-preference"` via CDP (`Emulation.setEmulatedMedia`) or Puppeteer
  `page.emulateMediaFeatures`.
- The functional e2e (chapter sync, toggle, dispose, culling gates) needs the **dev server** — it reads the
  dev-only `window.__island` handle (stripped from production).
- Lighthouse, the scroll-through video and the poster capture need the **prod server** (`npm run build &&
  npm start`); `next dev` and `next build`/`next start` must never run at the same time.
- Lighthouse on Playwright Chromium 147 crashes on any response carrying `Referrer-Policy` — run it through a
  header-stripping proxy (the header itself is correct; keep it). `chrome-headless-shell` has no GPU (its
  software GL is refused by `IslandJourney`'s default `failIfMajorPerformanceCaveat`), so Lighthouse there
  scores the **poster only** — always audit with `chrome.exe --headless=new --ignore-gpu-blocklist` (real
  GPU) instead. Screen recording needs `--window-size=1456,1052` for a clean 1440×900 capture.
- **User decisions (2026-09-28):**
  1. Poster → live handoff: **hard cut, then the intro swoop** (no double exposure). Going `live` sets
     `transition: none` on the canvas and the poster; leaving live keeps the fades.
  2. ~~Mobile perf finding F1~~ — resolved in the final fix wave: `makeIsland` chunked, home mobile P 84.
  3. Integration: commit on `feat/motion-design`, push, Pull Request to `master` (Vercel preview first).
