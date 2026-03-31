import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { MapLeaderboard } from "@/components/maps/MapLeaderboard";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  return {
    title: t("mapsTitle"),
    description: t("mapsDescription"),
    alternates: buildAlternates("/maps", params.locale),
  };
}

export default async function MapsPage() {
  const t = await getTranslations("maps");

  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <div className="mx-auto max-w-5xl px-6">
        <h1 className="mb-2 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("pageTitle")}</h1>
        <p className="mb-10 max-w-2xl text-sm text-slate-400">{t("pageIntro")}</p>
        <MapLeaderboard />
      </div>
    </main>
  );
}
