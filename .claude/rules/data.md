---
paths:
  - "src/data/**/*.json"
  - "src/types/**/*.ts"
---
# Data Rules

- Map data lives exclusively in `src/data/maps.json` — single source of truth
- Creator data in `src/data/creator.json`
- Never hardcode stats, map codes, or creator info in components
- All data changes must update the JSON files, not component code
- TypeScript types in `src/types/index.ts` must stay in sync with JSON schema
- Stats from fortnite.gg use string format for large numbers ("1.6B", "1.1M")
- Use `parseStatNumber()` and `formatNumber()` from `src/lib/utils.ts` for display
