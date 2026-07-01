# Kaio UEFN Portfolio

**Status**: 15 maps, 5 collaborators. B2B refonte (FR-first). Last updated: 2026-06-17.

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

Professional portfolio demonstrates technical skills (Next.js, TypeScript, Tailwind, Framer Motion) while showcasing creative portfolio to potential sponsors and collaborators.

## HOW

1. Develop/edit maps with Next.js 14 App Router, TypeScript strict mode, Tailwind CSS
2. Store map data in `src/data/maps.json` (single source of truth)
3. Use agents for code review (Sonnet) and performance audit (Haiku)
4. Build and deploy to Vercel with zero ESLint errors and Lighthouse > 90
5. Test locally: `npm run dev` -> `npm run build` -> `npm run lint`

## Tech Stack & Commands
- Next.js 14 (App Router), TypeScript (strict mode), Tailwind CSS, Framer Motion
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
- Map data: `src/data/maps.json` (single source of truth, 15 entries)
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
  data/          # maps.json (15 entries), creator.json
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
- Disabled maps (rift-racers-alpine, 7r-1v1-ranked, piano-1v1, fast-realistic-ranked-2v2) have `"disabled": true`.
  This is an **internal flag only — intentionally NOT reflected on the site** (product decision): disabled maps
  are shown as live everywhere (leaderboard, detail page, sitemap, réalisations). Do not "fix" the display.
- Mounted-disk writes do not truncate: rewriting a file shorter leaves residual bytes — rewrite via
  bash heredoc and re-verify (this file was rebuilt that way)
- FR apostrophes in raw JSX -> ESLint `react/no-unescaped-entities`: use `’` (U+2019)
- `npm run build` / `next dev` may not finish in a slow sandbox — verify via `tsc` + `eslint`
