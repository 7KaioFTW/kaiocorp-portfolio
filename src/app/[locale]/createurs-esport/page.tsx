import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FinalCta } from "@/components/sections/FinalCta";
import { SectionHead } from "@/components/ui/SectionHead";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buildAlternates } from "@/lib/seo";
import { COMPETITIVE_CASES } from "@/content/realisations";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: "Créateurs & Esport — Créez votre map Fortnite",
    description: "Une map à votre image : formats compétitifs, classements, tournois, sponsors. Engagez votre communauté et bâtissez un actif durable.",
    alternates: buildAlternates("/createurs-esport", params.locale),
  };
}

const FORMATS = [
  { t: "Formats compétitifs", d: "1v1, boxfight, zone wars, realistics, ranked — les formats que votre communauté rejoue tous les jours." },
  { t: "Engagement communautaire", d: "Une map à votre image qui prolonge votre contenu et fait revenir vos viewers entre deux streams." },
  { t: "Classements & tournois", d: "Ranked systems, leaderboards saisonniers, événements et challenges pour animer la communauté." },
  { t: "Sponsors & actif propriétaire", d: "Un espace de marque que vous contrôlez : support sponsor, branding, et revenus d'engagement." },
];

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Créateurs & Esport"
        title="Créez une map Fortnite à votre image"
        subtitle="Engagez votre communauté, prolongez votre contenu et construisez un actif durable. Des formats compétitifs aux expériences esport propriétaires."
        primaryCta={{ label: "Créer ma map", href: "/contact" }}
        secondaryCta={{ label: "Voir les réalisations", href: "/realisations" }}
      />
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow="Ce qu'on construit" title="Une map pensée pour la rétention et la communauté." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FORMATS.map((f, i) => (
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
          <SectionHead eyebrow="Réalisations créateurs" title="Des maps créateurs jouées des milliards de minutes." lead="Nos collaborations avec Martoz et d'autres créateurs ont généré une rétention parmi les meilleures du mode compétitif." />
          <div className="mt-10">
            <ProjectGrid items={COMPETITIVE_CASES} />
          </div>
        </div>
      </section>
      <FinalCta
        eyebrow="On en parle"
        title="Prêt à créer la map de votre communauté ?"
        text="Dites-nous votre univers, votre format et votre objectif. On transforme ça en map jouable, optimisée pour la rétention."
        defaultType="Map créateur"
      />
    </main>
  );
}
