"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const brandMaps = (mapsData as FortniteMap[]).filter((m) => m.brand);

export function BrandCollabs() {
  const t = useTranslations("brandCollabs");

  return (
    <section className="bg-surface-dark py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal>
          <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h2>
          <p className="mb-12 text-sm text-slate-400">{t("subtitle")}</p>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {brandMaps.map((map, i) => (
            <ScrollReveal key={map.id} delay={`${i * 100}ms`}>
              <Link href={`/maps/${map.id}` as `/maps/${string}`} className="group block overflow-hidden rounded-lg border border-yellow-500/15 transition-all hover:scale-[1.02] hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5">
                <div className="relative aspect-video overflow-hidden bg-surface">
                  <Image src={map.thumbnail} alt={map.title} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="bg-surface-light/50 p-4">
                  <span className="mb-2 inline-block rounded bg-yellow-500/15 px-2.5 py-0.5 text-[11px] font-bold text-yellow-400">{map.brand}</span>
                  <h3 className="mt-1 font-heading text-xs font-bold uppercase tracking-wide text-white">{map.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-400">{map.creator}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
