import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { BriefForm } from "@/components/forms/BriefForm";
import { Cta } from "@/components/ui/Cta";
import { buildAlternates } from "@/lib/seo";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return {
    title: "Discuter de votre projet Fortnite",
    description: "Envoyez votre brief. Activation de marque, projet agence, map créateur ou esport — réponse sous 24 h.",
    alternates: buildAlternates("/contact", params.locale),
  };
}

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title="Discuter de votre projet"
        subtitle="Vous préparez une campagne gaming, une activation Gen Z ou une expérience Fortnite ? Envoyez votre brief — on revient vers vous sous 24 h."
        showProof={false}
      />
      <section className="bg-surface-dark pb-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">Comment ça se passe</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-400">
              <li><span className="font-semibold text-white">1.</span> Vous décrivez votre idée, votre audience et votre objectif.</li>
              <li><span className="font-semibold text-white">2.</span> On revient sous 24 h avec un premier retour et des questions.</li>
              <li><span className="font-semibold text-white">3.</span> On vous propose un concept, un périmètre et un chiffrage clair.</li>
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <Cta href={`mailto:${PROOF.email}?subject=Brief%20projet%20Fortnite`} variant="ghost" event="cta_email">✉️ {PROOF.email}</Cta>
            </div>
            <p className="mt-6 text-sm text-slate-400">{TOTAL_MINUTES_LABEL} minutes jouées · {PROOF.collaborators.join(" · ")}</p>
          </div>
          <BriefForm />
        </div>
      </section>
    </main>
  );
}
