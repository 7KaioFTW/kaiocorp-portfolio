import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Opportunity } from "@/components/sections/Opportunity";
import { SectorIdeas } from "@/components/sections/SectorIdeas";
import { Process } from "@/components/sections/Process";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { SectionHead } from "@/components/ui/SectionHead";
import { buildAlternates } from "@/lib/seo";
import { REALISATIONS, BRAND_CASES } from "@/content/realisations";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: "Activation de marque Fortnite",
    description: "Engagez votre audience Gen Z avec une activation Fortnite sur-mesure. De l'idée à la publication. Pour marques & agences.",
    alternates: buildAlternates("/activations-de-marque", params.locale),
  };
}

export default function Page() {
  const brandCases = BRAND_CASES;
  return (
    <main>
      <PageHero
        eyebrow="Activations de marque"
        title="Créez une activation Fortnite pour engager votre audience"
        subtitle="Transformez un brief marketing, un produit ou un événement en expérience Fortnite jouable. Vous touchez une audience Gen Z là où elle passe son temps — en jouant, pas en scrollant."
        primaryCta={{ label: "Imaginer une activation", href: "/contact" }}
        secondaryCta={{ label: "Voir les réalisations", href: "/realisations" }}
      />
      <Opportunity />
      <SectorIdeas />
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow="Réalisations" title="Des activations de marque déjà jouées." lead="Des marques qui passent du message à l'expérience interactive." />
          <div className="mt-10">
            <ProjectGrid items={brandCases.length ? brandCases : REALISATIONS.slice(0, 3)} />
          </div>
        </div>
      </section>
      <Process />
      <FaqB2B />
      <FinalCta
        eyebrow="Discutons"
        title="Une campagne Gen Z, un lancement produit, un événement ?"
        text="Parlons de votre brief. On vous propose un concept d'activation Fortnite adapté à votre univers et vos objectifs marketing."
        defaultType="Activation de marque"
      />
    </main>
  );
}
