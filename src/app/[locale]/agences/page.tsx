import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Process } from "@/components/sections/Process";
import { ProjectGrid } from "@/components/sections/Realisations";
import { FinalCta } from "@/components/sections/FinalCta";
import { SectionHead } from "@/components/ui/SectionHead";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { buildAlternates } from "@/lib/seo";
import { REALISATIONS } from "@/content/realisations";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: "Partenaire technique Fortnite / UEFN pour agences",
    description: "Production UEFN & Verse en marque blanche pour vos campagnes clients. Vous gardez la relation, nous créons l'expérience.",
    alternates: buildAlternates("/agences", params.locale),
  };
}

const POINTS = [
  { t: "Marque blanche", d: "Nous produisons sous votre marque. Notre nom n'apparaît pas côté client final si vous le souhaitez." },
  { t: "Dès la phase concept", d: "Nous intervenons tôt pour sécuriser la faisabilité technique et chiffrer juste avant votre recommandation." },
  { t: "Production UEFN / Verse", d: "Game design, gameplay, scoring, UI, optimisation et publication — une équipe Fortnite sans recrutement." },
  { t: "Délais clairs", d: "Prototype en 1–2 semaines, production en 6–12 semaines selon le périmètre. Vous pilotez le client en confiance." },
];

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Pour les agences"
        title="Votre partenaire technique Fortnite / UEFN pour vos campagnes clients"
        subtitle="Vous gardez la relation client. Nous concevons et développons l'expérience Fortnite — en marque blanche si besoin."
        primaryCta={{ label: "Trouver un partenaire", href: "/contact" }}
        secondaryCta={{ label: "Voir les réalisations", href: "/realisations" }}
      />
      <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow="Le partenariat" title="Ajoutez Fortnite à votre offre, sans monter une équipe UEFN." />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {POINTS.map((p, i) => (
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
          <SectionHead eyebrow="Cas d'usage" title="Ce que nous produisons pour vos clients." />
          <div className="mt-10">
            <ProjectGrid items={REALISATIONS.slice(0, 6)} />
          </div>
        </div>
      </section>
      <FinalCta
        eyebrow="Partenariat"
        title="Un brief client à activer dans Fortnite ?"
        text="Envoyez-nous le contexte. On vous aide à cadrer la faisabilité, le concept et le chiffrage pour votre recommandation."
        defaultType="Projet agence"
      />
    </main>
  );
}
