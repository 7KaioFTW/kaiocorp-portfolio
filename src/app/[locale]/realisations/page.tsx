import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FinalCta } from "@/components/sections/FinalCta";
import { Cta } from "@/components/ui/Cta";
import { buildAlternates } from "@/lib/seo";
import { REALISATIONS_META } from "@/content/realisations";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "b2b.pages.realisations" });
  return {
    title: t("metaTitle", { minutes: TOTAL_MINUTES_LABEL }),
    description: t("metaDescription"),
    alternates: buildAlternates("/realisations", params.locale),
  };
}

export default async function Page() {
  const t = await getTranslations("b2b.pages.realisations");
  const tr = await getTranslations("b2b.realisations");
  return (
    <main>
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        primaryCta={{ label: t("ctaPrimary"), href: "/contact" }}
        secondaryCta={{ label: t("ctaSecondary"), href: "/maps" }}
      />
      <section className="border-t border-white/5 bg-surface-dark py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="sr-only">{tr("srHeading")}</h2>
          <ProjectGrid items={REALISATIONS_META} />
          <div className="mt-9">
            <Cta href="/maps" variant="micro" event="realisation_click">{tr("ctaAllMaps")} →</Cta>
          </div>
        </div>
      </section>
      <FinalCta eyebrow={t("finalEyebrow")} title={t("finalTitle")} text={t("finalText")} />
    </main>
  );
}
