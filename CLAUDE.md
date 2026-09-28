# Kaio UEFN Portfolio

**Status**: 16 maps, 5 collaborators. B2B refonte (FR-first) + motion design system + 3D homepage
(uncommitted). Last updated: 2026-09-28.

## Agent rules (Claude Rulebook)

This project follows the **Claude Rulebook** — read it first: [`docs/RULEBOOK.md`](docs/RULEBOOK.md)
(full PDF: `docs/Claude_Rulebook_Thariq_v2.pdf`). Key directives applied here:

- **Read `CACHE.md` first, update it last** (R5.4) — current state, last actions, open questions.
- **Never end a turn on an unverified mutation** (R1.2): run `npx tsc --noEmit` + `npx eslint src`;
  for UI work, render/screenshot — not a description (R1.5/R5.8).
- **Failed twice -> rewind, don't patch** (R1.3). Prefer machine feedback over text self-review (R1.4).
- **Single source of truth**: `src/data/maps.json` + `src/data/creator.json`. The total-minutes figure
  is **computed** in `src/lib/stats.ts` (`TOTAL_MINUTES_LABEL`) — never hardcode it.
- **Ask before non-trivial work** via `AskUserQuestion`, not free-text (R4.4).
- **HTML for substantial artifacts** humans must read; markdown for short diff-reviewed content (R10.x).

## WHAT

Next.js portfolio showcasing Kaio's Fortnite UEFN maps and creative work. Full-stack web app with internationalization (i18n), map database, and performance optimizations.

## WHY

Professional portfolio demonstrates technical skills (Next.js, TypeScript, Tailwind, GSAP/WebGL motion) while showcasing creative portfolio to potential sponsors and collaborators.

## HOW

1. Develop/edit maps with Next.js 14 App Router, TypeScript strict mode, Tailwind CSS
2. Store map data in `src/data/maps.json` (single source of truth)
3. Use agents for code review (Sonnet) and performance audit (Haiku)
4. Build and deploy to Vercel with zero ESLint errors and Lighthouse > 90
5. Test locally: `npm run dev` -> `npm run build` -> `npm run lint`

## Tech Stack & Commands
- Next.js 14 (App Router), TypeScript (strict mode), Tailwind CSS
- Motion: GSAP (ScrollTrigger, SplitText) + Lenis via the `data-motion` engine in `src/lib/motion`
  (lazy-loaded after load+idle), CSS in `src/app/motion.css`
- 3D homepage: three.js 0.170 (vanilla, no R3F) — `src/lib/three/island` (world + scene modules, pure helpers
  unit-tested), `src/components/three` (IslandJourney / Toggle3D / MapFocusCard); loaded after load+idle via
  `afterLoadIdle`, home only
- Tests: Vitest (`npm test`) for pure helpers
- Internationalization: next-intl (defaultLocale `fr`)
- Image optimization: sharp, Next.js Image

## Commands
```
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint + Prettier check
npm run start     # Serve production build
```

## Data & Architecture
- Map data: `src/data/maps.json` (single source of truth, 16 entries)
- Creator profile: `src/data/creator.json`
- TypeScript interfaces: `src/types/index.ts`
- Total minutes: computed in `src/lib/stats.ts` (`TOTAL_MINUTES_LABEL`), never hardcoded

### Repo layout (Rulebook R5.2 — folder naming is context engineering)
```
CACHE.md      # current state — read first, update last (R5.4)
docs/         # durable references (Claude Rulebook, RULEBOOK.md digest)
specs/        # specs / contracts (refonte-kaiocorp.md)
plans/        # implementation plans
reports/      # audits & syntheses (prefer HTML for long ones)
playground/   # disposable HTML prototypes (prototype-homepage.html)
src/          # Next.js app (see tree below)
```

```
src/
  app/
    [locale]/              # i18n routes: activations-de-marque, agences,
                           #   createurs-esport, realisations, services, contact,
                           #   maps, blog, about
    layout.tsx             # Root layout
    globals.css            # Global styles
    robots.ts, sitemap.ts  # SEO
  components/
    layout/      # Header, Footer
    sections/    # Hero, Opportunity, Audiences, ServicesGrid, StatsBand,
                 #   Realisations, Process, WhyKaio, SectorIdeas, FaqB2B, FinalCta, PageHero
    ui/          # Cta, SectionHead, ScrollReveal, CountUp, JsonLd, ...
    forms/       # BriefForm (formsubmit.co -> contact@kaiocorp.com)
    maps/        # MapRow, MapLeaderboard
  content/       # site.ts (B2B copy), realisations.ts (derived from maps.json)
  data/          # maps.json (16 entries), creator.json
  lib/           # cn(), stats.ts (TOTAL_MINUTES_LABEL), track.ts, seo.ts, utils.ts
  i18n/          # routing.ts (defaultLocale fr), request.ts
  messages/      # 13 locale JSON files
  types/         # FortniteMap, Creator, MapStats interfaces
public/images/   # Map thumbnails (filename matches map id)
```

## Conventions
- One component per file, named exports
- Use `cn()` from `src/lib/utils.ts` for conditional classNames
- B2B content is **French-first** (defaultLocale `fr`); EN + other locales kept via next-intl
- Optimize images with Next.js `<Image>`
- Components are functional with hooks, no class components
- Every mutation ends with `npx tsc --noEmit` + `npx eslint src` (Rulebook R1.2 / R5.7)

## Design System
- Dark theme: `surface-dark: #0A0A0F`, `surface: #12121A`, `surface-light: #1A1A2E`
- Primary: `#7B2FBE` (purple), Accent: `#00D4FF` (cyan)
- Fonts: Orbitron (headings), Inter (body)
- Animations: scroll reveals (ScrollReveal), hover effects on cards

## Deployment & Environment
- **Hosting**: Vercel (or self-hosted via `npm run start`)
- **Environment variables**: None required for MVP (all data in JSON)
- **Build**: Must pass `npm run build` with zero errors
- **Performance**: Lighthouse target > 90 on all metrics

## Security
- Never hardcode API keys, Discord tokens, or credentials in src/
- `.env.local` (if needed) is git-ignored — use Vercel secrets for production
- See `.claude/rules/security.md` for full security rules

## Gotchas
- TypeScript strict mode: no unused imports, no `any`
- Map thumbnails go in `public/images/maps/` — filename matches map `id`
- Sprite Pillars leads everywhere (product decision): first entry of `maps.json`, `"pinned": true` (pinned at the
  top of the /maps leaderboard via `leaderboardOrder()` in `src/lib/utils.ts`), first in `FEATURED` and `RING`
  (`src/content/realisations.ts`). Totals quoted in blog posts use `formatBillions()` — never hardcode them.
- Disabled maps (rift-racers-alpine, 7r-1v1-ranked, piano-1v1, fast-realistic-ranked-2v2) have `"disabled": true`.
  This is an **internal flag only — intentionally NOT reflected on the site** (product decision): disabled maps
  are shown as live everywhere (leaderboard, detail page, sitemap, réalisations). Do not "fix" the display.
- Mounted-disk writes do not truncate: rewriting a file shorter leaves residual bytes — rewrite via
  bash heredoc and re-verify (this file was rebuilt that way)
- FR apostrophes in raw JSX -> ESLint `react/no-unescaped-entities`: use `’` (U+2019)
- `npm run build` / `next dev` may not finish in a slow sandbox — verify via `tsc` + `eslint`
- **Motion** (spec `specs/2026-09-26-motion-design.md`): reduced motion = engine never loads (static site).
  The **3D homepage is on by default, reduced motion included** (2026-09-28, user decision): under reduced
  motion it follows the scroll only (no intro swoop, idle motion or grain); only Save-Data / < 4 GB / no GPU
  fall back to the poster without an explicit choice. `selectTier()` and the inline boot script must agree
  (boot.test.ts). This PC's Windows animation effects are OFF → Chrome reports `prefers-reduced-motion: reduce`,
  so the GSAP motion looks static here and the 3D runs in its reduced form. For visual checks / Lighthouse, force `no-preference` via CDP
  (`Emulation.setEmulatedMedia`) or puppeteer `page.emulateMediaFeatures`.
- `next dev` needs `'unsafe-eval'` (React Refresh) — added to CSP for development only in `next.config.js`.
- **3D homepage** (spec `specs/2026-09-27-3d-island-homepage.md`, §11 for the implementation notes):
  - Never import `three` or `@/lib/three/island/world` statically. `IslandJourney` is the only entry, through
    a dynamic import. Nothing in the repo enforces this: the `bundle-check.mjs` script that checked it lives
    in the session scratchpad, not in the repo; its full text is in `plans/2026-09-27-3d-island-homepage.md`
    (Task 6, Step 14): re-create it from there and run it after `npm run build`.
  - **Testing tools are NOT in the repo.** The CDP e2e suite (`cdp.mjs`, `island/lib.mjs`, `t5-*` … `t14-*`,
    `tf-*`), the Lighthouse runner `lh/lh-run.mjs` and `strip-proxy.mjs` live only in the session scratchpad
    (`%TEMP%\claude\…\scratchpad\island-tools`, a temp dir that can be cleaned). The plan reproduces
    `cdp.mjs` (Appendix A), `lib.mjs`, `lh-run.mjs` (Task 13) and the first version of each task’s e2e
    script (`t5-static` … `t11-stats-portal`); later fix-round edits, `t11-gates-exact.sh`, the
    `t13-*`/`tf-*` scripts and `strip-proxy.mjs` are not reproduced anywhere.
  - `html[data-island]` = `pending | loading | live | off`, set pre-paint by the inline boot script in
    `app/[locale]/page.tsx` (+ `suppressHydrationWarning` on `<html>`). The sticky ring/stats chapters exist
    only while it is not `off`.
  - The 3D layer is `position: fixed; z-index: -1`, so do not give `<html>` a background.
  - A slow-GPU give-up, a lost WebGL context (also mid-build) or an OS reduced-motion flip switches `off` (or
    back on) mid-page; `IslandJourney` then keeps the reader in the same section (`window.scrollTo` + the motion
    engine's `motion:scroll-to` event, so Lenis jumps too). Any new sticky/height change tied to `data-island`
    must keep that working (`tf-giveup-anchor`, `tf-rm-anchor` e2e). The shader-compile wait is bounded
    (`compilePrograms` in `world.ts`, 10 s) — don't go back to three's unbounded `compileAsync`.
  - The toggle choice is `localStorage["kc-island-3d"]` = `on | off`.
  - Regenerate the poster (`public/images/island-poster.webp`) with the Task 12 script
    (`plans/2026-09-27-3d-island-homepage.md`) after any visual change to the hero frame.
  - The homepage's `Hero`, `Audiences`, `Realisations`, `StatsBand`, `WhyKaio` and `Marquee` are always
    rendered `over3d` (their old default/non-3D branches were dead code, removed in Task 14) — the other six
    sections (`Opportunity`, `ServicesGrid`, `Process`, `SectorIdeas`, `FaqB2B`, `FinalCta`) still support both
    variants because other pages render their `default` form.
  - Lighthouse on Playwright Chromium 147 crashes the renderer on any response carrying `Referrer-Policy` —
    run it through a header-stripping proxy (`strip-proxy.mjs` in the session scratchpad, not in the repo:
    a small `node:http` proxy on :3200 → :3000 that drops only `referrer-policy`); the header itself is
    correct and stays.
  - `chrome-headless-shell` has no GPU, so the island stays "off" and Lighthouse there scores the poster
    only — use Playwright `chrome.exe --headless=new --ignore-gpu-blocklist` (real GPU) instead.
  - On this PC, Chrome stable is locked by registry policy to `C:\ChromeProfile`, and
    `launch_chrome_debug.bat` kills every Chrome window.
  - Screen recording needs `--window-size=1456,1052` for a clean 1440×900 capture.
