import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Toggle3D } from "@/components/three/Toggle3D";
import { Cta } from "@/components/ui/Cta";
import { Glass } from "@/components/ui/Glass";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

// Homepage-only, always over the 3D world (spec specs/2026-09-27-3d-island-homepage.md §3.3).
export async function Hero() {
  const t = await getTranslations("b2b.hero");
  const title = t("title");
  return (
    <section
      data-island-chapter="hero"
      className="relative overflow-hidden pb-20 pt-36 md:pt-44 island-over3d flex min-h-[100svh] items-center"
    >
      {/* Poster = the 3D hero frame (Task 12). Decorative → alt="". Crossfades out once the canvas is live. */}
      <Image src="/images/island-poster.webp" alt="" fill priority sizes="100vw" className="island-poster z-0 object-cover object-[62%_50%]" />
      <div aria-hidden="true" className="island-poster absolute inset-x-0 bottom-0 z-0 h-48 bg-gradient-to-b from-transparent to-surface-dark" />

      <div data-motion="parallax" data-speed="0.15" className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <Glass on className="max-w-3xl">
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
          <p className="hero-fade-rise mt-5 flex items-center gap-2 text-sm text-slate-400 [--d:700ms]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-light shadow-[0_0_8px] shadow-primary-light" />
            {t("tagline")}
          </p>
          <Toggle3D className="hero-fade-rise mt-6 [--d:780ms]" />
        </Glass>
      </div>
    </section>
  );
}
