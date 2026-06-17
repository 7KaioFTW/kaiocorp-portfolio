// Réalisations dérivées de la source de vérité maps.json — stats réelles.
// Le texte (type, objectif, unités) vit dans les messages next-intl (b2b.realisations).
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const maps = mapsData as FortniteMap[];
const byId = (id: string): FortniteMap => {
  const m = maps.find((x) => x.id === id);
  if (!m) throw new Error(`Map introuvable: ${id}`);
  return m;
};

export type ProjectCategory = "competitif" | "activation" | "tycoon";

export type ProjectCardMeta = {
  id: string;
  category: ProjectCategory;
  title: FortniteMap["title"];
  thumbLabel: string;
  thumbnail: string;
  code: string;
  minutesPlayed: FortniteMap["stats"]["minutesPlayed"];
  favorites: FortniteMap["stats"]["favorites"];
  version: FortniteMap["version"];
};

const FEATURED: { id: string; category: ProjectCategory; thumbLabel: string }[] = [
  { id: "clutch-realistics-1v2", category: "competitif", thumbLabel: "CLUTCH" },
  { id: "martoz-1v1-build-fights", category: "competitif", thumbLabel: "1V1" },
  { id: "martoz-turtle-fights-ffa", category: "competitif", thumbLabel: "FFA" },
  { id: "carlife-tycoon", category: "activation", thumbLabel: "CARLIFE" },
  { id: "senses-rush", category: "activation", thumbLabel: "KRYS" },
  { id: "rift-racers-alpine", category: "activation", thumbLabel: "ALPINE" },
];

export const REALISATIONS_META: ProjectCardMeta[] = FEATURED.map(({ id, category, thumbLabel }) => {
  const m = byId(id);
  return {
    id,
    category,
    title: m.title,
    thumbLabel,
    thumbnail: m.thumbnail,
    code: m.code,
    minutesPlayed: m.stats.minutesPlayed,
    favorites: m.stats.favorites,
    version: m.version,
  };
});

export const BRAND_CASES_META = REALISATIONS_META.filter((r) => r.category === "activation");
export const COMPETITIVE_CASES_META = REALISATIONS_META.filter((r) => r.category === "competitif");
