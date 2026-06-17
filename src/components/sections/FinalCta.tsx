import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Cta } from "@/components/ui/Cta";
import { BriefForm } from "@/components/forms/BriefForm";
import { PROOF, type ProjectType } from "@/content/site";

interface FinalCtaProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  defaultType?: ProjectType;
}

export function FinalCta({
  id = "contact",
  eyebrow = "Discutons",
  title = "Vous préparez une campagne gaming, une activation Gen Z ou une expérience Fortnite ?",
  text = "Parlons de votre idée. Nous transformons un brief marketing, une communauté ou un univers de marque en expérience Fortnite jouable.",
  defaultType,
}: FinalCtaProps) {
  return (
    <section id={id} className="border-t border-white/5 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(123,47,190,0.16),transparent_70%)] py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-2">
        <ScrollReveal>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
          <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400 md:text-lg">{text}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Cta href={`mailto:${PROOF.email}?subject=Brief%20projet%20Fortnite`} variant="ghost" event="cta_email">✉️ Envoyer un brief</Cta>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px] shadow-accent" />
            Réponse sous 24&nbsp;h · {PROOF.email}
          </p>
        </ScrollReveal>
        <ScrollReveal delay="120ms">
          <BriefForm defaultType={defaultType} />
        </ScrollReveal>
      </div>
    </section>
  );
}
