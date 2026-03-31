"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { FortniteMap } from "@/types";
import { cn } from "@/lib/utils";

export function MapRow({ map, rank, index }: { map: FortniteMap; rank: number; index: number }) {
  const t = useTranslations("maps");
  const isTop3 = rank <= 3;

  return (
    <ScrollReveal delay={`${Math.min(index * 60, 600)}ms`}>
      <Link href={`/maps/${map.id}` as `/maps/${string}`} className={cn("group flex items-center gap-4 rounded-lg border px-4 py-3 transition-all hover:scale-[1.01] hover:shadow-lg md:px-6 md:py-4", map.featured ? "border-yellow-500/15 bg-surface-light hover:border-yellow-500/30 hover:shadow-yellow-500/5" : "border-white/5 bg-surface-light hover:border-accent/20 hover:shadow-accent/5")}>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded font-heading text-xs font-bold", isTop3 ? "bg-yellow-500/15 text-yellow-400" : "bg-surface-light text-slate-300")}>#{rank}</span>
        <div className="relative hidden h-10 w-16 shrink-0 overflow-hidden rounded sm:block"><Image src={map.thumbnail} alt={map.title} fill sizes="64px" className="object-cover" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-heading text-xs font-bold uppercase tracking-wide text-white md:text-sm">{map.title}</span>
            {map.brand && <span className="hidden shrink-0 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 sm:inline">{map.brand}</span>}
          </div>
          <span className="text-[11px] text-slate-400">{map.creator}</span>
        </div>
        <div className="hidden items-center gap-6 md:flex lg:gap-10">
          <div className="text-end"><p className="font-heading text-xs font-bold text-white">{map.stats.minutesPlayed}</p><p className="text-[10px] text-slate-400">{t("played")}</p></div>
          <div className="text-end"><p className="font-heading text-xs font-bold text-white">{map.stats.favorites}</p><p className="text-[10px] text-slate-400">{t("favorites")}</p></div>
          <div className="text-end"><p className="font-heading text-xs font-bold text-white">{map.stats.allTimePeak.toLocaleString("en-US")}</p><p className="text-[10px] text-slate-400">{t("peakCcu")}</p></div>
        </div>
        <code className="hidden shrink-0 rounded bg-white/5 px-2 py-1 font-body text-[11px] text-slate-400 lg:block">{map.code}</code>
        <svg className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
      </Link>
    </ScrollReveal>
  );
}
