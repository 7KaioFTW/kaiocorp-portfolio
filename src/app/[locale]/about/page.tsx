import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildAlternates } from "@/lib/seo";
import creatorData from "@/data/creator.json";
import type { Creator } from "@/types";

const creator = creatorData as Creator;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  return { title: t("aboutTitle"), description: t("aboutDescription"), alternates: buildAlternates("/about", params.locale) };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");

  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <div className="mx-auto max-w-5xl px-6">
        <Breadcrumb items={[{ label: tNav("home"), href: "/" }, { label: tNav("about") }]} />
        <h1 className="mb-6 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h1>
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <p className="mb-8 text-base leading-relaxed text-slate-400">{creator.bio}</p>
            <p className="mb-8 text-sm leading-relaxed text-slate-400">{t("bioExtended")}</p>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{t("skillsTitle")}</h2>
            <div className="mb-8 flex flex-wrap gap-2">{creator.skills.map((s) => <span key={s} className="rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-purple-300">{s}</span>)}</div>
            <div className="flex gap-4">
              <Link href="/maps" className="text-sm font-semibold text-accent hover:text-accent-light">{t("viewPortfolio")} &rarr;</Link>
              <Link href="/services" className="text-sm font-semibold text-accent hover:text-accent-light">{t("viewServices")} &rarr;</Link>
            </div>
          </div>
          <div>
            <h2 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{t("collaboratorsTitle")}</h2>
            <div className="flex flex-col gap-3">
              {creator.collaborators.map((c) => (
                <div key={c.name} className="rounded-lg border border-white/5 bg-surface-light/50 p-5 transition-all hover:border-primary/20">
                  <div className="flex items-center justify-between"><div><h3 className="font-heading text-sm font-bold text-white">{c.name}</h3><p className="text-[11px] uppercase tracking-wider text-purple-300">{c.role}</p></div><span className="rounded-full bg-accent/10 px-3 py-0.5 text-[11px] font-bold text-accent">{t("mapsCount", { count: c.mapsCount })}</span></div>
                  <p className="mt-2 text-xs text-slate-400">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
