import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { JsonLd } from "@/components/ui/JsonLd";
import { CopyCode } from "./CopyCode";
import { buildAlternates } from "@/lib/seo";
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const maps = mapsData as FortniteMap[];

export function generateStaticParams() {
  return maps.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: { locale: string; id: string } }): Promise<Metadata> {
  const map = maps.find((m) => m.id === params.id);
  if (!map) return {};
  return {
    title: `${map.title} — Fortnite Map Code ${map.code}`,
    description: `${map.description} Map code: ${map.code}. ${map.stats.minutesPlayed} minutes played.`,
    alternates: buildAlternates(`/maps/${map.id}`, params.locale),
    openGraph: { title: map.title, description: map.description, images: [{ url: map.thumbnail, width: 1200, height: 675 }] },
  };
}

export default async function MapPage({ params }: { params: { locale: string; id: string } }) {
  const map = maps.find((m) => m.id === params.id);
  if (!map) notFound();
  const related = maps.filter((m) => m.creator === map.creator && m.id !== map.id);
  const t = await getTranslations("maps");
  const tNav = await getTranslations("nav");

  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Game", name: map.title, description: map.description, creator: { "@type": "Person", name: "Kaio" }, applicationCategory: "Game" }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: tNav("home"), item: "https://kaiocorp.com" }, { "@type": "ListItem", position: 2, name: tNav("maps"), item: "https://kaiocorp.com/maps" }, { "@type": "ListItem", position: 3, name: map.title }] }} />
      <div className="mx-auto max-w-5xl px-6">
        <Breadcrumb items={[{ label: tNav("home"), href: "/" }, { label: tNav("maps"), href: "/maps" }, { label: map.title }]} />
        <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface"><Image src={map.thumbnail} alt={map.title} fill sizes="(max-width:1024px) 100vw,640px" priority className="object-cover" /></div>
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{map.creator}</p>
            <h1 className="mt-1 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{map.title}</h1>
            {map.subtitle && <p className="mt-1 text-sm text-slate-400">{map.subtitle}</p>}
            {map.brand && <span className="mt-3 inline-block w-fit rounded bg-yellow-500/15 px-2.5 py-0.5 text-[11px] font-bold text-yellow-400">Brand: {map.brand}</span>}
            <CopyCode code={map.code} />
            <a href={map.fortniteGgUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-11 w-fit items-center rounded-md bg-accent px-6 font-heading text-[12px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/15">{t("viewOnFortniteGg")}</a>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[{ l: t("minutesPlayed"), v: map.stats.minutesPlayed }, { l: t("favoritesLabel"), v: map.stats.favorites }, { l: t("peakPlayers"), v: map.stats.allTimePeak.toLocaleString("en-US") }, { l: t("d1Retention"), v: map.stats.day1Retention }, { l: t("avgPlaytime"), v: map.stats.avgPlaytime }].map((s) => (
            <div key={s.l} className="rounded-lg border border-white/5 bg-surface-light/50 p-4 text-center"><p className="font-heading text-lg font-bold text-white">{s.v}</p><p className="mt-0.5 text-[10px] text-slate-400">{s.l}</p></div>
          ))}
        </div>

        <div className="mb-10"><h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-slate-400">{t("description")}</h2><p className="text-sm leading-relaxed text-slate-400">{map.description}</p></div>

        <div className="mb-10 grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-400 md:grid-cols-4">
          <p>{t("released")}: <span className="text-slate-400">{map.released}</span></p>
          <p>{t("updated")}: <span className="text-slate-400">{map.updated}</span></p>
          <p>{t("version")}: <span className="text-slate-400">v{map.version}</span></p>
          <p>{t("maxPlayers")}: <span className="text-slate-400">{map.maxPlayers}</span></p>
          <p>{t("ageRating")}: <span className="text-slate-400">{map.ageRating}</span></p>
          {map.xpStatus && <p>{t("xpStatus")}: <span className="text-slate-400">{map.xpStatus}</span></p>}
        </div>

        <div className="mb-10 flex flex-wrap gap-1.5">{map.tags.map((tag) => <span key={tag} className="rounded-full border border-white/5 bg-surface-light px-3 py-1 text-[11px] text-slate-400">{tag}</span>)}</div>

        <div className="mb-14 rounded-lg border border-accent/10 bg-accent/5 p-6 text-center">
          <p className="mb-3 text-sm text-slate-400">{t("needMapLikeThis")}</p>
          <Link href="/services" className="text-sm font-semibold text-accent hover:text-accent-light">{t("viewServices")} &rarr;</Link>
        </div>

        {related.length > 0 && (
          <div className="border-t border-white/5 pt-10">
            <h2 className="mb-6 font-heading text-sm font-bold uppercase tracking-wider text-slate-400">{t("moreBy", { creator: map.creator })}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} href={`/maps/${r.id}` as `/maps/${string}`} className="group flex items-center gap-3 rounded-lg border border-white/5 bg-surface-light/30 p-3 transition-all hover:border-accent/20">
                  <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded"><Image src={r.thumbnail} alt={r.title} fill sizes="64px" className="object-cover" /></div>
                  <div className="min-w-0"><p className="truncate font-heading text-[11px] font-bold uppercase text-white">{r.title}</p><p className="text-[10px] text-slate-400">{r.stats.minutesPlayed} {t("played")}</p></div>
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="mt-10"><Link href="/maps" className="text-xs text-slate-400 hover:text-accent">&larr; {t("backToMaps")}</Link></div>
      </div>
    </main>
  );
}
