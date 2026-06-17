import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { Opportunity } from "@/components/sections/Opportunity";
import { SectorIdeas } from "@/components/sections/SectorIdeas";
import { Process } from "@/components/sections/Process";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { SectionHead } from "@/components/ui/SectionHead";
import { buildAlternates } from "@/lib/seo";
import { REALISATIONS_META, BRAND_CASES_META } from "@/content/realisations";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "b2b.pages.activations" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/activations-de-marque", params.locale),
  };
}

export default async function Page() {
  const t = await getTranslations("b2b.pages.activations");
  const brandCases = BRAND_CASES_META;
  return (
    <main>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        primaryCta={{ label: t("ctaPrimary"), href: "/contact" }}
        secondaryCta={{ label: t("ctaSecondary"), href: "/realisations" }}
      />
      <Opportunity />
      <SectorIdeas />
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={t("casesEyebrow")} title={t("casesTitle")} lead={t("casesLead")} />
          <div className="mt-10">
            <ProjectGrid items={brandCases.length ? brandCases : REALISATIONS_META.slice(0, 3)} />
          </div>
        </div>
      </section>
      <Process />
      <FaqB2B />
      <FinalCta eyebrow={t("finalEyebrow")} title={t("finalTitle")} text={t("finalText")} defaultType="brand_activation" />
    </main>
  );
}
