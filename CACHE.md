# CACHE — état courant du projet

> Fichier d'état (Rulebook R5.4). **À lire en premier, mettre à jour en dernier.**
> Dernière mise à jour : 2026-09-26.

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

### Homepage 3D « Floating Island » — spec APPROUVÉE, plan ÉCRIT : plans/2026-09-27-3d-island-homepage.md (14 tâches, 118 étapes, code pré-validé tsc/eslint/87 tests en scratch) — en attente du choix d’exécution (2026-09-27)

- Retour user : le motion design scroll « n'est pas assez, rien de fou » → veut du **vrai 3D pro**.
- Choix user : parcours 3D au scroll · assets générés en code (pas d'IP Epic) · 3D chargée après la page
  (mobile ~80–90 accepté) · 2 prototypes d'abord.
- Prototypes jetables (sous-agents) : `playground/3d-proto-a-island.html` (île flottante, **retenu**) et
  `playground/3d-proto-b-neon.html` (arène néon). Vidéos envoyées. Serveur statique scratchpad :4000.
- Décisions : **la homepage devient le parcours 3D** (sections réelles pilotent la caméra), Stats déplacé
  après Réalisations, anneau de maps 3D remplace la galerie épinglée, poster + tiers de qualité, fallback
  reduced-motion **+ toggle « Expérience 3D »** (permet aussi à Kaio de voir la 3D malgré Windows).
- Spec : `specs/2026-09-27-3d-island-homepage.md` (three.js vanilla, 18 modules `src/lib/three/island/`,
  mapping scroll→caméra par sections, sticky CSS, dispose complet, budgets Lighthouse home D≥90/M≥80).
- ⚠️ Le Chrome debug :9222 n'est plus lancé (Chrome rouvert sans debug) ; Chromium Playwright headless
  (`%LOCALAPPDATA%\ms-playwright\chromium-1217`) sur un port libre sert aux vérifs/vidéos (`CDP_PORT`).
- Branche `feat/motion-design` toujours **non commitée** (motion design + mineurs + 16ᵉ map).

### 16ᵉ map « Sprite Pillars » + spec motion design (2026-09-26)

- **Map ajoutée** : `sprite-pillars` (0673-9062-5656, créateur KNZI, FFA 12 joueurs, v50) — stats
  fortnite.gg du 2026-09-26 (228.1M min, 124.6K favoris, pic 6 694). **Choix user : map seule**,
  KNZI **pas** ajouté aux collaborateurs (reste à 5). Non featured. Filtre « Knzi » ajouté au
  leaderboard `/maps`. ⚠️ **Vignette manquante** : `public/images/maps/sprite-pillars.jpg` à
  télécharger (curl bloqué par les permissions) depuis
  `https://cdn-0001.qstv.on.epicgames.com/liOghSBWVXbwXPdcdE/image/landscape_comp.jpeg`.
- **Agrégats calculés** : `totalMaps`/`totalCollaborators` retirés de `creator.json` (+ type
  `AggregateStats` supprimé) → `TOTAL_MAPS` / `TOTAL_COLLABORATORS` dans `stats.ts`. Total minutes →
  **4,9 Md+** (4 939 159 700). Le chiffre « 4,7 » codé en dur dans 8 clés × 4 locales routées
  (`homeDescription`, `mapsDescription`, `maps.pageIntro`, `blog.pageDescription`, `blog.authorBio`,
  `about.bioExtended` + 2 clés mortes) → placeholder `{billions}` alimenté par `formatBillions(locale)`.
  Articles de blog (contenu daté) et 9 locales non routées : laissés tels quels.
- **Vérif** : `tsc` 0, `eslint src` 0. Build + rendu à faire avec la vignette.
- **Motion design — IMPLÉMENTÉ** (branche `feat/motion-design`, **non commité**). Spec
  `specs/2026-09-26-motion-design.md` (§12 = écarts + scores), plan `plans/2026-09-26-motion-design.md`.
  Moteur `src/lib/motion/` (GSAP 3.15 ScrollTrigger/SplitText + Lenis 1.3, chargé après load+idle,
  presets `data-motion`: reveal/split/decode/parallax/gallery/marquee/progress-line + magnetic/tilt/glow,
  curseur, barre de progression), hero WebGL maison (`shader.ts`), entrée hero CSS (glitch/sweep, LCP-safe),
  galerie Réalisations épinglée (cartes → liens `/maps/[id]`), marquee des titres, ligne Process, drift
  KAIOCORP, header masqué au scroll, transition de page (`[locale]/template.tsx`), `src/app/motion.css`.
  Vitest 4 (`npm test`, 25 tests). CSP : `'unsafe-eval'` en dev uniquement (next dev ne s'hydratait plus).
- **Revue finale** (reviewer frais) : 0 critique, 8 importants → **tous corrigés** avec test de repro CDP
  RED→GREEN (decode width lock, titre lu 3× par les lecteurs d'écran, focus carte invisible, filtre blog,
  deep link `#contact`, cartes coupées en 1366×657, molette dans le textarea, ligne focus invisible).
  Cause racine du deep link : `html { scroll-behavior: smooth }` (globals.css) → **supprimé** (Lenis lisse).
  Les 11 mineurs ont ensuite été traités (demande user) : transition entre routes sœurs (template.tsx →
  MotionProvider), parallax sans saut au reload, shader (résolution au resize, contexte WebGL libéré,
  highp, temps bouclé), presets isolés (`safely`), marquee en pause hors écran, scan StatsBand one-shot
  (preset `sweep`), texte décodé redevenu un seul nœud, lagSmoothing restauré, Header ; M-3 non
  reproductible (0 trigger orphelin). Tests : 30 unitaires + repros CDP (scratchpad) tous verts.
  Vidéos de preview motion (desktop/mobile) enregistrées via CDP screencast + ffmpeg.
  Contraste pré-existant corrigé (ServicesGrid, exemples slate-500 → slate-400, 4,01:1 masqué par le reveal).
- **Lighthouse prod final (motion forcé ON)** : desktop 100/100/100 partout (BP 96 /maps = vignette
  manquante) ; mobile `/realisations` 96, `/maps` 97, **home 91** (contrôle statique 93 au même moment —
  Roblox + OBS tournaient). **Re-mesuré après les mineurs, machine plus calme : home mobile 97 (statique 96), desktop 100/100/100** → cible atteinte.
  A11y 100 partout, y compris en reduced motion. CLS 0. JSON : `reports/lighthouse/motion-*.json`.
- ⚠️ **Ce PC a les « effets d'animation » Windows désactivés** → Chrome dit `prefers-reduced-motion: reduce`
  → le site y apparaît **statique** (voulu). Tests/audits : forcer `no-preference` via CDP/puppeteer.
- **Trouvailles hors scope (pré-existantes)** : (1) les titres ne sont pas en Orbitron (Tailwind
  `fontFamily.heading: "Orbitron"` ≠ famille renommée par next/font → fallback) ; (2) skip link → nav client
  → Retour : Next 14 ignore le `popstate` à `state=null` → l'ancienne page reste affichée.

### Audit workflow complet + nettoyage « tout le safe » (2026-07-02)

Audit multi-agents (workflow 6 dimensions × find→verify adversariale) : 25 findings confirmés.
Décision produit : **le flag `disabled` de maps.json est interne, volontairement SANS effet sur le
site** — les maps désactivées s'affichent comme actives (leaderboard, détail, sitemap, réalisations).
Documenté dans `types/index.ts` (commentaire sur `disabled?`) + Gotchas CLAUDE.md pour éviter tout
« fix » futur. Tous les findings liés au `disabled` = **par design, non corrigés**.

Correctifs appliqués (« tout le safe », zéro décision produit) :
- **Dead code supprimé** (9 fichiers) : `ContactForm.tsx` (la page contact utilise `BriefForm`),
  6 composants pré-refonte non importés (`StatsSection`, `FeaturedMaps`, `ServicesPreview`, `BottomCTA`,
  `LatestPosts`, `BrandCollabs`), `CountUp.tsx`, et `public/images/logo.png` (1,3 Mo inutilisé).
  `formatNumber` retiré de `utils.ts` (seul `CountUp` le consommait) ; `parseStatNumber` **conservé**
  (utilisé par `MapLeaderboard`). `StatsSection` hardcodait `4.5B`/`3.3M` → landmine supprimée.
- **Bundle** : `i18n/request.ts` passe d'un `import(\`../messages/\${locale}.json\`)` (bundlait les 13 JSON,
  ~322 Ko de locales mortes) à un **loader map explicite des 4 locales routées**.
- **SEO** : `sitemap.ts` — `lastmod` désormais **dérivé du contenu** (`siteLastMod` = max des dates
  maps/posts, stable entre déploiements, plus de `new Date()` build-time) + **hreflang `xhtml:link`**
  ajoutés (120 URLs → 600 alternates réciproques). `twitter:image` cohérent sur `maps/[id]` (miroir de
  l'override OG). Breadcrumb JSON-LD **locale-aware** (via helper `localeUrl`, plus de fr-root en dur).
  Helpers `localeUrl`/`localeAlternates` extraits dans `seo.ts` (source unique).
- **Qualité** : `CopyCode` clipboard en `try/catch` (plus de rejet non géré / faux « copié ») ;
  stats agrégées périmées retirées de `creator.json` + `AggregateStats` (calculées dans `stats.ts`) ;
  `engines: node >=18.18` + `.nvmrc` (pin) ; commentaire sync CSP/GA dans `track.ts` ; `data.md` màj.
- **Vérif** : `tsc` 0, `eslint src` 0, `npm run build` 0 (125 pages). Sitemap régénéré : 120 URLs,
  600 `xhtml:link`, `lastmod` = dates contenu (0 date build), `siteLastMod` = 2026-06-13.

**NON corrigé (recommandations workflow, décision utilisateur requise)** : passer à un flow
branche+PR (preview Vercel) au lieu du push direct `master`→prod ; CSP nonce-based (au lieu de
`unsafe-inline`) ; les 9 fichiers blog de locales droppées restent sur disque (trade-off assumé).

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
