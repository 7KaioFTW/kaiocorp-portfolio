---
paths:
  - "src/**/*.tsx"
  - "src/**/*.ts"
  - "tailwind.config.ts"
  - "next.config.js"
---

# Performance Rules

## Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s target
- **FID/INP (Interaction to Next Paint)**: < 100ms target
- **CLS (Cumulative Layout Shift)**: < 0.1 target
- **Lighthouse**: > 90 on all metrics (Perf, Accessibility, Best Practices, SEO)

## Bundle & Images
- Dynamic imports for heavy components (Map detail pages, contact form)
- Next.js Image component ALWAYS for raster images
- Font optimization: preload Orbitron (headings), swap strategy
- Code splitting: separate bundles for each locale

## Optimization Checklist
- No unused imports or dead code
- Server Components by default, Client Components only when needed
- Avoid layout shift: set image width/height, use Container Queries
- Lazy load below-the-fold components
- Monitor: use `next/font` for font optimization
