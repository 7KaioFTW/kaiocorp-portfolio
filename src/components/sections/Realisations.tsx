import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { REALISATIONS, type ProjectCard } from "@/content/realisations";

export function ProjectGrid({ items }: { items: ProjectCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <ScrollReveal key={p.title} delay={`${(i % 3) * 60}ms`}>
          <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-surface transition-all hover:-translate-y-1.5 hover:border-accent/45">
            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1b1430] to-[#0c1730]">
              <Image src={p.thumbnail} alt={p.title} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/10 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-surface-dark/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent backdrop-blur-sm">{p.type}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h3 className="font-heading text-base font-bold text-white">{p.title}</h3>
              <p className="text-sm text-slate-400">{p.objective}</p>
              <p className="mt-auto flex items-center gap-2 pt-2 text-sm font-semibold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
                {p.result}
              </p>
            </div>
          </article>
        </ScrollReveal>
      ))}
    </div>
  );
}

export function Realisations() {
  return (
    <section id="realisations" className="bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead
          eyebrow="Réalisations"
          title="Des expériences jouées pendant des milliards de minutes."
          lead="Des maps qui retiennent, des marques qui activent, des communautés qui reviennent."
        />
        <div className="mt-12">
          <ProjectGrid items={REALISATIONS} />
        </div>
        <div className="mt-9">
          <Cta href="/realisations" variant="micro" event="cta_voir_realisations">Voir toutes les réalisations →</Cta>
        </div>
      </div>
    </section>
  );
}
