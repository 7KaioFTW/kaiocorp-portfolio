import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { JsonLd } from "@/components/ui/JsonLd";
import { buildAlternates } from "@/lib/seo";
import creatorData from "@/data/creator.json";
import type { Creator } from "@/types";

const creator = creatorData as Creator;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  return { title: t("servicesTitle"), description: t("servicesDescription"), alternates: buildAlternates("/services", params.locale) };
}

export default async function ServicesPage() {
  const t = await getTranslations("services");
  const tNav = await getTranslations("nav");

  const SERVICES = [
    { title: t("competitive"), desc: t("competitiveDesc") },
    { title: t("tycoon"), desc: t("tycoonDesc") },
    { title: t("custom"), desc: t("customDesc") },
    { title: t("verse"), desc: t("verseDesc") },
  ];
  const STEPS = [t("step1"), t("step2"), t("step3"), t("step4")];
  const FAQ = [
    { q: t("faq1q"), a: t("faq1a") }, { q: t("faq2q"), a: t("faq2a") }, { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") }, { q: t("faq5q"), a: t("faq5a") }, { q: t("faq6q"), a: t("faq6a") },
  ];

  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", serviceType: "UEFN Map Development", provider: { "@type": "Organization", name: "Kaio Corporation" }, areaServed: "Worldwide" }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <div className="mx-auto max-w-5xl px-6">
        <Breadcrumb items={[{ label: tNav("home"), href: "/" }, { label: tNav("services") }]} />
        <h1 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h1>
        <p className="mb-16 max-w-2xl text-base text-slate-400">{t("subtitle", { minutes: "4.8B+", collabs: "3" })}</p>

        <div className="mb-20 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (<div key={s.title} className="rounded-lg border border-white/5 bg-surface-light/50 p-6"><h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-white">{s.title}</h2><p className="text-xs leading-relaxed text-slate-400">{s.desc}</p></div>))}
        </div>

        <div className="mb-20">
          <h2 className="mb-8 font-heading text-xl font-bold uppercase tracking-wide text-white">{t("process")}</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {STEPS.map((step, i) => (<div key={i} className="rounded-lg border border-white/5 bg-surface-light/30 p-5"><span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 font-heading text-xs font-bold text-accent">{i + 1}</span><p className="mt-2 text-xs leading-relaxed text-slate-400">{step}</p></div>))}
          </div>
        </div>

        <div className="mb-20 rounded-lg border border-white/5 bg-surface-light/30 p-6 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400 md:gap-10">
            <span><strong className="font-heading text-lg text-white">4.8B+</strong> {t("statsPlayed")}</span>
            <span><strong className="font-heading text-lg text-white">3</strong> {t("statsCollabs")}</span>
            <span><strong className="font-heading text-lg text-white">241+</strong> {t("statsVersions")}</span>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="mb-6 font-heading text-xl font-bold uppercase tracking-wide text-white">{t("collaboratorsTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {creator.collaborators.map((col) => (<div key={col.name} className="rounded-lg border border-white/5 bg-surface-light/50 p-5"><h3 className="font-heading text-sm font-bold text-white">{col.name}</h3><p className="text-[11px] uppercase tracking-wider text-purple-300">{col.role}</p><p className="mt-2 text-xs text-slate-400">{col.description}</p><p className="mt-2 text-xs font-semibold text-accent">{col.mapsCount} maps</p></div>))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="mb-8 font-heading text-xl font-bold uppercase tracking-wide text-white">{t("faqTitle")}</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (<details key={f.q} className="group rounded-lg border border-white/5 bg-surface-light/30"><summary className="cursor-pointer px-6 py-4 font-heading text-xs font-bold uppercase tracking-wide text-white">{f.q}</summary><p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p></details>))}
          </div>
        </div>

        <div className="rounded-lg border border-accent/10 bg-accent/5 p-10 text-center">
          <h2 className="mb-4 font-heading text-xl font-bold uppercase tracking-wide text-white">{t("startProject")}</h2>
          <p className="mb-6 text-sm text-slate-400">{t("startSubtitle")}</p>
          <Link href="/contact" className="inline-flex h-12 items-center rounded-md bg-accent px-10 font-heading text-[13px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20">{t("startProject")}</Link>
        </div>
      </div>
    </main>
  );
}
