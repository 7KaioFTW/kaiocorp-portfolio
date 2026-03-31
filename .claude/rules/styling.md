---
paths:
  - "src/**/*.tsx"
  - "src/styles/**/*"
  - "tailwind.config.ts"
---
# Styling Rules

- Tailwind CSS only, no inline styles or CSS modules
- Use design tokens from `tailwind.config.ts`:
  - Backgrounds: `bg-surface-dark`, `bg-surface`, `bg-surface-light`
  - Primary: `text-primary`, `bg-primary`
  - Accent: `text-accent`, `bg-accent`
  - Headings: `font-heading` (Orbitron)
  - Body: `font-body` (Inter)
- Mobile-first responsive: default = mobile, `md:` = tablet, `lg:` = desktop
- Map grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Hover effects: subtle scale + glow on cards (`hover:scale-[1.02]`, `hover:shadow-primary/20`)
- No !important, ever
