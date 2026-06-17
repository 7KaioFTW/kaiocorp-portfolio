import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/sections/PageHero";
import { BriefForm } from "@/components/forms/BriefForm";
import { Cta } from "@/components/ui/Cta";
import { buildAlternates } from "@/lib/seo";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "b2b.pages.contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates("/contact", params.locale),
  };
}

export default async function Page() {
  const t = await getTranslations("b2b.pages.contact");
  const tf = await getTranslations("b2b.form");
  const tb = await getTranslations("b2b");
  const steps = tf.raw("steps") as string[];
  return (
    <main>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} showProof={false} />
      <section className="bg-surface-dark pb-24">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-xl font-bold text-white">{tf("howItWorksTitle")}</h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-400">
              {steps.map((s, i) => (
                <li key={s}><span className="font-semibold text-white">{i + 1}.</span> {s}</li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-3">
              <Cta href={`mailto:${PROOF.email}?subject=Brief%20projet%20Fortnite`} variant="ghost" event="cta_email">✉️ {PROOF.email}</Cta>
            </div>
            <p className="mt-6 text-sm text-slate-400">{TOTAL_MINUTES_LABEL} {tb("hero.badgeMinutes")} · {PROOF.collaborators.join(" · ")}</p>
          </div>
          <BriefForm />
        </div>
      </section>
    </main>
  );
}
