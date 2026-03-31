"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const featured = (mapsData as FortniteMap[]).filter((m) => m.featured);

export function FeaturedMaps() {
  const t = useTranslations("featured");

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal>
          <h2 className="mb-12 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h2>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((map, i) => (
            <ScrollReveal key={map.id} delay={`${i * 80}ms`}>
              <Link href={`/maps/${map.id}` as `/maps/${string}`} className="group block overflow-hidden rounded-lg border border-yellow-500/15 transition-all hover:scale-[1.02] hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5">
                <div className="relative aspect-video overflow-hidden bg-surface-dark"><Image src={map.thumbnail} alt={map.title} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" /></div>
                <div className="bg-surface-light/50 p-4">
                  <p className="text-[11px] text-slate-400">{map.creator}</p>
                  <h3 className="mt-0.5 font-heading text-xs font-bold uppercase tracking-wide text-white">{map.title}</h3>
                  <div className="mt-2 flex gap-4 text-[11px] text-slate-400">
                    <span>{t("played", { value: map.stats.minutesPlayed })}</span>
                    <span>{t("favs", { value: map.stats.favorites })}</span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay="400ms">
          <div className="mt-10 text-center">
            <Link href="/maps" className="text-sm font-semibold text-accent transition-colors hover:text-accent-light">{t("viewAll")} &rarr;</Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
