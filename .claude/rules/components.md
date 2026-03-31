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
- Framer Motion for animations: `motion.div` with `initial`, `animate`, `transition`
- Always include `key` prop when mapping arrays
- Use Next.js `<Image>` for all images, never `<img>`
- Destructure props in function signature
