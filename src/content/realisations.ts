// Réalisations dérivées de la source de vérité maps.json — stats réelles.
// Le texte (type, objectif, unités) vit dans les messages next-intl (b2b.realisations).
import mapsData from "@/data/maps.json";
import type { RingMapInfo } from "@/lib/three/island/types";
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

// The 10 maps shown as screens in the homepage's 3D ring chapter (and in its accessible HTML list),
// in ring order (= prototype order). `tag` must be one of the map's maps.json tags (tested).
// sprite-pillars is left out: its thumbnail file is still missing.
const RING: { id: string; tag: string }[] = [
  { id: "clutch-realistics-1v2", tag: "BOXFIGHT" },
  { id: "martoz-1v1-build-fights", tag: "BUILDING" },
  { id: "martoz-turtle-fights-ffa", tag: "FREE FOR ALL" },
  { id: "pro-endgame-cup-duo", tag: "ZONEWARS" },
  { id: "clutch-realistics-2v3", tag: "TRIOS" },
  { id: "boxfight-2v2-ranked", tag: "BOXFIGHT" },
  { id: "carlife-tycoon", tag: "SIMULATOR" },
  { id: "the-box", tag: "PVP" },
  { id: "senses-rush", tag: "DEATHRUN" },
  { id: "rift-racers-alpine", tag: "RACE" },
];

export const RING_MAPS: RingMapInfo[] = RING.map(({ id, tag }) => {
  const m = byId(id);
  return { id, title: m.title, creator: m.creator, minutes: m.stats.minutesPlayed, tag, thumbnail: m.thumbnail };
});
