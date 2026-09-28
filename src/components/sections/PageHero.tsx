import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  showProof?: boolean;
}

export async function PageHero({ eyebrow, title, subtitle, primaryCta, secondaryCta, showProof = true }: PageHeroProps) {
  const t = await getTranslations("b2b");
  return (
    <section className="relative overflow-hidden bg-surface-dark pb-16 pt-36 md:pt-40">
      <div
        className="absolute inset-0 z-0"
        style={{ background: "radial-gradient(55% 50% at 78% 12%, rgba(123,47,190,0.28), transparent 70%), radial-gradient(45% 45% at 10% 90%, rgba(0,212,255,0.14), transparent 70%)" }}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <p data-motion="decode" className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        <div data-text={title} className="hero-glitch hero-rise mt-4 font-heading text-3xl font-extrabold leading-[1.1] sm:text-4xl md:text-5xl">
          <h1 className="hero-sweep bg-clip-text text-transparent">{title}</h1>
        </div>
        <p className="hero-rise mt-5 max-w-2xl text-base leading-relaxed text-slate-400 [--d:120ms] md:text-lg">{subtitle}</p>
        {(primaryCta || secondaryCta) && (
          <div className="hero-fade-rise mt-7 flex flex-wrap gap-3 [--d:300ms]">
            {primaryCta && <Cta href={primaryCta.href} event="cta_discuter_projet">{primaryCta.label} →</Cta>}
            {secondaryCta && <Cta href={secondaryCta.href} variant="ghost">{secondaryCta.label}</Cta>}
          </div>
        )}
        {showProof && (
          <p className="hero-fade-rise mt-7 text-sm text-slate-500 [--d:420ms]">
            <span data-motion="decode" className="font-heading font-bold text-white">{TOTAL_MINUTES_LABEL}</span> {t("hero.badgeMinutes")} · {PROOF.collaborators.join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}
