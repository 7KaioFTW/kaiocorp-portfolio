import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FinalCta } from "@/components/sections/FinalCta";
import { SectionHead } from "@/components/ui/SectionHead";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buildAlternates } from "@/lib/seo";
import { COMPETITIVE_CASES_META } from "@/content/realisations";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "b2b.pages.createurs" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/createurs-esport", params.locale),
  };
}

export default async function Page() {
  const t = await getTranslations("b2b.pages.createurs");
  const formats = t.raw("formats") as { t: string; d: string }[];
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
          <SectionHead eyebrow={t("buildEyebrow")} title={t("buildTitle")} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {formats.map((f, i) => (
              <ScrollReveal key={f.t} delay={`${(i % 2) * 70}ms`}>
                <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                  <h3 className="font-heading text-base font-bold text-white">{f.t}</h3>
                  <p className="mt-2 text-sm text-slate-400">{f.d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={t("casesEyebrow")} title={t("casesTitle")} lead={t("casesLead")} />
          <div className="mt-10">
            <ProjectGrid items={COMPETITIVE_CASES_META} />
          </div>
        </div>
      </section>
      <FinalCta eyebrow={t("finalEyebrow")} title={t("finalTitle")} text={t("finalText")} defaultType="creator" />
    </main>
  );
}
