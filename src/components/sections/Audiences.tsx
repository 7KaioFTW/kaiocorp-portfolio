import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { AUDIENCES } from "@/content/site";

export function Audiences() {
  return (
    <section id="pour-qui" className="bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow="Pour qui ?" title="Une seule expertise, quatre façons de l'activer." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a, i) => (
            <ScrollReveal key={a.slug} delay={`${i * 70}ms`}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-surface to-surface/40 p-6 transition-all hover:-translate-y-1.5 hover:border-accent/45">
                <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">{a.tag}</span>
                <h3 className="mt-2.5 font-heading text-lg font-bold text-white">{a.title}</h3>
                <p className="mt-2.5 text-sm text-slate-400">{a.text}</p>
                <p className="my-4 border-l-2 border-primary pl-3 text-xs text-slate-500">{a.examples}</p>
                <div className="mt-auto">
                  <Cta href={a.href} variant="micro" event="cta_cible" eventParams={{ cible: a.slug }}>
                    {a.cta} →
                  </Cta>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
