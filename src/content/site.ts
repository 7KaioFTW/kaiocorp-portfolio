// Structure B2B (non traduisible) — le TEXTE vit dans les messages next-intl (namespace `b2b`).
// Collaborateurs et email proviennent de creator.json (source unique).
// Le total de minutes est calculé depuis maps.json — voir @/lib/stats (TOTAL_MINUTES_LABEL).
import creatorData from "@/data/creator.json";

export const PROOF = {
  collaborators: creatorData.collaborators.map((c) => c.name),
  brands: ["Recyclermonvehicule.fr", "Krys", "Alpine"],
  email: creatorData.email,
};

// Liens/slugs des audiences (href stable, libellés traduits dans b2b.audiences.items).
export const AUDIENCE_LINKS = [
  { slug: "marques", href: "/activations-de-marque" as const },
  { slug: "agences", href: "/agences" as const },
  { slug: "createurs", href: "/createurs-esport" as const },
  { slug: "esport", href: "/createurs-esport" as const },
];

// Icônes (universelles) — alignées par index avec b2b.services.items / b2b.sectors.items.
export const SERVICE_ICONS = ["🚀", "⚔️", "🎯", "🏗️", "🎪", "📊", "🖥️", "⚙️", "⚡", "🔧"];
export const SECTOR_ICONS = ["🏅", "🏎️", "👟", "🎵", "🎓", "🎬", "🧩"];

// Types pour caster les tableaux lus via t.raw().
export type AudienceText = { tag: string; title: string; text: string; examples: string; cta: string };
export type ServiceText = { title: string; benefit: string; example: string };
export type StepText = { title: string; text: string };
export type SectorText = { title: string; text: string };
export type QA = { q: string; a: string };
export type ProjectTypeOption = { value: string; label: string };

// Valeur de formulaire stable (indépendante de la langue) — le libellé est traduit.
export type ProjectType = "brand_activation" | "agency" | "creator" | "esport" | "maintenance" | "unsure";
