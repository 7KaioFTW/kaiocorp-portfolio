# CACHE — état courant du projet

> Fichier d'état (Rulebook R5.4). **À lire en premier, mettre à jour en dernier.**
> Dernière mise à jour : 2026-09-28.

## Où en est le projet

Refonte B2B de kaiocorp.com, **français par défaut** (`defaultLocale: "fr"`). Positionnement : studio
créatif Fortnite/UEFN orienté engagement de marque (pas « développeur de maps »).

**Domaine canonique officiel : `https://kaiocorp.com` (SANS www)** — tout le code SEO pointe désormais
vers ce domaine via la constante unique `SITE_URL` (`src/lib/seo.ts`). ✅ Vercel sert bien `kaiocorp.com`
et redirige `www` → non-www en 308 (vérifié le 2026-09-28) : code SEO et domaine servi sont cohérents.

**Locales actives : 4 routées = FR, EN, ES, DE** (réduit de 13 → 4 le 2026-06-30). Les 9 autres locales
(pt, ar, ja, zh, pt-BR, nl, da, ro, ru) restent traduites sur disque (`src/messages/*.json`,
`src/content/blog/*.ts`) mais **non routées** — réactivables en les rajoutant dans `src/i18n/routing.ts`
(+ une `case` dans `src/content/blog.ts` pour le blog).

## Dernières actions (cette session)

### GSC : 404 des locales retirées → redirection permanente (2026-10-07, NON commité)
- Rapport GSC « pages non indexées » : 171 × 404 = anciennes URL des 9 locales retirées le 2026-07-01
  (pt, pt-BR, ar, ja, zh, nl, da, ro, ru). Le reste (canonique alternative 176, redirection 25,
  explorée/détectée non indexée 149+49) = normal / autorité d'un domaine jeune, pas de bug.
- **Fait** : `redirects()` dans `next.config.js` → `/{locale retirée}[/*]` en 308 vers `/en[/*]`.
  À retirer de la liste si une locale est réactivée.
- **Vérif** : tsc/eslint/build OK ; routes-manifest = 308 ; serveur prod local : `/ja`→`/en`,
  `/ja/maps/sprite-pillars`→`/en/maps/sprite-pillars`, `/pt-BR/blog`, `/pt/about`, `/ru/maps`,
  `/nl/blog?x=1` (query gardée), `/da/` → tous 200 sur l'équivalent EN ; `/de`, `/en/maps` inchangés ;
  `/jam`, `/zhx/about` restent 404 (pas de faux positif).
- Reste : commit + deploy, puis « Valider la correction » sur la ligne 404 dans GSC.

### EN LIGNE — PR #1 mergée dans master (2026-09-28 13:33)
- Merge commit `8cd5091` (motion design `d1db62c` + homepage 3D `22b5b95` + Sprite Pillars / 3D par défaut
  `9162c2b`). Déploiement Vercel production : success à 13:35.
- Vérifié sur kaiocorp.com : homepage 3D servie (poster + script de boot), Sprite Pillars avant Clutch 1V2
  (anneau + /maps), miniature `/images/maps/sprite-pillars.jpg` 200.
- Reste à faire : test sur vrai téléphone (surtout iPhone : ancrage de section). La redirection www → non-www
  est déjà en place (vérifiée, voir « Étapes manuelles restantes »).

### Expérience 3D activée par défaut (2026-09-28, PR #1)
- **Décision de Kaio** : la 3D doit être active par défaut. Avant, « réduire les animations » (cas de ce PC :
  animations Windows désactivées) la coupait sans choix enregistré.
- **Fait** : `selectTier()` + script de boot (parité testée) ne coupent plus la 3D pour le mouvement réduit ;
  elle tourne alors en version réduite (suit le scroll, pas de swoop d’intro / flottement / grain). Restent
  en poster sans choix explicite : Save-Data, < 4 Go, pas de WebGL2, GL logiciel, GPU trop lent. Un
  basculement du réglage OS en cours de visite reconstruit la scène sans la couper. Le bouton « Expérience 3D »
  permet toujours de la désactiver (choix mémorisé). Le motion GSAP garde sa règle (pas chargé en mouvement réduit).
- **Vérif** : 144/144 tests, tsc/eslint/build OK ; e2e dev `t5-static` 54 ok (repli statique = choix « off »),
  `t7-matrix` 73 ok (reduce + défaut → live, sans swoop/flottement/grain/kick FOV), `tf-rm-anchor` 24 ok, 0 FAIL.

### Sprite Pillars en tête + stats du blog recalculées (2026-09-28, PR #1)
- **Demande de Kaio** (retour sur la preview) : Sprite Pillars absente de l’anneau 3D, doit être en premier ;
  stats globales soupçonnées de ne pas l’inclure.
- **Diagnostic** : `TOTAL_MINUTES` l’incluait déjà (4,71 → 4,94 Md, « 4,9 Md+ » sur la home et /maps), mais les
  **articles de blog** fr/en/es/de citaient « 4,7 milliards » en dur ; l’anneau l’excluait faute de miniature.
- **Fait** : miniature téléchargée (`public/images/maps/sprite-pillars.jpg`, 1920×1080, 205 KB, CDN Epic) ;
  Sprite Pillars 1re de `maps.json` + `"pinned": true` (épinglée #1 du classement /maps, `leaderboardOrder()`) ;
  1re des réalisations mises en avant (catégorie `minijeu`, textes fr/en/es/de à relire) ; 1er écran de
  l’anneau (tag MINIGAME), **The Box sort de l’anneau** (10 emplacements) ; blog = `formatBillions(locale)`.
- **Vérif** : 142/142 tests (+12 : blog, `leaderboardOrder`, réalisations), tsc/eslint/build OK ; e2e dev
  `t10-ring` (ordre mis à jour) 8 ok, `t10-keys` 8, `t5-static` 36, `t11-stats-portal` 25, 0 FAIL ; captures
  `…/island/sp-*.png` : 10 miniatures de l’anneau en 200, /maps #1 Sprite Pillars, blog « 4,9 milliards ».
- Non touché : les locales non routées (da/nl/pt-BR/ro…) gardent « 4,7 » en dur (non servies).
- Question ouverte : Kaio voyait des écrans sans miniature sur la preview Vercel — probablement Sprite Pillars
  (fichier absent) ; à reconfirmer après le push (preview protégée par la connexion Vercel).

### Homepage 3D « Floating Island » — IMPLÉMENTÉE, commit 22b5b95, PR #1 (2026-09-28)

Les 14 tâches du plan (`plans/2026-09-27-3d-island-homepage.md`) sont terminées. Détails complets et
rulings : `specs/2026-09-27-3d-island-homepage.md` §11 (« Implementation notes »). Rien n’est commité :
tous les fichiers de `src/lib/three/island/*`, `src/components/three/*`, le poster et les sections
modifiées restent en attente sur `feat/motion-design` (au-dessus de `d1db62c`, qui contient déjà le
motion design + la 16ᵉ map).

- **Ce qui est livré** : 18+ modules `src/lib/three/island/` (île procédurale, eau, végétation, cristaux,
  nuages tiered, particules, anneau de maps 3D, piliers de stats, portail, caméra, post-processing,
  qualité/step-down adaptatif) + `src/components/three/{IslandJourney,MapFocusCard,Toggle3D,RingMapList}`.
  La homepage devient le parcours 3D : nouvel ordre de sections (Stats déplacé après Réalisations), chaque
  section en `variant="over3d"` (panneaux de verre transparents), poster rendu depuis la scène
  (`public/images/island-poster.webp`), toggle « Expérience 3D » (`localStorage`), fallback statique complet
  (pas de WebGL / reduced motion / tier `off`).
- **Vérification (résumé, détails → spec §11)** :
  - Unitaire : **127/127** (`npm test`, 19 fichiers) après le nettoyage Task 14 (130 − 3 tests shader
    supprimés) ; **130/130** (20 fichiers) après la vague de corrections finale (+3 tests de hash de
    géométrie). `tsc`/`eslint`/`build` propres.
  - E2E (CDP, Chromium Playwright headless avec GPU réel) : chapitres synchronisés, toggle on/off, dispose
    complet à la navigation, fallback no-WebGL et reduced-motion, gates de culling exacts (0 px de fuite
    après ajustement), tous verts sur la boucle complète (~266 checks, Task 13) + la boucle de vérification
    du nettoyage (Task 14, ci-dessous).
  - Contraste (panneaux de verre) : pire ratio **4,90:1** après le remède rung 1 (slate-400 → slate-300 sur
    `.island-glass`), 0 échec restant.
  - Lighthouse (home) : desktop **P100/A100/BP100/SEO92** ; mobile **P79** médian à la Task 13 (budget ≥ 80
    raté de 1 point), **P84 après F1** (vague de corrections finale, voir « Revue finale »), A100/BP100/CLS 0
    partout. Tableau complet → spec §11(c).
  - Bundle : three.js **130,5 Ko gz** (charge paresseuse home uniquement, après load+idle). fps par chapitre
    et détails → spec §11(d).
  - Vidéos/screenshots dans le scratchpad : `…/scratchpad/island-tools/island/video/` (parcours desktop/
    mobile + clips de handoff) et `…/island/final-*.png` (24 captures, 1440/390 × no-preference/reduce).
- **Déviations / rulings** : voir spec §11(a)-(b) — gates de nuages et d’anneau élargis par la mesure
  (Tasks 9/11), fade portrait de l’anneau au lieu d’une coupure nette, remède de contraste (rung 1 seulement),
  `object-position` du poster mobile, pas de split `yieldToMain` (mesuré inefficace).
- **Nettoyage code mort (Task 14, avant la doc)** :
  - Supprimés (grep de vérification à zéro avant suppression) : `src/components/motion/HeroShader.tsx`,
    `src/lib/motion/shader.ts` (+ `.test.ts`, 3 tests), `src/lib/motion/presets/gallery.ts` (+ sa
    registration dans `presets/index.ts`).
  - `Hero`, `Audiences`, `Realisations`, `StatsBand`, `WhyKaio`, `Marquee` : branche `default`/`variant`
    retirée (homepage-only, toujours `over3d`) ; les 6 autres sections (`Opportunity`, `ServicesGrid`,
    `Process`, `SectorIdeas`, `FaqB2B`, `FinalCta`) gardent leurs deux variantes **inchangées** (utilisées
    par les autres pages). `ProjectGrid` perd sa variante `gallery` (remplacée par l’anneau 3D) ; son mode
    `grid` est inchangé (vérifié par screenshot `/fr/realisations` 1440 + 390).
  - CSS mort supprimé dans `motion.css` (`.motion-shader.is-live`, `.hero-grid`). La classe `.island-over3d`
    est **conservée** : non stylée en CSS mais interrogée par `$S/island/t5-others.mjs` (scratchpad de
    session, hors repo ; compte les éléments `.island-over3d`).
  - Vérif après nettoyage : `npm test` 127/127, `tsc`/`eslint`/`build` propres, e2e dev (`t5-static` 36/36,
    `t6-live` 12/12, `t7-matrix` 56/56, `t11-stats-portal` 25/25), screenshots `/fr/realisations` 1440/390
    conformes (grille 3 colonnes desktop / 1 colonne mobile, inchangée).
  - ⚠️ **Flake environnemental noté (pas une régression)** : la 1ʳᵉ mesure de fps de `t6-live` a donné
    10 fps (au lieu de ~360 attendu) ; reproduit même sur une page `about:blank` avec un `requestAnimationFrame`
    nu (aucun code du projet impliqué) → throttling Chrome/Windows externe (écran probablement en veille/
    verrouillé pendant la session). Résolu en relançant Chromium avec `--disable-gpu-vsync
    --disable-frame-rate-limit` (et en général en s’assurant que l’écran n’est pas en veille avant de mesurer
    du fps headless) ; re-mesuré à 1111 fps, tous les autres asserts de `t6-live` étaient déjà verts.
- **Décisions de Kaio (2026-09-28)** :
  1. **Handoff poster → 3D live : « swoop sans superposition »** — le passage en `live` est une coupe nette
     (`motion.css` : `transition: none` sur canvas + poster à l’entrée en live ; les fondus restent pour le
     retour au poster). Vérifié : planche `…/island/video/sheet-cut-plain.png` (poster jusqu’au 1er frame 3D,
     plus de double exposition), `t5-static` 36 ok, `t7-matrix` 0 FAIL.
  2. ~~**Perf mobile (finding F1)**~~ — réglé par la vague de corrections finale : `makeIsland` découpé,
     mobile P 84 (voir « Revue finale »).
  3. **Intégration : commit sur `feat/motion-design` + push + Pull Request vers `master`** (preview Vercel
     pour tester sur téléphone ; rien en production avant merge). Dossier `.superpowers/sdd/` conservé.
- **Pillar heights** : décision déjà tranchée par Kaio — hauteurs fixes dégressives (Ruling 4), pas de calcul
  depuis les données.

### Revue finale

- **Verdict** (relecteur Opus frais, revue de toute la branche en lecture seule, 2026-09-28) : **prête avec
  corrections** — 0 critique, 2 importants, 4 mineurs nouveaux. Architecture, cycle de vie (dispose prouvé au
  niveau GL), split du bundle, machine d’état, avant-paint et accessibilité jugés solides. Rapport :
  `.superpowers/sdd/2026-09-27-3d-island-homepage/final-review.md` ; corrections :
  `…/final-fix-report.md`. Rien n’est commité.
- **I1 — abandon (give-up GPU lent) en milieu de page** : le passage à `off` retirait d’un coup les chapitres
  sticky (anneau 300vh, stats 150vh) sous le lecteur, qui était projeté plusieurs écrans plus bas (repro :
  anneau → stats, stats → « idées », process → contact/CTA). **Corrigé** dans `IslandJourney` : on arrête le
  rendu tout de suite, on mesure la section sous le bord haut du viewport (son stage sticky s’il y en a un),
  on bascule en `off` de façon synchrone (`flushSync`), puis on re-scrolle pour garder son décalage, sans
  sortir de la section. Lenis réécrivait l’ancienne position pendant un scroll molette en cours → le moteur
  motion écoute désormais `motion:scroll-to` (`lenis.scrollTo(top, { immediate: true, force: true })`) ;
  contre-épreuve sans ce hook : lecteur projeté dans Process. Écart assumé à la contrainte « pas de
  `scrollTo` global » (ruling du contrôleur). Repro `tf-giveup-anchor` : 5 cas (anneau, stats, anneau pendant
  un scroll Lenis, Process, anneau mobile 390×844) **34/34** (avant : 5/5 cas en échec).
- **I2 — perte du contexte WebGL** : aucun traitement → canvas mort, poster caché, toggle « activée », et un
  warning three au dispose. **Corrigé** : `webglcontextlost` déclenche le même chemin que l’abandon (poster,
  statut `off`, toggle désactivé ; un clic relance un canvas neuf), pas de tentative de restauration ; le
  dispose saute `forceContextLoss()` si le contexte est déjà perdu (`world.ts`). Repro `tf-ctxloss` (perte à
  p 0 et en plein anneau, relance, navigation) **14/14**, console `[]`.
- **F1 — `makeIsland` découpé** : le générateur rend la main (`yieldToMain`) après le maillage de base, tous
  les 8 190 sommets de ses deux boucles et après les normales ; sortie **identique à l’octet** (hash sha256 de
  tous les attributs enregistré avant le changement, `terrain.test.ts`, 3 tests). Lighthouse mobile via le
  proxy, même session et même Chromium GPU, médiane de 3 runs après un run de chauffe :

  | | P | TBT | après-run |
  |---|---|---|---|
  | avant F1 | 78 (76/78/80) | 860 ms | live |
  | **après F1** | **84** (84/85/83) | **520 ms** | live |

  La longue tâche ≈ 410 ms (simulée) de `makeIsland` disparaît des 5 runs après ; desktop P100 inchangé.
- **Mineurs corrigés** : le toggle garde un nom accessible constant (« Expérience 3D », mots « activée /
  désactivée » en `aria-hidden`, l’état passe par `aria-pressed` seul — `tf-toggle-name` 10/10 FR+EN,
  `t7-matrix` +10 checks) ; les docs disent que `bundle-check`, `strip-proxy` et les scripts e2e vivent dans
  le scratchpad de session, hors repo (CLAUDE.md, spec §11(e), ci-dessous).
- **Mineurs parqués** (cosmétiques, ruling) : une frame noire à chaque étape de redimensionnement ; le hero
  reste sombre ~1 s quand on coupe la 3D (le poster se fond pendant 1,2 s).
- **Vérif finale** (vague de corrections) : `npm test` **130/130**, `tsc`/`eslint` propres, `npm run build` OK,
  `bundle-check` OK (three 130,5 Ko gz, absent des chunks initiaux) ; e2e dev **325 ok / 0 FAIL** sur 14 scripts
  (`t5-static` … `t11-stats-portal` + `tf-*`). Serveurs et Chromium arrêtés, ports libres.
- **Re-revue ciblée** (`final-rereview.md`) : I2, F1 et les deux mineurs réglés ; I1 réglé pour l’abandon et la
  perte de contexte. Restait un **important** — (b) le passage OS en reduced motion en milieu de page — et un
  mineur, (a) la perte de contexte pendant le chargement. Les deux sont corrigés (corrections résiduelles) :
  - **(b) Reduced motion OS en milieu de page** : le listener `change` du media query applique le même
    ancrage que I1 (mesure → `flushSync` → re-scroll ; `flushSync` est permis dans un listener, pas dans
    l’effet de layout). Dans les deux sens : vers `reduce` (les chapitres se replient) et retour à
    `no-preference` (ils se redéploient, puis la 3D redémarre). Repro `tf-rm-anchor` (anneau, stats, anneau
    mobile) : avant, lecteur projeté dans stats / « idées » ; après **24/24**, console `[]`.
  - **(a) Perte de contexte pendant le chargement** : l’attente de compilation des shaders est désormais
    bornée (`compilePrograms` dans `world.ts` remplace `compileAsync` de three : arrêt sur perte de contexte,
    sur dispose/abort, ou après 10 s — les programmes finissent alors de compiler au premier rendu) ; le build
    s’arrête dès que le contexte est perdu, et un contexte perdu ne passe jamais « live » : il finit dans le
    chemin d’abandon (poster, `off`, toggle qui relance), sans erreur console (three levait sur un contexte
    perdu). Repro `tf-ctxloss-build` (perte au début du chargement, dans l’attente de compilation, pilote qui
    ne répond jamais « prêt », compilation bloquée sans perte) : avant, statut figé sur `loading` avec un
    `setTimeout` toutes les 10 ms à l’infini, ou une erreur/exception console ; après **22/22**, aucun timer
    ni rAF résiduel.
  - **Toggle** : le nom accessible perd aussi ses deux-points (« Expérience 3D » ; « : » visible mais
    `aria-hidden`).
- **Vérif après les corrections résiduelles** : `npm test` 130/130, `tsc`/`eslint` propres, `npm run build` OK
  (129/129 pages), `bundle-check` OK ; e2e dev `t6-dispose` 29, `t7-matrix` 66, `t7-stepdown` 32, `t10-resize` 21,
  `t11-stats-portal` 25, `tf-giveup-anchor` 34, `tf-ctxloss` 14, `tf-toggle-name` 14, `tf-rm-anchor` 24,
  `tf-ctxloss-build` 22 → **281 ok / 0 FAIL**. Tout arrêté, ports libres ; `.next` contient le build prod.
- **Constats restants (non corrigés)** : ~200 ms après la bascule, SplitText re-coupe le titre « Réalisations »
  (−36 px) sous un lecteur placé plus bas ; ancrage non testé sur le momentum tactile iOS ; une vraie perte de
  contexte (reset GPU, iOS) peut être restaurée par le navigateur sur le canvas détaché jusqu’au GC (m3, non
  vérifiable ici).

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
- Le motion design + mineurs + 16ᵉ map sont **commités** (`d1db62c`, 2026-09-27). Voir l'entrée ci-dessus
  n'est plus à jour sur ce point : seuls les fichiers de la homepage 3D (ce chantier) restent non commités
  sur `feat/motion-design`.

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
  **Commité dans `d1db62c`** (2026-09-27, avec la 16ᵉ map et la spec 3D + plan) — voir l'entrée du dessus.
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
  129 pages générées (129/129, home 3D incluse), 0 erreur. Serveur prod `npm start` OK.
- `npm test` : **130/130** (20 fichiers) — inclut les tests purs de la homepage 3D
  (`src/lib/three/island/*.test.ts`, dont le hash de géométrie de `terrain.test.ts`,
  `src/content/realisations.test.ts`).
- Lighthouse mesuré desktop + mobile (voir tableau dans `reports/lighthouse-optimization.html` pour les
  autres pages ; pour la home 3D voir `specs/2026-09-27-3d-island-homepage.md` §11(c)).
  BP = 100 ⇒ `errors-in-console` passe ⇒ **zéro erreur console**.
- ⚠️ SEO `canonical` échoue sur localhost (artefact : canonical → `kaiocorp.com` ≠ domaine audité) → **100 en prod**. Ne pas « corriger ».
- Home mobile Lighthouse Perf **84** (médian de 3, TBT 520 ms) depuis F1 (découpage de `makeIsland`, fait
  dans la vague de corrections finale) — au-dessus du budget ≥ 80 de la spec 3D (79 avant F1). Détails →
  spec §11(c) et CACHE « Revue finale ».

## Maps désactivées (`disabled: true` dans maps.json)

`rift-racers-alpine` (Alpine), `7r-1v1-ranked`, `piano-1v1`, `fast-realistic-ranked-2v2`.

## Étapes manuelles restantes (SEO — hors code, à faire par Kaio)

> Bloquantes pour que la cohérence non-www du code prenne effet en prod.

- [x] **Vercel → Settings → Domains** : `kaiocorp.com` (sans www) est le domaine principal et `www` redirige
  vers lui — **vérifié le 2026-09-28** : `https://www.kaiocorp.com/` → 308 → `https://kaiocorp.com/`,
  `https://kaiocorp.com/` servi directement.
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
- **Homepage 3D** (spec `specs/2026-09-27-3d-island-homepage.md`, gotchas complets en §11(e)) :
  - `html[data-island]` = `pending | loading | live | off`, posé avant hydratation par le script inline de
    `app/[locale]/page.tsx`. Ne jamais importer `three` de façon statique — seul `IslandJourney` fait l'import
    dynamique. Rien dans le repo ne le vérifie : le script `bundle-check.mjs` vit dans le scratchpad de session
    (texte complet dans le plan, Task 6 Step 14 — à recréer puis lancer après `npm run build`).
  - **Outils de test hors repo** : toute la suite e2e CDP (`cdp.mjs`, `island/lib.mjs`, `t5-*` … `t14-*`,
    `tf-*`), `lh/lh-run.mjs` et `lh/strip-proxy.mjs` (proxy Lighthouse :3200 → :3000) n’existent que dans le
    scratchpad de session (`%TEMP%\claude\…\scratchpad\island-tools`, dossier temporaire effaçable). Le plan
    reproduit `cdp.mjs`, `lib.mjs`, `lh-run.mjs`, `bundle-check.mjs` et la 1ʳᵉ version des scripts e2e de
    chaque tâche ; `strip-proxy.mjs`, les retouches des fix rounds et les scripts `t11-gates-exact`/`t13-*`/`tf-*`
    ne sont nulle part ailleurs.
  - Vérif fonctionnelle (chapitres, toggle, dispose) → serveur **dev** (utilise `window.__island`, absent en
    prod). Lighthouse/vidéo/poster → serveur **prod** (jamais `next dev` + `next build`/`next start` en même
    temps).
  - Un run headless Chromium peut se retrouver throttlé à un fps ridiculement bas (10 fps constatés une fois,
    reproduit même sur une page vide) si l'écran de la machine est en veille/verrouillé pendant la mesure —
    ce n'est pas un bug du code : relancer avec `--disable-gpu-vsync --disable-frame-rate-limit`, ou
    s'assurer que l'écran est actif avant de mesurer.
  - Régénérer le poster (`public/images/island-poster.webp`) avec le script de la Task 12 après tout
    changement visuel de la frame hero.
