import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";

const LEVERS = [
  { ic: "⏱️", t: "Temps passé" },
  { ic: "🎮", t: "Interaction" },
  { ic: "🔁", t: "Partage communautaire" },
  { ic: "🏆", t: "Challenge" },
  { ic: "✨", t: "Expérience de marque" },
  { ic: "📈", t: "Visibilité organique" },
  { ic: "🤝", t: "Activation créateurs" },
];

export function Opportunity() {
  return (
    <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Le contexte"
          title="Les audiences jeunes ne veulent plus seulement regarder une publicité. Elles veulent interagir."
          lead="Fortnite est devenu bien plus qu'un jeu : c'est un espace d'attention, de communauté et d'expérience. Pour une marque, une agence ou un créateur, une expérience bien conçue devient un véritable actif d'engagement — pas une campagne qui s'éteint en 48 heures."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {LEVERS.map((l, i) => (
            <ScrollReveal key={l.t} delay={`${i * 50}ms`}>
              <div className="h-full rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-4 transition-all hover:-translate-y-1 hover:border-accent/40">
                <span className="mb-2 block text-xl">{l.ic}</span>
                <span className="text-sm font-semibold text-white">{l.t}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
