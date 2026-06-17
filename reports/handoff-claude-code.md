# Handoff → Claude Code — Portfolio KaioCorp

Ouvre Claude Code **à la racine du dépôt `Portfolio`**, puis copie-colle le bloc ci-dessous.

---

```
Tu reprends le projet KaioCorp Portfolio (Next.js 14 App Router, TypeScript strict, Tailwind, next-intl).

AVANT TOUTE ACTION, lis dans l'ordre, puis résume-moi en ~5 lignes l'état que tu as compris avant de coder :
1. CLAUDE.md          (règles projet + "Claude Rulebook" appliqué)
2. CACHE.md           (état courant — à relire en premier, mettre à jour en dernier à chaque session)
3. docs/RULEBOOK.md   (directives agentiques appliquées à ce repo)

## Ce qui a été fait (refonte B2B, français d'abord)
- Repositionnement : studio créatif Fortnite/UEFN orienté engagement de marque (plus "développeur de maps").
- defaultLocale = "fr" (next-intl) ; contenu B2B rédigé en français inline ; 13 locales conservées.
- Homepage = 11 sections dans src/components/sections/, composées par src/app/[locale]/page.tsx :
  Hero, Opportunity, Audiences, ServicesGrid, StatsBand, Realisations, Process, WhyKaio, SectorIdeas, FaqB2B, FinalCta.
- 6 pages : / , /activations-de-marque , /agences , /createurs-esport , /realisations , /services , /contact.
- Contenu centralisé : src/content/site.ts (preuves, services, FAQ, secteurs) + src/content/realisations.ts (dérivé de maps.json).
- Formulaire de brief : src/components/forms/BriefForm.tsx → email via formsubmit.co → contact@kaiocorp.com.
- Tracking : src/lib/track.ts (GA4/dataLayer) + CTA via src/components/ui/Cta.tsx.
- Réalisations : vraies vignettes public/images/maps/*.jpg via next/image ; stats réactualisées depuis fortnite.gg (2026-06-17).

## Sources de vérité — ne pas contourner
- src/data/maps.json = stats des 15 maps. src/data/creator.json = collaborateurs, email, twitter, agrégats.
- Le total de minutes n'est JAMAIS codé en dur : il est calculé dans src/lib/stats.ts (TOTAL_MINUTES_LABEL ≈ 4,7 Md+).
- Maps désactivées (disabled: true) : rift-racers-alpine, 7r-1v1-ranked, piano-1v1, fast-realistic-ranked-2v2.

## Protocole de vérification (obligatoire, Rulebook R1.2)
- Toute mutation se termine par : npx tsc --noEmit + npx eslint src (+ npm run build quand possible).
- UI : rendu/screenshot, pas une description. Si une approche échoue 2 fois → rewind, pas une rustine.
- Apostrophes FR en JSX brut → ESLint react/no-unescaped-entities : utiliser ' (U+2019).

## Tâches ouvertes (par priorité)
1. Brancher l'ID GA4 dans src/app/[locale]/layout.tsx pour activer track().
2. (Option) Skill repo-local .claude/skills/refresh-map-stats : script qui lit les codes de maps.json, fetch
   fortnite.gg, met à jour minutes/favoris/version/pic → le total se recalcule tout seul.
3. Porter le contenu B2B en anglais dans le système i18n (actuellement FR inline).
4. Lien Calendly si souhaité (actuellement mailto uniquement).
5. Visuels/screenshots dédiés pour les cartes réalisations.

## À savoir
- playground/prototype-homepage.html est un miroir visuel jetable de la homepage, PAS la source — la source est src/.
- Convention de dossiers (Rulebook R5.2) : specs/ plans/ reports/ docs/ playground/.

Commence par lire les 3 fichiers, résume l'état, puis attends ma première tâche.
```

---

> Ce fichier est lui-même un *handoff* au sens du Rulebook (R5.5) : il liste décisions, sources de
> vérité, protocole de vérif et prochaines actions, pour qu'un nouvel agent démarre sans re-explorer.
