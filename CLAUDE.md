# Kaio UEFN Portfolio

## Commands
```
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint + Prettier check
npm run start     # Serve production build
```

## Architecture
- Next.js 14 (App Router), TypeScript strict, Tailwind CSS, Framer Motion
- All map data centralized in `src/data/maps.json` — never hardcode stats
- Creator profile in `src/data/creator.json`
- TypeScript interfaces in `src/types/index.ts`

```
src/
  components/
    layout/      # Header, Footer, Navigation
    sections/    # Hero, About, Portfolio, Stats, Contact
    ui/          # Buttons, Cards, Badges, Modal
    maps/        # MapCard, MapDetail, MapGrid, StatsDisplay
  data/          # maps.json, creator.json
  hooks/         # useInView, useCounter, useFilter
  lib/           # cn(), formatNumber(), parseStatNumber()
  styles/        # Global CSS
  types/         # FortniteMap, Creator, MapStats interfaces
  assets/images/ # Map thumbnails
```

## Conventions
- One component per file, named exports
- Use `cn()` from `src/lib/utils.ts` for conditional classNames
- All text in English (international audience)
- Optimize images with Next.js `<Image>`
- Components are functional with hooks, no class components

## Design System
- Dark theme: `surface-dark: #0A0A0F`, `surface: #12121A`, `surface-light: #1A1A2E`
- Primary: `#7B2FBE` (purple), Accent: `#00D4FF` (cyan)
- Fonts: Orbitron (headings), Inter (body)
- Animations: scroll reveals via Framer Motion, hover effects on cards

## Watch Out For
- TypeScript strict mode: no unused imports, no `any`
- Map thumbnails go in `src/assets/images/maps/` — filename matches map `id`
- Lighthouse target > 90 on all metrics
- `disabled` maps (like Rift Racers) should show a "disabled" badge
