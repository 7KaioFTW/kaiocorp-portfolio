# Motion design system — spec

**Date:** 2026-09-26 · **Status:** implemented (branch `feat/motion-design`, uncommitted) — see §12 for what changed during implementation
**Decisions (user, via AskUserQuestion):** intensity = "crazy but fast" (GSAP + Lenis + hand-written
WebGL, target Lighthouse ≥95) · vibe = premium structure + gaming accents · scope = hero + homepage
scroll + maps/réalisations pages + site-wide chrome.

## 1. Goal & success criteria

Make kaiocorp.com feel like a high-end studio site (Awwwards-grade motion) with Fortnite energy,
**without giving up the performance/a11y record** that sells the studio's technical credibility.

Done when:
1. Every area below has its motion, verified by screenshots (desktop 1440 + mobile 375).
2. Lighthouse (desktop + mobile) on `/`, `/realisations`, `/maps`: **Perf ≥ 95**, **A11y 100**,
   **BP 100**, SEO unchanged, **CLS ≤ 0.02**. No console errors.
3. `prefers-reduced-motion: reduce` → all content visible and static; no Lenis, no WebGL, no
   scramble, no pinning.
4. JS failure / engine not loaded → every piece of content still visible (no CSS pre-hiding).
5. `tsc --noEmit`, `eslint src`, `npm run build` all pass.

## 2. Non-goals

- No three.js / R3F, no Framer Motion (not installed; `.claude/rules/components.md` is stale on
  this and gets updated as part of this work).
- No exit animations on route change (App Router can't do them cleanly) — enter-only transitions.
- No motion on blog article bodies, forms, or legal pages beyond the shared chrome.
- No change to copy, data, or layout structure except the Réalisations gallery variant (§5).

## 3. Architecture

### 3.1 Loading strategy (keeps the critical path untouched)

- `MotionProvider` (client, tiny) is mounted once in `app/[locale]/layout.tsx`.
- On mount: if `prefers-reduced-motion: reduce` → set `html[data-motion="reduced"]` and stop.
- Otherwise wait for `window.load` + `requestIdleCallback` (1500 ms timeout, `setTimeout` fallback),
  then `import("@/lib/motion/engine")`, which pulls **gsap, ScrollTrigger, SplitText, lenis**.
- Engine init is **chunked** (yield between preset groups) so no single task exceeds ~50 ms under
  Lighthouse's 4× CPU throttle.
- Engine adds `html.motion-ready` when running.

### 3.2 Declarative API

Server components stay server components: they only add `data-*` attributes. The engine scans the
DOM for them.

| Attribute | Effect |
|---|---|
| `data-motion="reveal"` | Fade + rise (y 32→0, expo.out 0.9 s). All reveals go through `ScrollTrigger.batch`, so grid items entering together cascade automatically (stagger 0.08). |
| `data-motion="split"` | SplitText lines+words, masked lines, words rise (yPercent 110→0, stagger 0.04). **Solid-colour text only** — never on `bg-clip-text` gradient headings (splitting breaks the clip). |
| `data-motion="decode"` | HUD scramble: letters/digits cycle through glyphs, resolve left→right (~1.1 s). Spaces/punctuation kept. Width locked to the final width (no reflow). Visible layer `aria-hidden`, final text in an `sr-only` sibling. |
| `data-motion="parallax"` + `data-speed` | Scrubbed yPercent drift. |
| `data-motion="gallery"` | Pinned horizontal scroll (desktop ≥1024 px only, via `gsap.matchMedia`). |
| `data-motion="marquee"` | Base loop is pure CSS; engine modulates speed + direction with Lenis velocity. |
| `data-motion="progress-line"` | Scrubbed `scaleX` 0→1 across its section; children with `data-step` get `.is-active` as the line passes. |
| `data-magnetic` | Pointer pulls the element (strength 0.3), elastic release. `pointer: fine` only. |
| `data-tilt` | 3D tilt (max 8°) + glare + neon border following the pointer (CSS vars `--mx/--my`). `pointer: fine` only. |
| `data-glow` | Pointer spotlight only (no tilt) — for wide rows. |
| `data-cursor="view"` | Custom cursor grows and shows `↗` over the element. |

### 3.3 Lifecycle & idempotence

- **First load:** elements already in the viewport at scan time are **not** hidden/re-animated
  (they were painted before the engine arrived — hiding them would flicker). Only elements below the
  fold get their initial state via `gsap.set`. Exception: `decode` runs on in-view elements too
  (scrambling visible text never hides it — it reads as a "boot" effect).
- **Client navigation:** `MotionProvider` watches `usePathname()`. On change: revert the previous
  page's `gsap.context`, `lenis.scrollTo(0, { immediate: true })`, rescan next frame — this time
  in-view elements **do** animate (the page transition covers the swap).
- **Dynamic content** (e.g. leaderboard filter): components dispatch `window` event
  `motion:rescan`; the scan skips nodes already marked `data-motion-ready`.

### 3.4 Lenis + ScrollTrigger wiring

`lenis.on("scroll", ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`,
`gsap.ticker.lagSmoothing(0)`, `anchors: true`. Native `html { scroll-behavior: smooth }` is disabled
while Lenis is active (`html.lenis`). Touch devices keep native scrolling (Lenis default).

## 4. Hero (homepage)

- **`HeroShader`** (client, idle-loaded, ~3 KB, raw WebGL, no library): full-bleed canvas behind the
  hero content, `aria-hidden`. Domain-warped fbm plasma in `#7B2FBE` / `#00D4FF` on `#0A0A0F`, a
  subtle grid that bends like a lens around the (lerped) mouse, slow scanline. DPR capped at 1.5;
  half resolution under 768 px. Pauses when the hero is off-screen (IntersectionObserver) or the tab
  is hidden. Fades in after its first frame. The current CSS radial gradients stay underneath as the
  fallback (WebGL missing, context lost, reduced motion).
- **Headline & subtitle are LCP candidates → painted at full opacity from frame 1.** Entrance is
  pure CSS and never hides them: rise (translateY 24→0) + deblur (8 px→0) + a one-shot RGB-split
  glitch drawn by `::before/::after` (`content: attr(data-text)`, clip-path slices, ~600 ms) +
  a single gradient light sweep across the `bg-clip-text` fill.
- Eyebrow → `decode`. Proof badges and CTAs → CSS fade-rise with staggered delays (small, not LCP
  candidates). Minutes badge value → `decode`. CTAs → `data-magnetic`.
- Grid overlay → `parallax` (slow).

## 5. Homepage scroll choreography

| Section | Motion |
|---|---|
| All `SectionHead`s | eyebrow `decode`, h2 `split`, lead `reveal` |
| Opportunity, Audiences, ServicesGrid, SectorIdeas, WhyKaio, FaqB2B | cards via `reveal` batch (existing `ScrollReveal` wrappers); cards get `data-tilt` where they are cards (Audiences, ServicesGrid) |
| StatsBand | numbers `decode` on enter; a neon scan sweeps the top border once |
| **New `Marquee`** (between StatsBand and Réalisations) | all map titles from `maps.json`, alternating filled / outline Orbitron, ✦ separators, `aria-hidden` (decorative duplicate of content). Velocity-reactive. |
| Réalisations | **pinned horizontal gallery** on desktop: section pins, card track scrubs on x, card images counter-parallax inside their frames (`containerAnimation`). Cards `data-tilt` + `data-cursor="view"`. **< 1024 px: unchanged grid.** ≥ 1024 px without the engine (reduced motion / not loaded yet): a native horizontal scroller with scroll-snap — same height as the pinned track, so the engine upgrade causes no layout shift. |
| Process | `progress-line` along the step grid; step number tiles glow as the line reaches them |
| FinalCta | giant outlined `KAIOCORP` word behind the content, scrubbed on x (brand, no translation needed); form untouched |

`ProjectGrid` gets a `variant?: "grid" | "gallery"` prop; only the homepage uses `"gallery"`, the
`/realisations`, `/activations-de-marque`, `/createurs-esport` pages keep the grid.

## 6. Maps & Réalisations pages

- `/realisations` + other `ProjectGrid` pages: cards `data-tilt` + `data-cursor="view"`, `reveal` batch.
- `PageHero` (all B2B subpages): eyebrow `decode`; gradient h1 uses the same CSS rise/deblur/glitch
  as the home hero (not `split`), proof line `reveal`.
- `/maps` leaderboard: rows `reveal` batch (existing), `data-glow` spotlight, minutes / favorites /
  peak `decode` on reveal; filter change dispatches `motion:rescan`.
- `/maps/[id]`: thumbnail slow Ken Burns (CSS, scale 1.08→1 over 12 s — transform only, LCP-safe)
  + `parallax`; stat tiles `decode`; related-map cards `data-glow`.

## 7. Site-wide chrome

- **Scroll progress bar**: fixed 2 px top bar, primary→accent gradient, `scaleX` driven by Lenis
  scroll. Default `scaleX(0)` so it is invisible without the engine.
- **Header**: hides (translateY −100%) when scrolling down past 120 px, returns on scroll up; never
  hides while the mobile menu is open or focus is inside the header. Implemented in `Header.tsx`'s
  existing scroll listener with CSS transitions (no GSAP dependency).
- **Cursor**: created by the engine (no React component), `pointer: fine` + no reduced motion only.
  Dot + trailing ring (`gsap.quickTo` lerp). Grows with `mix-blend-mode: difference` over
  links/buttons; larger with `↗` over `data-cursor="view"`. **Native cursor stays visible.**
- **Page transition**: `app/[locale]/template.tsx` (client). On client navigations only (module-level
  "has mounted" flag — never on first load, so Lighthouse never sees it): a primary→accent curtain
  wipes off (scaleY, 650 ms) while the page content rises 24 px→0. Decided in `useLayoutEffect` so
  there is no unstyled first paint.
- `Cta` primary/ghost → `data-magnetic` (replaces the `hover:-translate-y-0.5` lift, which would
  fight GSAP's inline transform).

## 8. Guardrails

**Performance**
- Lazy JS after `load`+idle: gsap ~27 KB gz + ScrollTrigger ~13 KB + SplitText ~7 KB + lenis ~5 KB
  + engine ~6 KB ≈ **58 KB gz**, plus shader ~3 KB. Initial-load JS delta: `MotionProvider` +
  `template` (< 2 KB). `ScrollReveal` stops being a client component (net saving: one
  IntersectionObserver per instance removed).
- Only `transform` and `opacity` (and `filter` for the one-shot deblur) are animated.
- `will-change` applied only during active animations.

**Accessibility**
- Reduced motion: engine and shader never load; CSS `@media (prefers-reduced-motion: reduce)`
  disables hero keyframes, marquee, Ken Burns, template curtain, header transition.
- `decode`: screen readers get the final text only. SplitText's built-in `aria` handling stays on.
- Marquee is `aria-hidden`; no keyboard trap in the pinned gallery (cards remain focusable links;
  horizontal native scroller in fallback).
- Contrast unchanged; cursor is decorative (native cursor kept).

**Security / deps**
- New deps: `gsap` (standard no-charge licence, commercial use OK since 3.13) and `lenis` (MIT) —
  verify package names/versions on npm before install (`lenis`, not the deprecated
  `@studio-freight/lenis`). CSP needs no change (no eval, WebGL is not CSP-gated).

## 9. Files

**New**
- `src/lib/motion/engine.ts` — init/destroy/scan, Lenis + ScrollTrigger wiring, chunked init
- `src/lib/motion/presets/{reveal,split,decode,parallax,gallery,marquee,progressLine,pointer,cursor,progressBar}.ts`
  — one focused preset per file
- `src/components/motion/MotionProvider.tsx` — lazy loader, route-change rescan, progress bar element
- `src/components/motion/HeroShader.tsx` — raw WebGL background
- `src/components/motion/Marquee.tsx` — server component
- `src/app/[locale]/template.tsx` — page transition

**Modified**
- `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`, `app/globals.css`
- `components/ui/{ScrollReveal,SectionHead,Cta}.tsx`
- `components/sections/{Hero,PageHero,StatsBand,Realisations,Process,FinalCta,Audiences,ServicesGrid}.tsx`
- `components/maps/{MapRow,MapLeaderboard}.tsx`, `app/[locale]/maps/[id]/page.tsx`
- `components/layout/Header.tsx`
- Docs: `.claude/rules/components.md` (Framer Motion → `data-motion` engine), `CLAUDE.md`
  tech stack line, `CACHE.md`

## 10. Verification

1. `npx tsc --noEmit` + `npx eslint src` after every task; `npm run build` at the end.
2. Browser pane: screenshots per area at 1440 and 375 wide; scroll through the homepage and confirm
   pin/gallery, marquee, progress line, decode; navigate between pages to see the transition.
3. Reduced motion: emulate via CDP `Emulation.setEmulatedMedia` (`prefers-reduced-motion: reduce`)
   on the debug Chrome → confirm static site, no canvas, no Lenis.
4. Lighthouse CLI against `npm start` via the debug Chrome on :9222 (method from the 2026-06-17
   audit) — `/`, `/realisations`, `/maps`, desktop + mobile; record scores in `reports/`.
5. Console: zero errors/warnings on all audited pages.

## 11. Risks

| Risk | Mitigation |
|---|---|
| Hero entrance delays LCP | h1/subtitle never start hidden; verify LCP breakdown in Lighthouse |
| Engine init long tasks on mobile → TBT | idle load + chunked init; split headings lazily near viewport |
| Pin spacer shifts content | gallery below the fold at init; same-height fallback; measure CLS |
| Lenis vs anchors / skip link | `anchors: true`; skip link tested with keyboard |
| SplitText on gradient text | forbidden by the API contract (§3.2); gradient headings use CSS entrance |
| Custom cursor feels laggy on low-end | `quickTo` with short duration; disabled on touch/reduced motion |

## 12. Implementation notes (2026-09-26)

Plan: `plans/2026-09-26-motion-design.md`. Deviations from §3–§9, all verified in the browser:

1. **Lenis `anchors: false`** + `stopInertiaOnNavigate: true` (§3.4): Lenis' anchor interception
   would stop the skip link from moving focus; native anchor jumps are kept.
2. **Hero** (§4): the CSS grid overlay fades out once the shader is live (the shader draws its own
   lens grid); `parallax` is on the hero **content**, not the grid. Shader renders at 0.75× CSS
   resolution on desktop (0.5× < 768 px), DPR still capped at 1.5.
3. **Glitch starts at 0 s** (§4): with a delay, Chrome reported the `::before` glitch layer as a
   *later* LCP candidate (LCP 496 ms vs FCP 228 ms in dev). Painting it in the first frame makes
   LCP == FCP.
4. **Réalisations cards link to `/maps/[id]`** (§5) via a stretched link (link name = title), so the
   `↗` "view" cursor is honest.
5. `ScrollReveal` lost its `delay` prop (§5): cascades come from `ScrollTrigger.batch` stagger.
6. `tilt` / `magnetic` **replace** the CSS hover lifts on those cards/buttons (§7) — GSAP inline
   transforms would fight CSS transform transitions.
7. Cursor and progress bar are global (`src/lib/motion/{cursor,progressBar}.ts`), not per-page presets (§9).
8. `parallax` supports `data-axis="x"` (FinalCta drift) (§3.2).
9. Pure helpers are unit-tested with **Vitest 4** (`npm test`): `geometry`, `scramble`, `velocity`,
   `header`, `stats`. (Vitest 5 needs `@types/node` ≥ 22; the project pins 20.)
10. `next.config.js`: `'unsafe-eval'` added to `script-src` **only under `next dev`** (React Refresh
    needs it; dev could not hydrate before). Production CSP unchanged.

**Measured — final build after the review fix pass (motion forced on; Roblox + OBS were running on the machine):**

| Page | Desktop P/A/BP/SEO | Mobile P/A/BP/SEO | Mobile, reduced motion (static) | CLS |
|---|---|---|---|---|
| `/` | 100 / 100 / 100 / 92* | **91** / 100 / 100 / 92* | 93 / 100 | 0 |
| `/realisations` | 100 / 100 / 100 / 92* | 96 / 100 / 100 / 92* | 96 / 100 | 0 |
| `/maps` | 100 / 100 / 96† / 92* | 97 / 100 / 100 / 92* | 97 / 100 | 0 |

Home mobile: 88–92 over 4 motion-on runs vs 86–93 for the static control under the same load (the
first, quieter-machine run scored **96**). The static page is equally degraded, so the drop is CPU
contention, not the engine — **re-audit on an idle machine / PageSpeed Insights on a preview deploy.**

* SEO 92 on localhost only (100 in prod). † one 400 from the missing `sprite-pillars.jpg` thumbnail.
A pre-existing contrast failure (ServicesGrid example text, 4.01:1) was masked by the reveal (hidden
below the fold during audits); it surfaced in the reduced-motion audit and is fixed (slate-400).

**Testing gotcha:** this machine's Windows "animation effects" are off, so Chrome reports
`prefers-reduced-motion: reduce` and the site correctly shows its static version. Audits/visual
checks must force `no-preference` (CDP `Emulation.setEmulatedMedia` / puppeteer
`page.emulateMediaFeatures`).

**Final-review fix pass (2026-09-26)** — each reproduced with a failing CDP test first, then fixed:
- `decode` locks the text's own width **only while scrambling** (released on complete); zero-size
  elements are skipped; `.motion-decode { max-width: 100% }` (no sideways scroll after resize/rotation).
- Glitch pseudo-elements use `content: attr(data-text) / ""` — screen readers hear the title once.
- Réalisations card focus ring is `ring-inset` (was clipped by the card's `overflow-hidden`).
- Engine `ResizeObserver` on `body` → debounced `ScrollTrigger.refresh()` (blog/leaderboard filters,
  FAQ `<details>`): content moved into view is revealed.
- **Native `html { scroll-behavior: smooth }` removed** (globals.css): it made hash deep links and
  reload scroll-restoration animate, and Lenis' init interrupted them mid-way. First-load `#hash`
  targets are re-aligned after the scan (pin spacer). Reload restoration is left to the browser.
- Reveal batches: items already scrolled past appear instantly; only visible ones are staggered.
- Gallery pins by its **bottom** when the section is taller than the viewport (1366×657 laptops).
- Lenis `allowNestedScroll: true` — the wheel scrolls inside the brief textarea.
- `reveal` also triggers on `focusin` (keyboard focus never lands on an invisible item).

**Minors pass (2026-09-26, after the review):** page transition now plays on every client navigation
incl. sibling routes (MotionProvider + `src/lib/motion/transition.ts`; `template.tsx` removed) ·
parallax glides into place when the engine starts mid-page · shader re-evaluates its resolution on
resize, releases its WebGL context on unmount, uses `highp` when available and wraps time hourly ·
each preset runs isolated (`safely`) · marquee pauses off-screen · StatsBand scan is a one-shot
time-based sweep (`sweep` preset, works in Firefox) · decoded text returns to a single text node after
the scramble · GSAP `lagSmoothing` restored on destroy · Header scroll delta captured before the updater.
Re-measured after the minors pass on a calmer machine (final build): home **desktop 100/100/100**,
home **mobile 97** / 100 / 100 (static control 96), CLS 0 — the ≥95 mobile target is met.
