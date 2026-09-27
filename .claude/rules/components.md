---
paths:
  - "src/components/**/*.tsx"
  - "src/components/**/*.ts"
---
# Component Rules

- One component per file, named export matching filename
- Use functional components with hooks, no class components
- Props interface defined above component, named `{ComponentName}Props`
- Use `cn()` from `@/lib/utils` for conditional classNames
- Motion: add `data-motion` / `data-*` attributes (reveal, split, decode, parallax, gallery, marquee,
  progress-line, data-magnetic, data-tilt, data-glow, data-cursor) — the lazy engine in `src/lib/motion`
  animates them. Never import gsap in components; hero entrance = CSS classes in `src/app/motion.css`.
  `split` only on solid-colour text; LCP text (hero h1/subtitle) must never start at opacity 0.
- Always include `key` prop when mapping arrays
- Use Next.js `<Image>` for all images, never `<img>`
- Destructure props in function signature
