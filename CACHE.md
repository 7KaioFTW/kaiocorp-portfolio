# CACHE — état courant du projet

> Fichier d'état (Rulebook R5.4). **À lire en premier, mettre à jour en dernier.**
> Dernière mise à jour : 2026-06-30.

## Où en est le projet

Refonte B2B de kaiocorp.com, **français par défaut** (`defaultLocale: "fr"`). Positionnement : studio
créatif Fortnite/UEFN orienté engagement de marque (pas « développeur de maps »).

**Domaine canonique officiel : `https://kaiocorp.com` (SANS www)** — tout le code SEO pointe désormais
vers ce domaine via la constante unique `SITE_URL` (`src/lib/seo.ts`). ⚠️ Le site est encore SERVI sur
`www.kaiocorp.com` en prod : la redirection Vercel doit être **inversée à la main** (www → non-www) pour
que les signaux SEO du code soient cohérents avec le domaine servi. Voir « Étapes manuelles restantes ».

**Locales actives : 4 routées = FR, EN, ES, DE** (réduit de 13 → 4 le 2026-06-30). Les 9 autres locales
(pt, ar, ja, zh, pt-BR, nl, da, ro, ru) restent traduites sur disque (`src/messages/*.json`,
`src/content/blog/*.ts`) mais **non routées** — réactivables en les rajoutant dans `src/i18n/routing.ts`
(+ une `case` dans `src/content/blog.ts` pour le blog).

## Dernières actions (cette session)

### Cohérence domaine SEO + image OG + réduction locales (2026-06-30)

**Problème traité** : le code SEO pointait vers `kaiocorp.com` (sans www) mais le site est servi sur
`www.` → canonical/hreflang/sitemap/robots envoyaient des signaux contradictoires à Google. Décision :
domaine canonique = **`https://kaiocorp.com` (sans www)** ; côté code rien à changer sur le choix
non-www, mais centralisation + correctifs SEO secondaires.

- **`SITE_URL = "https://kaiocorp.com"`** : constante unique dans `src/lib/seo.ts`, consommée par
  `seo.ts` (`buildAlternates`), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/[locale]/layout.tsx`
  (`buildHreflangAlternates` + canonical + `metadataBase` + `orgSchema`) et les 3 JSON-LD
  (`services`, `maps/[id]`, `blog/[slug]`). `grep -rn "kaiocorp.com" src` ne montre plus que la
  constante + 2 valeurs **data non-SEO** (email `contact@kaiocorp.com` dans `creator.json`, endpoint
  formsubmit dans `ContactForm.tsx`) — `website` de `creator.json` normalisé en `https://kaiocorp.com`.
- **Image OG/Twitter par défaut** (1200×630) ajoutée au `generateMetadata` racine (`layout.tsx`) :
  `public/images/og-default.jpg` — **vraie carte de marque** (logo-mark + wordmark KaioCorp, eyebrow
  UEFN·Verse·UE5, titre « Studio d'expériences Fortnite sur-mesure », sous-ligne Maps·Mini-jeux·Activations,
  bandeau stats 4,7 Md+/15/3,3 M+, dégradé + glows + barre accent). Générée via `sharp`/SVG (script
  scratchpad `gen-og2.js`). **Police : Bahnschrift** (fallback système géométrique — Orbitron indisponible
  hors navigateur ; Playwright bloqué par le Chrome debug déjà lancé sur :9222). Shippable telle quelle ;
  remplaçable plus tard par un visuel photographique/designé si souhaité. URL absolue non-www via `metadataBase`.
- **Réduction locales 13 → 4** (FR, EN, ES, DE) dans `src/i18n/routing.ts` : `localeNames` ramené à 4
  clés, `rtlLocales` → `[]` (ar retiré), polices CJK `Noto_Sans_JP/SC` retirées de `layout.tsx` (ja/zh
  retirés). `getBlogPosts` (`content/blog.ts`) ramené aux 4 `case` routées + `default: en` (branches
  mortes des 9 locales retirées supprimées — évitait un crash build si leurs fichiers étaient nettoyés).
- **Correctifs issus de la review adversariale** (workflow 3 dimensions) : `og:image` était
  **silencieusement absent sur les articles blog** (Next.js remplace `openGraph` au lieu de le fusionner)
  → image par défaut ré-injectée sur `blog/[slug]` (+ `siteName`/`og:locale`) ; `siteName`/`type`/`locale`
  restaurés sur `maps/[id]` ; **`og:locale` passé en forme territoire** `fr_FR`/`en_US`/`es_ES`/`de_DE`
  via helper `ogLocale()` dans `seo.ts`.
- **Vérif** : `tsc` 0, `eslint src` 0, `npm run build` 0 erreur (125 pages). **Sitemap = 120 URLs**
  (30/locale × 4 : 10 pages statiques + 15 maps + 5 blog), **100 % `https://kaiocorp.com`** (seul `www`
  = namespace `sitemaps.org`). `<head>` rendu (prod `npm start`) confirmé cohérent non-www sur home/blog/map :
  canonical + hreflang (en/fr/es/de + x-default, fr → racine) + `og:image` absolue non-www, **0 `www`**.

### Internationalisation du contenu B2B (2026-06-17)

- **Contenu B2B traduit dans les 13 locales** (FR source + EN, ES, DE, JA, ZH, AR, DA, NL, PT-BR, PT, RO, RU).
- Architecture : tout le texte B2B (Hero, 10 sections, 6 pages, FAQ, formulaire, footer, nav) extrait dans le namespace `b2b` de `src/messages/*.json` (**178 clés/locale**). Sections → server components `async` + `getTranslations`/`t.raw()` ; `Header`/`BriefForm`/`LanguageSwitcher` (client) → `useTranslations`.
- `site.ts`/`realisations.ts` réduits aux **données structurelles** (icônes, liens, types, données dérivées de maps.json). `PROJECT_TYPES` = `{value stable, label traduit}` (la soumission email reste cohérente).
- `metadata.homeTitle`/`homeDescription` mises à jour B2B sur les 13 locales (les 11 périmées « map developer » corrigées).
- Vérif : 13/13 JSON valides (0 clé manquante/extra), `tsc`+`eslint` OK, **build 395 pages exit 0**, rendu traduit confirmé (EN/DE/JA/AR/RU/ES, 0 fuite FR ni clé), Lighthouse `/en` desktop **100/100/100** (inchangé). Traductions IA générées par 12 sous-agents parallèles.

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

## Étapes manuelles restantes (SEO — hors code, à faire par Kaio)

> Bloquantes pour que la cohérence non-www du code prenne effet en prod.

- [ ] **Vercel → Settings → Domains** : définir **`kaiocorp.com` (sans www) comme domaine PRIMARY** et
  rediriger **`www` → non-www** (= inverser la redirection 301 actuelle qui va de non-www vers www).
- [ ] *(Optionnel)* Remplacer `public/images/og-default.jpg` par un visuel bespoke/photographique si voulu
  — la carte de marque générée est déjà correcte et shippable (police Bahnschrift à défaut d'Orbitron).
- [ ] **Google Search Console** : vérifier la propriété (domaine entier `kaiocorp.com`), soumettre
  `sitemap.xml`, demander l'indexation de la home + pages clés (services, réalisations, agences).
- [ ] (Après le swap Vercel) re-tester un partage social (OG) + valider hreflang/canonical en prod.

## Questions ouvertes / à faire

- [ ] Brancher l'ID analytics (GA4) dans `src/app/[locale]/layout.tsx` pour activer `track()`.
- [x] ~~Supprimer le fichier de vérif AdSense orphelin~~ — fait (supprimé + commité).
- [x] ~~Viser 100 perf mobile via `experimental.optimizeCss`~~ — testé, **rejeté** (n'inline pas en App Router, aucun gain). Voir Dernières actions.
- [ ] Lien Calendly si souhaité (actuellement email/mailto uniquement).
- [x] ~~Porter le contenu B2B dans le système i18n~~ — **fait** : 13 locales traduites (au-delà d'EN). Relecture native conseillée pour les marchés clés (EN/ES/DE). Voir Dernières actions.
- [ ] Optionnel : skill/script `refresh-map-stats` pour réactualiser fortnite.gg automatiquement.
- [ ] Visuels/screenshots dédiés pour les cartes réalisations (au-delà des vignettes maps).

## Pièges connus (Gotchas)

- L'écriture de fichiers sur le dossier monté **ne tronque pas** : réécrire un fichier plus court
  laisse des octets résiduels (NUL) ou tronque — préférer réécrire via heredoc bash, et re-vérifier.
- `npm run build` / `next dev` ne terminent pas dans le sandbox (lenteur I/O). Vérifier via `tsc`+`eslint`.
- Apostrophes FR dans le JSX brut → ESLint `react/no-unescaped-entities` : utiliser `’` (U+2019).
