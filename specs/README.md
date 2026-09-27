# specs/

Cahiers des charges et spécifications. **La spec est le contrat** (Rulebook R6.4) : si elle est
fausse, la sortie l'est aussi, même si le code tourne.

Workflow spec-based (R6.1–R6.3) : phase 1 = clarifier la spec (session de planification, via
`AskUserQuestion`) → écrire ici. Phase 2 = exécuter dans une session fraîche dont la 1ʳᵉ action est
de lire la spec. Un manque découvert en exécution → revenir mettre à jour la spec, pas le patcher.

Contenu actuel :
- `refonte-kaiocorp.md` — stratégie, architecture, copy & UX de la refonte B2B.
- `2026-09-26-motion-design.md` — système de motion design (GSAP + Lenis + WebGL hero), guardrails perf/a11y.
- `2026-09-27-3d-island-homepage.md` — homepage en parcours 3D « Floating Island » (three.js), d’après `playground/3d-proto-a-island.html`.
