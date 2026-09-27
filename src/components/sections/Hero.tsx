import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { HeroShader } from "@/components/motion/HeroShader";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export async function Hero() {
  const t = await getTranslations("b2b.hero");
  const title = t("title");
  return (
    <section className="relative overflow-hidden bg-surface-dark pb-20 pt-36 md:pt-44">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 75% 15%, rgba(123,47,190,0.32), transparent 70%), radial-gradient(50% 45% at 12% 85%, rgba(0,212,255,0.18), transparent 70%)",
        }}
      />
      <HeroShader />
      <div className="hero-grid absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />

      <div data-motion="parallax" data-speed="0.15" className="relative z-10 mx-auto max-w-6xl px-6">
        <p data-motion="decode" className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {t("eyebrow")}
        </p>
        {/* LCP: painted opaque from frame 1 — entrance is transform/blur + decorative glitch only */}
        <div data-text={title} className="hero-glitch hero-rise mt-5 max-w-[14ch] font-heading text-4xl font-extrabold leading-[1.08] sm:text-5xl md:text-6xl">
          <h1 className="hero-sweep bg-clip-text text-transparent">{title}</h1>
        </div>
        <p className="hero-rise mt-5 max-w-2xl text-base leading-relaxed text-slate-400 [--d:120ms] md:text-xl">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="hero-fade-rise inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400 [--d:350ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            <b data-motion="decode" className="font-heading font-bold text-white">{TOTAL_MINUTES_LABEL}</b> {t("badgeMinutes")}
          </span>
          <span className="hero-fade-rise inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400 [--d:430ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            {PROOF.collaborators.join(" · ")}
          </span>
          <span className="hero-fade-rise inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400 [--d:510ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            {t("badgeActivations")} {PROOF.brands.join(" · ")}
          </span>
        </div>

        <div className="hero-fade-rise mt-8 flex flex-wrap gap-3 [--d:600ms]">
          <Cta href="/contact" event="cta_discuter_projet" eventParams={{ from: "hero" }}>{t("ctaPrimary")} →</Cta>
          <Cta href="/realisations" variant="ghost" event="cta_voir_realisations" eventParams={{ from: "hero" }}>{t("ctaSecondary")}</Cta>
        </div>
        <p className="hero-fade-rise mt-5 flex items-center gap-2 text-sm text-slate-500 [--d:700ms]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-light shadow-[0_0_8px] shadow-primary-light" />
          {t("tagline")}
        </p>
      </div>
    </section>
  );
}
