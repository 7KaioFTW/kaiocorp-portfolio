import { ScrollReveal } from "@/components/ui/ScrollReveal";
import creatorData from "@/data/creator.json";
import mapsData from "@/data/maps.json";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

const brandCount = (mapsData as { brand?: string }[]).filter((m) => m.brand).length;
const { totalMaps, totalCollaborators } = creatorData.aggregateStats;

const STATS = [
  { num: TOTAL_MINUTES_LABEL, lbl: "Minutes jouées" },
  { num: `${totalMaps}+`, lbl: "Expériences livrées" },
  { num: `${totalCollaborators}`, lbl: "Créateurs & organisations" },
  { num: `${brandCount} marques`, lbl: "Activations de marque" },
];

export function StatsBand() {
  return (
    <section className="border-y border-white/5 bg-gradient-to-b from-primary/[0.07] to-transparent">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 text-center lg:grid-cols-4">
        {STATS.map((s, i) => (
          <ScrollReveal key={s.lbl} delay={`${i * 70}ms`}>
            <div className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-3xl font-extrabold text-transparent md:text-4xl lg:text-5xl">
              {s.num}
            </div>
            <div className="mt-1.5 text-sm text-slate-400">{s.lbl}</div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
