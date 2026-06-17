import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Process } from "@/components/sections/Process";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/ui/JsonLd";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "b2b.pages.services" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/services", params.locale),
  };
}

export default async function Page() {
  const t = await getTranslations("b2b.pages.services");
  return (
    <main>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Développement UEFN & activation de marque Fortnite",
          provider: { "@type": "Organization", name: "Kaio Corporation", url: "https://kaiocorp.com" },
          areaServed: "Worldwide",
        }}
      />
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        primaryCta={{ label: t("ctaPrimary"), href: "/contact" }}
        secondaryCta={{ label: t("ctaSecondary"), href: "/realisations" }}
      />
      <ServicesGrid withCta={false} />
      <Process />
      <FaqB2B />
      <FinalCta eyebrow={t("finalEyebrow")} title={t("finalTitle")} text={t("finalText")} />
    </main>
  );
}
