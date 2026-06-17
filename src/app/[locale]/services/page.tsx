import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Process } from "@/components/sections/Process";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { JsonLd } from "@/components/ui/JsonLd";
import { buildAlternates } from "@/lib/seo";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: "Services UEFN, Verse & activation Fortnite",
    description: "Development UEFN, Verse scripting, game design, systèmes ranked, UI, maintenance. Du concept à la publication.",
    alternates: buildAlternates("/services", params.locale),
  };
}

export default function Page() {
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
        eyebrow="Services"
        title="Des expériences Fortnite, du concept à la publication"
        subtitle="Nous utilisons UEFN et Verse pour créer des mécaniques personnalisées : scoring, progression, classement, UI et gameplay sur-mesure. Chaque prestation sert un objectif d'engagement."
        primaryCta={{ label: "Discuter de votre projet", href: "/contact" }}
        secondaryCta={{ label: "Voir les réalisations", href: "/realisations" }}
      />
      <ServicesGrid withCta={false} />
      <Process />
      <FaqB2B />
      <FinalCta
        eyebrow="Un besoin précis ?"
        title="Parlons du périmètre de votre projet"
        text="Activation, map compétitive, tycoon, système ranked ou simple maintenance — dites-nous ce dont vous avez besoin."
      />
    </main>
  );
}
