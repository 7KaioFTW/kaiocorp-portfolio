"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function BottomCTA() {
  const t = useTranslations("bottomCta");

  return (
    <div className="bg-surface py-24">
      <ScrollReveal>
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h2>
          <p className="mb-8 text-sm text-slate-400">{t("subtitle")}</p>
          <Link href="/contact" className="inline-flex h-12 items-center rounded-md bg-accent px-10 font-heading text-[13px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20">{t("button")}</Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
