import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FinalCta } from "@/components/sections/FinalCta";
import { Cta } from "@/components/ui/Cta";
import { buildAlternates } from "@/lib/seo";
import { REALISATIONS } from "@/content/realisations";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: `Réalisations — ${TOTAL_MINUTES_LABEL} minutes jouées`,
    description: "Maps créateurs, activations de marque et formats compétitifs joués pendant des milliards de minutes dans Fortnite.",
    alternates: buildAlternates("/realisations", params.locale),
  };
}

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Réalisations"
        title="Des expériences jouées pendant des milliards de minutes"
        subtitle="Des maps qui retiennent, des marques qui activent, des communautés qui reviennent. Chaque projet est présenté par son objectif et son résultat — pas seulement sa technique."
        primaryCta={{ label: "Discuter de votre projet", href: "/contact" }}
        secondaryCta={{ label: "Voir le classement des maps", href: "/maps" }}
      />
      <section className="border-t border-white/5 bg-surface-dark py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="sr-only">Toutes les réalisations</h2>
          <ProjectGrid items={REALISATIONS} />
          <div className="mt-9">
            <Cta href="/maps" variant="micro" event="realisation_click">Voir toutes les maps & leurs statistiques →</Cta>
          </div>
        </div>
      </section>
      <FinalCta
        eyebrow="À votre tour"
        title="Et si la prochaine réalisation était la vôtre ?"
        text="Marque, agence, créateur ou structure esport — parlons de l'expérience Fortnite que vous voulez créer."
      />
    </main>
  );
}
