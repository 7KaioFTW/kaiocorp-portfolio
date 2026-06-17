# CACHE — état courant du projet

> Fichier d'état (Rulebook R5.4). **À lire en premier, mettre à jour en dernier.**
> Dernière mise à jour : 2026-06-17.

## Où en est le projet

Refonte B2B de kaiocorp.com en cours, **français par défaut** (`defaultLocale: "fr"`, EN + 11 autres
locales conservées via next-intl). Positionnement : studio créatif Fortnite/UEFN orienté engagement
de marque (pas « développeur de maps »).

## Dernières actions (cette session)

### Optimisation Lighthouse (2026-06-17)

- **Lighthouse poussé à 100 sur Performance / Accessibility / Best Practices** (desktop) ; SEO 92\* (= 100 en prod).
  Rapport complet : `reports/lighthouse-optimization.html` ; JSON bruts dans `reports/lighthouse/`.
- **AdSense retiré** (`layout.tsx`) — cause unique des 3 échecs Best Practices (73 → 100 : cookie tiers, erreurs console, CSP).
  CSP nettoyée (`next.config.js`) : domaines Google retirés, `unsafe-eval` retiré, ajout `form-action`/`base-uri`/`object-src 'none'`/`frame-ancestors`.
- **A11y 95 → 100** : contraste Footer + `/contact` (`slate-500` → `slate-400`), heading-order Footer (`h5` → `h2`) et
  `/realisations` (`<h2 class="sr-only">`), `aria-label` du LanguageSwitcher (Label-in-Name : inclut le code visible).
- Mobile (profil strict) : Perf 94–96, A11y/BP 100 sur toutes les pages auditées (`/`, `/realisations`, `/contact`, `/services`, `/agences`, `/maps`, `/blog`).
- Expérience `priority` sur images `/realisations` **annulée** (régression LCP mobile 3,0 → 3,8 s — grille sous le pli).
- Mesure : CLI Lighthouse branché sur le Chrome debug `--port=9222` (lancer un Chrome headless échoue dans cet env ; loopback OK).
- `experimental.optimizeCss` (critical-CSS) **testé puis rejeté** : en App Router il n'inline pas le CSS streamé (head = 4 `<link>`, 0 `<style>`) → aucun gain (home mobile 94→91). `critters` désinstallé. **Ne pas retenter.**
- **Commité sur `master`** (état complet : refonte B2B + optim Lighthouse) — **non pushé** (`./push` pour déployer). JSON Lighthouse bruts gitignorés, rapport HTML conservé.

### Refonte B2B (session précédente)

- Homepage refondue : 11 sections B2B (`src/components/sections/`), composées dans `src/app/[locale]/page.tsx`.
- 6 pages : `/`, `/activations-de-marque`, `/agences`, `/createurs-esport`, `/realisations`, `/services`, `/contact`.
- Contenu centralisé : `src/content/site.ts` (preuves, services, FAQ, secteurs) + `src/content/realisations.ts`
  (dérivé de `maps.json`).
- Données câblées sur les sources de vérité : `creator.json` (collaborateurs, email, twitter, agrégats),
  `maps.json` (réalisations + vignettes).
- Total minutes **calculé** dans `src/lib/stats.ts` → actuellement **4,7 Md+** (4 711 059 700).
- Stats des 15 maps réactualisées depuis fortnite.gg (2026-06-17) : minutes, favoris, version, pic, date.
- Vignettes réalisations : vraies images `public/images/maps/*.jpg` via `next/image`.
- Tracking conversion : `src/lib/track.ts` (GA4/dataLayer), CTA via `src/components/ui/Cta.tsx`.
- Formulaire de brief : `src/components/forms/BriefForm.tsx` → email via formsubmit.co → contact@kaiocorp.com.
- Architecture rulebook appliquée : `docs/`, `specs/`, `plans/`, `reports/`, `playground/`, ce `CACHE.md`.

## État de vérification

- `npm run build` ✅ (couvre tsc + lint) — **tourne correctement sur la machine Windows** (≠ ancien sandbox) :
  395 pages générées, 0 erreur. Serveur prod `npm start` OK (Ready ~230 ms sur :3000).
- Lighthouse mesuré desktop + mobile (voir tableau dans `reports/lighthouse-optimization.html`).
  BP = 100 ⇒ `errors-in-console` passe ⇒ **zéro erreur console**.
- ⚠️ SEO `canonical` échoue sur localhost (artefact : canonical → `kaiocorp.com` ≠ domaine audité) → **100 en prod**. Ne pas « corriger ».

## Maps désactivées (`disabled: true` dans maps.json)

`rift-racers-alpine` (Alpine), `7r-1v1-ranked`, `piano-1v1`, `fast-realistic-ranked-2v2`.

## Questions ouvertes / à faire

- [ ] Brancher l'ID analytics (GA4) dans `src/app/[locale]/layout.tsx` pour activer `track()`.
- [x] ~~Supprimer le fichier de vérif AdSense orphelin~~ — fait (supprimé + commité).
- [x] ~~Viser 100 perf mobile via `experimental.optimizeCss`~~ — testé, **rejeté** (n'inline pas en App Router, aucun gain). Voir Dernières actions.
- [ ] Lien Calendly si souhaité (actuellement email/mailto uniquement).
- [ ] Porter le contenu B2B en **anglais** dans le système i18n (actuellement FR inline).
- [ ] Optionnel : skill/script `refresh-map-stats` pour réactualiser fortnite.gg automatiquement.
- [ ] Visuels/screenshots dédiés pour les cartes réalisations (au-delà des vignettes maps).

## Pièges connus (Gotchas)

- L'écriture de fichiers sur le dossier monté **ne tronque pas** : réécrire un fichier plus court
  laisse des octets résiduels (NUL) ou tronque — préférer réécrire via heredoc bash, et re-vérifier.
- `npm run build` / `next dev` ne terminent pas dans le sandbox (lenteur I/O). Vérifier via `tsc`+`eslint`.
- Apostrophes FR dans le JSX brut → ESLint `react/no-unescaped-entities` : utiliser `’` (U+2019).
