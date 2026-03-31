"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CountUp } from "@/components/ui/CountUp";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { parseStatNumber } from "@/lib/utils";
import mapsData from "@/data/maps.json";
import creatorData from "@/data/creator.json";
import type { FortniteMap, Creator } from "@/types";

const maps = mapsData as FortniteMap[];
const creator = creatorData as Creator;
const topMaps = [...maps].sort((a, b) => parseStatNumber(b.stats.minutesPlayed) - parseStatNumber(a.stats.minutesPlayed)).slice(0, 6);
const maxVal = parseStatNumber(topMaps[0].stats.minutesPlayed);

export function StatsSection() {
  const t = useTranslations("stats");
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(el); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const COUNTERS = [
    { end: parseStatNumber("4.9B"), suffix: "+", label: t("minutesPlayed"), ctx: t("ctxMinutes") },
    { end: parseStatNumber("3.3M"), suffix: "+", label: t("favorites"), ctx: t("ctxFavorites") },
    { end: creator.aggregateStats.totalCollaborators, suffix: "", label: t("collaborators"), ctx: t("ctxCollaborators") },
  ];

  return (
    <section ref={ref} className="bg-surface-dark py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal><h2 className="mb-14 text-center font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h2></ScrollReveal>
        <div className="mb-20 grid grid-cols-3 gap-8">
          {COUNTERS.map((c, i) => (
            <ScrollReveal key={c.label} delay={`${i * 150}ms`}>
              <div className="text-center">
                <p className="font-heading text-3xl font-bold text-white md:text-4xl"><CountUp end={c.end} duration={2500} trigger={inView} suffix={c.suffix} /></p>
                <p className="mt-1 text-sm font-medium text-slate-400">{c.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{c.ctx}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay="700ms">
          <h3 className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{t("chartTitle")}</h3>
          <div className="mx-auto max-w-3xl space-y-3">
            {topMaps.map((map) => {
              const pct = (parseStatNumber(map.stats.minutesPlayed) / maxVal) * 100;
              return (
                <div key={map.id}>
                  <div className="mb-1 flex items-center justify-between text-xs"><span className="truncate text-slate-400">{map.title}</span><span className="ms-2 shrink-0 font-heading text-[11px] font-bold text-white">{map.stats.minutesPlayed}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-light">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out" style={{ width: inView ? `${pct}%` : "0%" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
