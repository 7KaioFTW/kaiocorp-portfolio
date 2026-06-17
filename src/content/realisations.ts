// Réalisations dérivées de la source de vérité maps.json — stats réelles.
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const maps = mapsData as FortniteMap[];
const byId = (id: string): FortniteMap => {
  const m = maps.find((x) => x.id === id);
  if (!m) throw new Error(`Map introuvable: ${id}`);
  return m;
};

export type ProjectCategory = "competitif" | "activation" | "tycoon";

export type ProjectCard = {
  id: string;
  category: ProjectCategory;
  badge: string;
  type: string;
  title: string;
  objective: string;
  result: string;
  thumbLabel: string;
  thumbnail: string;
  code: string;
};

const FEATURED: { id: string; category: ProjectCategory; type: string; objective: string; thumbLabel: string }[] = [
  { id: "clutch-realistics-1v2", category: "competitif", type: "Compétitif · Martoz", objective: "Engager une communauté autour d’un format clutch nerveux.", thumbLabel: "CLUTCH" },
  { id: "martoz-1v1-build-fights", category: "competitif", type: "Compétitif · Martoz", objective: "Un format d’entraînement 1v1 que les joueurs rejouent chaque jour.", thumbLabel: "1V1" },
  { id: "martoz-turtle-fights-ffa", category: "competitif", type: "Compétitif · Martoz", objective: "Un FFA fun et addictif, builds qui se réinitialisent en continu.", thumbLabel: "FFA" },
  { id: "carlife-tycoon", category: "activation", type: "Activation · Recyclermonvehicule.fr", objective: "Sensibiliser au recyclage automobile via un tycoon jouable, avec GamersOrigin.", thumbLabel: "CARLIFE" },
  { id: "senses-rush", category: "activation", type: "Activation · Krys", objective: "Faire vivre l’univers de la marque dans une expérience immersive, avec GamersOrigin.", thumbLabel: "KRYS" },
  { id: "rift-racers-alpine", category: "activation", type: "Activation · Alpine", objective: "Transformer l’expérience automobile Alpine en circuit jouable, avec GamersOrigin.", thumbLabel: "ALPINE" },
];

function resultLine(m: FortniteMap): string {
  return `${m.stats.minutesPlayed} min jouées · ${m.stats.favorites} favoris · v${m.version}`;
}

export const REALISATIONS: ProjectCard[] = FEATURED.map(({ id, category, type, objective, thumbLabel }) => {
  const m = byId(id);
  return { id, category, badge: thumbLabel, type, title: m.title, objective, result: resultLine(m), thumbLabel, thumbnail: m.thumbnail, code: m.code };
});

export const BRAND_CASES = REALISATIONS.filter((r) => r.category === "activation");
export const COMPETITIVE_CASES = REALISATIONS.filter((r) => r.category === "competitif");
