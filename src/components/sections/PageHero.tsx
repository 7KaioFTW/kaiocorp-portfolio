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
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        <h1 className="mt-4 bg-gradient-to-r from-white via-[#cdb6ff] to-accent bg-clip-text font-heading text-3xl font-extrabold leading-[1.1] text-transparent sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">{subtitle}</p>
        {(primaryCta || secondaryCta) && (
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryCta && <Cta href={primaryCta.href} event="cta_discuter_projet">{primaryCta.label} →</Cta>}
            {secondaryCta && <Cta href={secondaryCta.href} variant="ghost">{secondaryCta.label}</Cta>}
          </div>
        )}
        {showProof && (
          <p className="mt-7 text-sm text-slate-500">
            <span className="font-heading font-bold text-white">{TOTAL_MINUTES_LABEL}</span> {t("hero.badgeMinutes")} · {PROOF.collaborators.join(" · ")}
          </p>
        )}
      </div>
    </section>
  );
}
