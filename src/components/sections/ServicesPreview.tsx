"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function ServicesPreview() {
  const t = useTranslations("services");
  const tP = useTranslations("servicesPreview");

  const SERVICES = [
    { title: t("competitive"), desc: t("competitiveDesc").substring(0, 60) + "..." },
    { title: t("tycoon"), desc: t("tycoonDesc").substring(0, 60) + "..." },
    { title: t("custom"), desc: t("customDesc").substring(0, 60) + "..." },
    { title: t("verse"), desc: t("verseDesc").substring(0, 60) + "..." },
  ];

  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal><h2 className="mb-12 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{tP("title")}</h2></ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <ScrollReveal key={s.title} delay={`${i * 100}ms`}>
              <div className="rounded-lg border border-white/5 bg-surface-light/50 p-5 transition-all hover:border-primary/20">
                <h3 className="mb-2 font-heading text-xs font-bold uppercase tracking-wide text-white">{s.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay="400ms">
          <div className="mt-8 text-center">
            <Link href="/services" className="text-sm font-semibold text-accent hover:text-accent-light">{tP("viewAll")} &rarr;</Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
