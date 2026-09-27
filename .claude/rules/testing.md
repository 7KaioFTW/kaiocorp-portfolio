---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/**/*.spec.ts"
  - "src/**/*.spec.tsx"
---

# Testing Rules

- Unit tests: Vitest (`npm test`, config `vitest.config.mts`) for pure logic in `src/lib` (`*.test.ts`)
- E2E tests: Playwright for critical user flows (map pages, contact form)
- Test coverage target: 70% for src/components, src/lib, src/hooks
- Component tests: test accessibility, props, error states, animations don't break
- Mock data: use `src/data/maps.json` test fixtures, never mock data structures
- Performance: avoid snapshot tests; use specific assertions instead
- Next.js specific: mock next/image, next/link, next-intl
