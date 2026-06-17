import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export async function Hero() {
  const t = await getTranslations("b2b.hero");
  return (
    <section className="relative overflow-hidden bg-surface-dark pb-20 pt-36 md:pt-44">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 75% 15%, rgba(123,47,190,0.32), transparent 70%), radial-gradient(50% 45% at 12% 85%, rgba(0,212,255,0.18), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 max-w-[14ch] bg-gradient-to-r from-white via-[#cdb6ff] to-accent bg-clip-text font-heading text-4xl font-extrabold leading-[1.08] text-transparent sm:text-5xl md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-xl">
          {t("subtitle")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            <b className="font-heading font-bold text-white">{TOTAL_MINUTES_LABEL}</b> {t("badgeMinutes")}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            {PROOF.collaborators.join(" · ")}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px] shadow-accent" />
            {t("badgeActivations")} {PROOF.brands.join(" · ")}
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Cta href="/contact" event="cta_discuter_projet" eventParams={{ from: "hero" }}>{t("ctaPrimary")} →</Cta>
          <Cta href="/realisations" variant="ghost" event="cta_voir_realisations" eventParams={{ from: "hero" }}>{t("ctaSecondary")}</Cta>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-light shadow-[0_0_8px] shadow-primary-light" />
          {t("tagline")}
        </p>
      </div>
    </section>
  );
}
