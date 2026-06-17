import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { SECTORS } from "@/content/site";

export function SectorIdeas() {
  return (
    <section id="idees" className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow="Idées d’activations" title="Quel type d’expérience Fortnite pourriez-vous créer ?" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECTORS.map((s, i) => (
            <ScrollReveal key={s.title} delay={`${(i % 4) * 60}ms`}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:border-primary/50 hover:bg-primary/[0.06]">
                <h3 className="flex items-center gap-2 font-heading text-base font-bold text-white"><span>{s.icon}</span>{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.text}</p>
              </div>
            </ScrollReveal>
          ))}
          <ScrollReveal delay="180ms">
            <div className="flex h-full flex-col justify-center rounded-2xl border border-accent/35 bg-accent/[0.05] p-5">
              <h3 className="font-heading text-base font-bold text-white">💡 Votre secteur ?</h3>
              <div className="mt-2">
                <Cta href="/contact" variant="micro" event="cta_idee_activation">Demander une idée d’activation →</Cta>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
