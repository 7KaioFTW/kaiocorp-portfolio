import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PROOF, WHY } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

function Rich({ text }: { text: string }) {
  // renders **bold** segments
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export function WhyKaio() {
  return (
    <section id="pourquoi" className="bg-surface-dark py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.1fr_1fr]">
        <ScrollReveal>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">Pourquoi KaioCorp ?</p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">Une expertise Fortnite prouvée par l’usage réel.</h2>
          <ul className="mt-7 flex flex-col gap-3.5">
            {WHY.map((w) => (
              <li key={w} className="flex items-start gap-3">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-lg border border-accent/30 bg-accent/10 text-xs font-bold text-accent">✓</span>
                <p className="text-[15px] text-slate-300"><Rich text={w} /></p>
              </li>
            ))}
          </ul>
        </ScrollReveal>
        <ScrollReveal delay="120ms">
          <div className="rounded-2xl border border-white/[0.07] bg-[radial-gradient(70%_60%_at_70%_10%,rgba(123,47,190,0.2),transparent),#12121A] p-8 text-center">
            <div className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-5xl font-extrabold text-transparent md:text-6xl">{TOTAL_MINUTES_LABEL}</div>
            <p className="mt-1.5 text-slate-400">minutes jouées sur les expériences développées</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {PROOF.collaborators.map((c) => (
                <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300">{c}</span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
