"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CountUp } from "@/components/ui/CountUp";
import creatorData from "@/data/creator.json";
import type { Creator } from "@/types";

const creator = creatorData as Creator;

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-dark">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(123,47,190,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(123,47,190,0.04)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.06)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0A0A0F_100%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center animate-[fadeIn_0.8s_ease-out]">
        <p className="mb-8 text-[11px] font-medium uppercase tracking-[0.4em] text-slate-400">{t("eyebrow")}</p>
        <div className="animate-[fadeIn_1s_ease-out_0.2s_both]">
          <h1 className="font-heading text-[clamp(4rem,12vw,10rem)] font-bold leading-none tracking-tight text-white"><CountUp end={4.9} duration={3000} decimals={1} suffix="B" raw /></h1>
          <p className="mt-2 text-lg text-slate-400 md:text-xl">{t("statLabel")}</p>
        </div>
        <p className="mt-4 text-sm text-slate-400 animate-[fadeIn_0.6s_ease-out_0.8s_both]">
          {t.rich("humanScale", { accent: (chunks) => <span className="text-accent">{chunks}</span> })}
        </p>
        <div className="mt-14 flex items-center justify-center gap-8 md:gap-12 animate-[fadeIn_0.6s_ease-out_1.2s_both]">
          {creator.collaborators.map((col) => <span key={col.name} className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 md:text-xs">{col.name}</span>)}
        </div>
        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-[fadeIn_0.6s_ease-out_1.5s_both]">
          <Link href="/maps" className="inline-flex h-12 items-center rounded-md bg-accent px-8 font-heading text-[13px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20">{t("cta")}</Link>
          <Link href="/contact" className="inline-flex h-12 items-center rounded-md border border-white/15 px-8 font-heading text-[13px] font-bold uppercase tracking-wider text-slate-400 transition-all hover:border-white/30 hover:text-white">{t("ctaSecondary")}</Link>
        </div>
      </div>
    </section>
  );
}
