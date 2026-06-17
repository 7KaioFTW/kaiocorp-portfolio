# Refonte KaioCorp — Stratégie, Architecture, Copy & UX

> Document de travail — refonte du site [kaiocorp.com](https://www.kaiocorp.com/)
> Positionnement : **studio créatif Fortnite / UEFN orienté engagement de marque**, pas « développeur de maps ».
> Langue : **français d'abord** (EN en secondaire via i18n existant). CTA conversion : email / brief simple.

---

## 0. Principe directeur

Le visiteur doit comprendre en **moins de 5 secondes** : *ce que fait KaioCorp · pour qui · pourquoi c'est crédible · pourquoi Fortnite est un levier · quelle action faire ensuite.*

On ne vend pas une compétence technique (« on fait des maps »), on vend un **résultat business** : *transformer l'attention des joueurs en engagement réel pour une marque, une agence, un créateur ou une structure esport.*

**Promesse centrale (H1 du site)**

> **« Créez votre expérience Fortnite sur-mesure pour engager votre audience. »**

**Phrase de positionnement (sous toutes les pages clés)**

> *« Nous aidons les marques, agences et créateurs à transformer Fortnite en canal d'engagement grâce à des expériences UEFN sur-mesure. »*

**Preuves à pousser haut, partout :**
4,7 Md+ minutes jouées · Martoz · GamersOrigin · WZF · Greencat · Teekzie · Activations Recyclermonvehicule.fr, Krys, Alpine · UEFN / Verse / Unreal Engine 5.

---

## 1. Architecture complète du site

### Arborescence

```
/                         Homepage (conversion immédiate)
/activations-de-marque    Cible : marques + agences
/agences                  Cible : agences (partenariat technique / marque blanche)
/createurs-esport         Cible : créateurs, streamers, managers, structures esport
/realisations             Portfolio business (preuves)
  /realisations/[slug]    Fiche projet détaillée
/services                 Catalogue complet des prestations
/contact                  Conversion simple (formulaire + email + RDV)
```

Pages annexes conservées : `/blog` (SEO/contenu), pages légales (`/mentions-legales`, `/confidentialite`).

### Logique de conversion (multi-portes)

Chaque cible a **sa propre porte d'entrée** depuis la homepage et le header, pour ne pas diluer le message :

| Cible | Page dédiée | CTA principal |
|---|---|---|
| Marques | `/activations-de-marque` | « Imaginer une activation de marque » |
| Agences | `/agences` | « Trouver un partenaire Fortnite » |
| Créateurs | `/createurs-esport` | « Créer ma map » |
| Esport | `/createurs-esport` | « Créer une expérience esport » |

**CTA global (header sticky, toutes pages)** : **« Discuter de votre projet »** → `/contact`.

### Navigation header (sticky, mobile-first)

`Activations` · `Agences` · `Créateurs & Esport` · `Réalisations` · `Services` — puis bouton accent **« Discuter de votre projet »** toujours visible. Logo KaioCorp à gauche. Sélecteur de langue FR/EN à droite.

### Footer

Colonnes : *Solutions* (les 4 cibles) · *Studio* (Réalisations, Services, Blog, Contact) · *Preuves* (rappel 4,7 Md+ min, collaborations) · contact email + réseaux. Mini-CTA répété.

---

## 2. Copy de la homepage (section par section)

> Ton : premium, clair, business. Parle autant à un directeur marketing qu'à un créateur Fortnite. Pas de jargon non expliqué, pas de cliché ado/gamer.

### Section 1 — Hero

**Eyebrow** : `UEFN · Verse · Unreal Engine 5 — Studio créatif Fortnite`

**H1** : **Créez votre expérience Fortnite sur-mesure pour engager votre audience.**

**Sous-titre** : *KaioCorp conçoit des maps, mini-jeux et activations de marque dans Fortnite avec UEFN, Verse et Unreal Engine 5 — de l'idée au prototype, jusqu'à la publication et la maintenance.*

**Bloc preuve (3 pastilles)** :
`4,7 Md+ minutes jouées` · `Collaborations : Martoz · GamersOrigin · WZF · Greencat · Teekzie` · `Activations de marque : Recyclermonvehicule.fr · Krys · Alpine`

**CTA principal** : **Discuter de votre projet**
**CTA secondaire** : Voir les réalisations
**Réassurance** : *De l'idée au prototype, jusqu'à la publication et la maintenance.*

### Section 2 — Problème / Opportunité

**H2** : **Les audiences jeunes ne veulent plus seulement regarder une publicité. Elles veulent interagir.**

*Fortnite est devenu bien plus qu'un jeu : c'est un espace d'attention, de communauté et d'expérience. Pour une marque, une agence ou un créateur, une expérience bien conçue devient un véritable actif d'engagement — pas une campagne qui s'éteint en 48 heures.*

**7 leviers (pastilles / icônes)** : Temps passé · Interaction · Partage communautaire · Challenge · Expérience de marque · Visibilité organique · Activation avec créateurs.

### Section 3 — Pour qui ? (4 cartes)

**H2** : **Une seule expertise, quatre façons de l'activer.**

**Carte 1 — Pour les marques**
*Lancez une activation Fortnite autour de votre univers, d'un produit, d'un événement ou d'une campagne Gen Z.*
Exemples : mini-jeu de marque, course, tycoon, challenge communautaire, expérience événementielle.
CTA : **Imaginer une activation de marque**

**Carte 2 — Pour les agences**
*Ajoutez Fortnite à vos recommandations clients sans recruter une équipe UEFN en interne.*
Exemples : partenariat technique, production en marque blanche, conception d'expériences pour campagnes gaming.
CTA : **Trouver un partenaire Fortnite**

**Carte 3 — Pour les créateurs**
*Créez une map à votre image pour engager votre communauté, prolonger votre contenu et construire un actif durable dans Fortnite.*
Exemples : 1v1, boxfight, zone wars, ranked maps, realistic fights.
CTA : **Créer ma map**

**Carte 4 — Pour les organisations esport**
*Animez votre communauté avec une expérience Fortnite propriétaire : tournois, challenges, classements, sponsors, événements.*
CTA : **Créer une expérience esport**

### Section 4 — Services

**H2** : **Des expériences Fortnite pensées pour l'engagement.**
**Sous-titre** : *Nous utilisons UEFN et Verse pour créer des mécaniques personnalisées : scoring, progression, classement, UI et gameplay sur-mesure.*

Cartes (bénéfice business + exemple concret + micro-CTA) :

1. **Activations de marque Fortnite** — *Transformez un brief marketing en expérience jouable.* Ex. : drop produit, challenge communautaire de marque.
2. **Maps compétitives** — *Rétention forte sur des formats que les joueurs rejouent.* Ex. : 1v1, boxfight, zone wars, realistics.
3. **Mini-jeux & challenges** — *Un format simple, viral, partageable.* Ex. : challenge d'adresse, course chronométrée.
4. **Tycoons / simulateurs** — *Des sessions longues et une progression addictive.* Ex. : Carlife Tycoon (~80 min/session).
5. **Expériences événementielles** — *Un temps fort autour d'un lancement.* Ex. : scène virtuelle, quête de festival.
6. **Systèmes ranked / scoring / leaderboards** — *De la compétition qui fait revenir.* Ex. : classement saisonnier, ligues.
7. **UI personnalisée** — *Votre marque présente dans chaque écran.* Ex. : HUD, menus, branding in-game.
8. **Verse scripting** — *Des mécaniques impossibles en Creative standard.* Ex. : logique de jeu, devices custom.
9. **Optimisation / performance** — *Une expérience fluide = des joueurs qui restent.* Ex. : budget mémoire, draw calls.
10. **Publication & maintenance** — *Un actif vivant, pas un one-shot.* Ex. : équilibrage, nouvelles versions.

Micro-CTA section : **Découvrir les formats possibles** → `/services`.

### Section 5 — Réalisations / Portfolio

**H2** : **Des expériences jouées pendant des milliards de minutes.**
**Sous-titre** : *4,7 Md+ minutes jouées. Des maps qui retiennent, des marques qui activent, des communautés qui reviennent.*

Cartes projet (structure business) — **Nom · Type · Objectif · Résultat · visuel · CTA « Voir le projet »** :

- **Clutch Realistics 1v2 — Martoz** · Map compétitive créateur · *Engager une communauté autour d'un format clutch* · **1,6 Md+ min jouées, v241, rétention durable.**
- **Martoz 1v1 Build Fights** · Map compétitive créateur · *Format d'entraînement 1v1 rejouable* · **1,5 Md+ min jouées, D1 39 %.**
- **Martoz Turtle Fights FFA** · Map compétitive créateur · *FFA fun et addictif* · **1,2 Md+ min jouées, 300 versions.**
- **Carlife Tycoon** · Tycoon / simulateur · *Sessions longues, progression* · **~80 min de temps de jeu moyen.**
- **Carlife Tycoon (GamersOrigin × Recyclermonvehicule.fr)** · Activation de marque · *Sensibiliser au recyclage automobile via un tycoon jouable* · **1,5 M min jouées · 6,7 K favoris · v8.**
- **Senses Rush (GamersOrigin × Krys)** · Activation de marque · *Faire vivre l'univers Krys dans une expérience immersive* · **498,6 K min jouées · 6 K favoris · v8.**
- **Rift Racers (GamersOrigin × Alpine)** · Activation automobile · *Transformer l'expérience Alpine en circuit jouable* · **210,7 K min jouées · 2,1 K favoris · v12.**

> Les chiffres des réalisations sont désormais dérivés directement de `src/data/maps.json` (source de vérité) — pas de placeholder. Le total « 4,7 Md+ » reste l'agrégat de toutes les maps.

Micro-CTA : **Voir les réalisations** → `/realisations`.

### Section 6 — Process

**H2** : **Un process simple, de l'idée à la publication.**

1. **Brief stratégique** — on clarifie la cible, l'objectif, l'univers, les mécaniques et les contraintes.
2. **Concept & game design** — on transforme l'idée en expérience jouable avec des mécaniques engageantes.
3. **Prototype** — une première version jouable pour valider rapidement la direction.
4. **Développement UEFN / Verse** — gameplay, UI, scoring, optimisation, assets, logique de jeu.
5. **Publication & lancement** — soumission, support, itérations et stratégie de lancement.
6. **Maintenance & optimisation** — corrections, nouvelles versions, équilibrage, amélioration continue.

### Section 7 — Pourquoi KaioCorp ?

**H2** : **Une expertise Fortnite prouvée par l'usage réel.**

- Des **milliards de minutes** jouées sur nos expériences.
- Une **expérience terrain** sur ce qui retient réellement les joueurs.
- Maîtrise technique **UEFN / Verse / Unreal Engine 5**.
- Capacité à travailler avec **créateurs, agences et marques**.
- Une approche à la fois **game design, technique et marketing**.
- Des expériences optimisées pour **l'engagement**, pas seulement l'esthétique.

### Section 8 — Idées d'activations (grille par secteur)

**H2** : **Quel type d'expérience Fortnite pourriez-vous créer ?**

- **Sport** : challenge d'adresse, course, entraînement, compétition communautaire.
- **Automobile** : circuit, course, exploration de véhicule, challenge chronométré.
- **Mode / sneakers** : drop virtuel, parcours immersif, mini-jeu autour d'une collection.
- **Musique / festival** : expérience événementielle, scène virtuelle, quête autour d'un artiste.
- **Éducation / jeunesse** : map pédagogique, expérience ludique, challenge collectif.
- **Entertainment** : univers immersif, teasing de série/film, mission narrative.
- **Agences** : activation clé en main à proposer à un client.

Micro-CTA : **Demander une idée d'activation** → `/contact`.

### Section 9 — FAQ

1. **Pourquoi créer une expérience Fortnite pour une marque ?** — Parce que c'est le seul média où votre audience *joue* avec vous au lieu de simplement vous regarder : temps d'attention long, interaction réelle, partage communautaire, et un actif qui dure au-delà d'une campagne.
2. **Combien coûte une map Fortnite sur-mesure ?** — Cela dépend du périmètre (format, mécaniques, durée de vie). Les formats simples démarrent dans les bas milliers ; une activation de marque avec Verse custom est plus élevée. On vous donne un chiffrage clair après le brief.
3. **Combien de temps faut-il pour créer une expérience ?** — D'un prototype en 1 à 2 semaines à 6–12 semaines pour une expérience complète, selon la complexité.
4. **Peut-on créer une activation ponctuelle ?** — Oui : un temps fort événementiel comme un actif durable. On adapte au besoin.
5. **Peut-on maintenir une map dans le temps ?** — Oui, c'est notre force : certaines de nos maps dépassent la version 200, mises à jour au fil du meta Fortnite.
6. **Travaillez-vous avec des agences ?** — Oui, en partenariat technique ou en marque blanche. Vous gardez la relation client, nous produisons l'expérience.
7. **Peut-on créer une expérience en marque blanche ?** — Oui, sans que notre nom apparaisse côté client final.
8. **Quelle différence entre une map Fortnite et une activation de marque ?** — Une map est un format de jeu ; une activation est une map pensée autour de votre univers, vos objectifs marketing et votre mesure de performance.
9. **Est-ce adapté à une marque qui n'a jamais fait de gaming ?** — Oui : on traduit votre brief marketing en expérience jouable, sans que vous ayez à maîtriser l'aspect technique.
10. **Comment mesure-t-on les résultats ?** — Minutes jouées, rétention (D1/D7), favoris, pics de joueurs simultanés, temps de session — des métriques concrètes d'engagement.

### Section 10 — CTA finale + formulaire

**H2** : **Vous préparez une campagne gaming, une activation Gen Z ou une expérience Fortnite ?**
*Parlons de votre idée. Nous transformons un brief marketing, une communauté ou un univers de marque en expérience Fortnite jouable.*

**CTA** : **Discuter de votre projet** · alternatives : **Envoyer un brief** · **Réserver un appel de 15 min**.

**Formulaire court** : Nom · Email · Entreprise · Type de projet · Budget estimé · Message.
**Options « Type de projet »** : Activation de marque · Projet agence · Map créateur · Projet esport · Maintenance / optimisation · Je ne sais pas encore.

> Cette session : le formulaire est **visuel** et envoie vers `contact@kaiocorp.com` (mailto pré-rempli). À brancher plus tard sur un vrai endpoint ou Calendly.

---

## 3. Spec UX / Direction artistique

**Univers** : gaming premium, studio créatif type Unreal/UEFN. Crédible, high-tech, **pas un fan-site**.

**Palette** (réutilise le design system existant du repo) :
`surface-dark #0A0A0F` · `surface #12121A` · `surface-light #1A1A2E` · primaire violet `#7B2FBE` · accent cyan `#00D4FF`. Néon subtil, beaucoup d'espace.

**Typo** : Orbitron (titres / display), Inter (corps).

**Composants visuels** : dégradés sombres, halos néon discrets, cartes en verre (glassmorphism léger, bordure `white/5`), grille fine en fond, screenshots de maps / interfaces / 3D.

**Animations légères** : apparition au scroll (fade + translate), hover sur cartes (élévation + glow accent), compteur animé sur les chiffres clés, header qui se densifie au scroll.

**Mobile-first** : header sticky avec CTA toujours visible, sections empilées, cartes en pleine largeur, typographie lisible, formulaire court.

**Règles** : pas d'usage abusif du logo officiel Fortnite ; titres orientés bénéfice ; micro-CTA après chaque section ; preuves très haut dans la page.

---

## 4. SEO

**Structure Hn** : un seul H1 par page (la promesse), H2 par section, H3 pour les sous-éléments (cartes, FAQ).

**Meta par page :**

| Page | Title (≤ 60c) | Description (≤ 155c) |
|---|---|---|
| Home | KaioCorp — Studio d'expériences Fortnite sur-mesure (UEFN) | Maps, mini-jeux et activations de marque dans Fortnite avec UEFN & Verse. 4,7 Md+ minutes jouées. Discutons de votre projet. |
| Activations de marque | Activation de marque Fortnite — KaioCorp | Engagez votre audience Gen Z avec une activation Fortnite sur-mesure. De l'idée à la publication. Marques & agences. |
| Agences | Partenaire technique Fortnite / UEFN pour agences — KaioCorp | Production UEFN & Verse en marque blanche pour vos campagnes clients. Vous gardez la relation, nous créons l'expérience. |
| Créateurs & Esport | Créez votre map Fortnite — Créateurs & Esport — KaioCorp | Une map à votre image : formats compétitifs, classements, tournois, sponsors. Engagez votre communauté. |
| Réalisations | Réalisations Fortnite — 4,7 Md+ minutes jouées — KaioCorp | Maps créateurs, activations de marque et formats compétitifs joués pendant des milliards de minutes. |
| Services | Services UEFN, Verse & activation Fortnite — KaioCorp | Development UEFN, Verse scripting, game design, systèmes ranked, UI, maintenance. Du concept à la publication. |
| Contact | Discuter de votre projet Fortnite — KaioCorp | Envoyez votre brief ou réservez un appel de 15 min. Activation de marque, projet agence, map créateur ou esport. |

**Mots-clés EN** : Fortnite brand activation · Fortnite UEFN developer · UEFN development studio · Verse developer Fortnite · Fortnite map creator · Fortnite experience agency · Fortnite marketing activation · Fortnite creative agency · gaming activation agency · Gen Z brand activation.

**Mots-clés FR** : création map Fortnite · activation de marque Fortnite · développeur UEFN · développeur Verse Fortnite · expérience Fortnite sur-mesure · agence Fortnite · marketing gaming · activation gaming · expérience interactive Fortnite.

**Technique** : `sitemap.ts` et `robots.ts` déjà présents (à étendre aux nouvelles routes) · données structurées JSON-LD `Organization` + `Service` (composant `JsonLd` existant) · images en `next/image` · `alt` descriptifs.

---

## 5. Plan de tracking (conversion)

Événements à instrumenter (GA4 / Plausible / pixel) :

| Événement | Déclencheur |
|---|---|
| `cta_discuter_projet` | clic sur « Discuter de votre projet » (header + sections) |
| `cta_voir_realisations` | clic « Voir les réalisations » |
| `form_submit` | soumission du formulaire de contact |
| `cta_calendly` | clic « Réserver un appel de 15 min » |
| `cta_email` | clic sur lien email / mailto |
| `scroll_50` / `scroll_90` | profondeur de scroll 50 % / 90 % |
| `card_service_click` | clic sur une carte service |
| `realisation_click` | clic sur une carte réalisation |
| `cta_cible_*` | clic CTA d'une carte cible (marque / agence / créateur / esport) |

Prévoir un emplacement unique pour le snippet analytics (layout) + variables d'env pour les IDs.

---

## 6. Intégration dans le repo Next.js existant

Le repo (`Next.js 14 App Router`, `next-intl`, Tailwind, design system déjà en place) se prête bien à la refonte sans réécriture lourde :

- **Réutiliser** : `Header`/`Footer` (adapter la nav + CTA), `ScrollReveal`, `CountUp`, `JsonLd`, `cn()`, design tokens Tailwind, `MapLeaderboard`/`MapRow` (pour `/realisations`).
- **Refondre** : `Hero` (nouveau H1/preuves/CTA), remplacer les sections homepage par celles ci-dessus (Problème, Pour qui, Services, Réalisations, Process, Pourquoi, Idées, FAQ, CTA finale).
- **Créer** : routes `/activations-de-marque`, `/agences`, `/createurs-esport`, `/contact` (formulaire), enrichir `/services` et `/realisations`.
- **Contenu** : porter les textes FR dans `src/messages/fr.json` (et EN dans `en.json`), garder `maps.json` comme source de vérité du portfolio.
- **Données preuves** : `creator.json` contient déjà collaborateurs + stats agrégées ; ajouter les activations de marque (Recyclermonvehicule.fr, Krys, Alpine) avec leurs visuels dans `public/images/`.

> Le prototype HTML livré (`prototype-homepage.html`) sert de **référence visuelle** validée avant de porter le tout en composants React.
