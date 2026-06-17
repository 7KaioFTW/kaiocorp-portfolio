// Contenu B2B FR — source unique pour la homepage et les pages dédiées.
// (FR-first ; portage EN possible ultérieurement via next-intl.)

import creatorData from "@/data/creator.json";

// Collaborateurs et email proviennent de creator.json (source unique).
// Le total de minutes est calculé depuis maps.json — voir @/lib/stats (TOTAL_MINUTES_LABEL).
export const PROOF = {
  collaborators: creatorData.collaborators.map((c) => c.name),
  brands: ["Recyclermonvehicule.fr", "Krys", "Alpine"],
  email: creatorData.email,
};

export const POSITIONING =
  "Nous aidons les marques, agences et créateurs à transformer Fortnite en canal d'engagement grâce à des expériences UEFN sur-mesure.";

export type Audience = {
  slug: string;
  tag: string;
  title: string;
  text: string;
  examples: string;
  cta: string;
  href: string;
};

export const AUDIENCES: Audience[] = [
  {
    slug: "marques",
    tag: "Marques",
    title: "Pour les marques",
    text: "Lancez une activation Fortnite autour de votre univers, d'un produit, d'un événement ou d'une campagne Gen Z.",
    examples: "Mini-jeu de marque · course · tycoon · challenge communautaire · expérience événementielle.",
    cta: "Imaginer une activation",
    href: "/activations-de-marque",
  },
  {
    slug: "agences",
    tag: "Agences",
    title: "Pour les agences",
    text: "Ajoutez Fortnite à vos recommandations clients sans recruter une équipe UEFN en interne.",
    examples: "Partenariat technique · production en marque blanche · expériences pour campagnes gaming.",
    cta: "Trouver un partenaire",
    href: "/agences",
  },
  {
    slug: "createurs",
    tag: "Créateurs",
    title: "Pour les créateurs",
    text: "Créez une map à votre image pour engager votre communauté, prolonger votre contenu et bâtir un actif durable.",
    examples: "1v1 · boxfight · zone wars · ranked maps · realistic fights.",
    cta: "Créer ma map",
    href: "/createurs-esport",
  },
  {
    slug: "esport",
    tag: "Esport",
    title: "Pour l'esport",
    text: "Animez votre communauté avec une expérience Fortnite propriétaire : tournois, challenges, classements, sponsors.",
    examples: "Ligues · événements communautaires · support sponsor · actif propriétaire.",
    cta: "Créer une expérience esport",
    href: "/createurs-esport",
  },
];

export type Service = { icon: string; title: string; benefit: string; example: string };

export const SERVICES: Service[] = [
  { icon: "🚀", title: "Activations de marque", benefit: "Transformez un brief marketing en expérience jouable.", example: "Ex. drop produit, challenge de marque." },
  { icon: "⚔️", title: "Maps compétitives", benefit: "Une rétention forte sur des formats que les joueurs rejouent.", example: "Ex. 1v1, boxfight, zone wars." },
  { icon: "🎯", title: "Mini-jeux & challenges", benefit: "Un format simple, viral et partageable.", example: "Ex. challenge d'adresse, course." },
  { icon: "🏗️", title: "Tycoons / simulateurs", benefit: "Des sessions longues et une progression addictive.", example: "Ex. Carlife Tycoon (~80 min/session)." },
  { icon: "🎪", title: "Expériences événementielles", benefit: "Un temps fort autour d'un lancement.", example: "Ex. scène virtuelle, quête de festival." },
  { icon: "📊", title: "Ranked / scoring / leaderboards", benefit: "De la compétition qui fait revenir.", example: "Ex. classement saisonnier, ligues." },
  { icon: "🖥️", title: "UI personnalisée", benefit: "Votre marque présente dans chaque écran.", example: "Ex. HUD, menus, branding in-game." },
  { icon: "⚙️", title: "Verse scripting", benefit: "Des mécaniques impossibles en Creative standard.", example: "Ex. logique de jeu, devices custom." },
  { icon: "⚡", title: "Optimisation / performance", benefit: "Une expérience fluide = des joueurs qui restent.", example: "Ex. budget mémoire, draw calls." },
  { icon: "🔧", title: "Publication & maintenance", benefit: "Un actif vivant, pas un one-shot.", example: "Ex. équilibrage, nouvelles versions." },
];

export type Step = { n: number; title: string; text: string };

export const PROCESS: Step[] = [
  { n: 1, title: "Brief stratégique", text: "On clarifie la cible, l'objectif, l'univers, les mécaniques et les contraintes." },
  { n: 2, title: "Concept & game design", text: "On transforme l'idée en expérience jouable avec des mécaniques engageantes." },
  { n: 3, title: "Prototype", text: "Une première version jouable pour valider rapidement la direction." },
  { n: 4, title: "Développement UEFN / Verse", text: "Gameplay, UI, scoring, optimisation, assets et logique de jeu." },
  { n: 5, title: "Publication & lancement", text: "Soumission, support, itérations et stratégie de lancement." },
  { n: 6, title: "Maintenance & optimisation", text: "Corrections, nouvelles versions, équilibrage, amélioration continue." },
];

export const WHY: string[] = [
  "Des **milliards de minutes** jouées sur nos expériences.",
  "Une **expérience terrain** sur ce qui retient réellement les joueurs.",
  "Maîtrise technique **UEFN / Verse / Unreal Engine 5**.",
  "Capacité à travailler avec **créateurs, agences et marques**.",
  "Une approche à la fois **game design, technique et marketing**.",
  "Des expériences optimisées pour **l'engagement**, pas seulement l'esthétique.",
];

export type Sector = { icon: string; title: string; text: string };

export const SECTORS: Sector[] = [
  { icon: "🏅", title: "Sport", text: "Challenge d'adresse, course, entraînement, compétition communautaire." },
  { icon: "🏎️", title: "Automobile", text: "Circuit, course, exploration de véhicule, challenge chronométré." },
  { icon: "👟", title: "Mode / sneakers", text: "Drop virtuel, parcours immersif, mini-jeu autour d'une collection." },
  { icon: "🎵", title: "Musique / festival", text: "Expérience événementielle, scène virtuelle, quête autour d'un artiste." },
  { icon: "🎓", title: "Éducation / jeunesse", text: "Map pédagogique, expérience ludique, challenge collectif." },
  { icon: "🎬", title: "Entertainment", text: "Univers immersif, teasing de série/film, mission narrative." },
  { icon: "🧩", title: "Agences", text: "Activation clé en main à proposer à un client." },
];

export type QA = { q: string; a: string };

export const FAQ: QA[] = [
  { q: "Pourquoi créer une expérience Fortnite pour une marque ?", a: "C'est le seul média où votre audience joue avec vous au lieu de simplement vous regarder : temps d'attention long, interaction réelle, partage communautaire, et un actif qui dure au-delà d'une campagne." },
  { q: "Combien coûte une map Fortnite sur-mesure ?", a: "Cela dépend du périmètre (format, mécaniques, durée de vie). Les formats simples démarrent dans les bas milliers ; une activation de marque avec Verse custom est plus élevée. On vous donne un chiffrage clair après le brief." },
  { q: "Combien de temps faut-il pour créer une expérience ?", a: "D'un prototype jouable en 1 à 2 semaines, à 6–12 semaines pour une expérience complète, selon la complexité des mécaniques." },
  { q: "Peut-on créer une activation ponctuelle ?", a: "Oui : un temps fort événementiel comme un actif durable. On adapte le format à votre objectif et votre calendrier." },
  { q: "Peut-on maintenir une map dans le temps ?", a: "Oui, c'est notre force : certaines de nos maps dépassent la version 200, mises à jour au fil du meta Fortnite." },
  { q: "Travaillez-vous avec des agences ?", a: "Oui, en partenariat technique ou en marque blanche. Vous gardez la relation client, nous produisons l'expérience." },
  { q: "Peut-on créer une expérience en marque blanche ?", a: "Oui, sans que notre nom apparaisse côté client final." },
  { q: "Quelle différence entre une map et une activation de marque ?", a: "Une map est un format de jeu ; une activation est une map pensée autour de votre univers, vos objectifs marketing et votre mesure de performance." },
  { q: "Est-ce adapté à une marque qui n'a jamais fait de gaming ?", a: "Oui : on traduit votre brief marketing en expérience jouable, sans que vous ayez à maîtriser l'aspect technique." },
  { q: "Comment mesure-t-on les résultats ?", a: "Minutes jouées, rétention (D1/D7), favoris, pics de joueurs simultanés, temps de session — des métriques concrètes d'engagement." },
];

export type ProjectType = "Activation de marque" | "Projet agence" | "Map créateur" | "Projet esport" | "Maintenance / optimisation" | "Je ne sais pas encore";

export const PROJECT_TYPES: ProjectType[] = [
  "Activation de marque",
  "Projet agence",
  "Map créateur",
  "Projet esport",
  "Maintenance / optimisation",
  "Je ne sais pas encore",
];

export const BUDGETS = ["À définir", "< 5 000 €", "5 000 – 15 000 €", "15 000 – 40 000 €", "> 40 000 €"];
