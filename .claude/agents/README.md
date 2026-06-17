# Subagents

Portfolio uses two specialized agents for quality assurance.

## code-reviewer
**Invoke when**: Reviewing code changes, checking TypeScript compliance, validating component implementations, checking for bugs before commit.

**Capabilities**:
- TypeScript strict compliance (no `any`, no unused imports)
- Tailwind design token usage
- Data hardcoding checks
- Accessibility audits
- Responsive design validation
- Framer Motion animation checks
- Performance concerns (images, keys, re-renders)

**Model**: Sonnet (strong code understanding)

## perf-auditor
**Invoke when**: Optimizing load times, analyzing bundle size, checking Lighthouse scores, investigating Core Web Vitals issues.

**Capabilities**:
- Bundle size analysis
- Image optimization verification
- Font loading strategy
- Client-side JS reduction
- Core Web Vitals (LCP, CLS, FID/INP)
- Specific code change recommendations

**Model**: Haiku (performance specialist)

---

## How to Use
1. Create a separate task/session for the agent
2. Give it access to the changed files (Read, Grep, Glob, Bash)
3. Let it run full audits, not piecemeal checks
4. Act on recommendations before pushing to master
