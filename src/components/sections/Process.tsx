import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { PROCESS } from "@/content/site";

export function Process() {
  return (
    <section id="process" className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow="Process" title="Un process simple, de l'idée à la publication." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map((s, i) => (
            <ScrollReveal key={s.n} delay={`${(i % 3) * 60}ms`}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent font-heading text-sm font-extrabold text-surface-dark">{s.n}</div>
                <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
