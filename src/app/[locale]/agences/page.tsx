import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { Process } from "@/components/sections/Process";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FinalCta } from "@/components/sections/FinalCta";
import { SectionHead } from "@/components/ui/SectionHead";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buildAlternates } from "@/lib/seo";
import { REALISATIONS_META } from "@/content/realisations";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "b2b.pages.agences" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/agences", params.locale),
  };
}

export default async function Page() {
  const t = await getTranslations("b2b.pages.agences");
  const points = t.raw("points") as { t: string; d: string }[];
  return (
    <main>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        primaryCta={{ label: t("ctaPrimary"), href: "/contact" }}
        secondaryCta={{ label: t("ctaSecondary"), href: "/realisations" }}
      />
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={t("partnershipEyebrow")} title={t("partnershipTitle")} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {points.map((p, i) => (
              <ScrollReveal key={p.t} delay={`${(i % 2) * 70}ms`}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                  <h3 className="font-heading text-base font-bold text-white">{p.t}</h3>
                  <p className="mt-2 text-sm text-slate-400">{p.d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <Process />
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={t("casesEyebrow")} title={t("casesTitle")} />
          <div className="mt-10">
            <ProjectGrid items={REALISATIONS_META.slice(0, 6)} />
          </div>
        </div>
      </section>
      <FinalCta eyebrow={t("finalEyebrow")} title={t("finalTitle")} text={t("finalText")} defaultType="agency" />
    </main>
  );
}
