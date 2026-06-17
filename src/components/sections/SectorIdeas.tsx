import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { SECTOR_ICONS, type SectorText } from "@/content/site";

export async function SectorIdeas() {
  const t = await getTranslations("b2b.sectors");
  const items = t.raw("items") as SectorText[];
  return (
    <section id="idees" className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <ScrollReveal key={s.title} delay={`${(i % 4) * 60}ms`}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:border-primary/50 hover:bg-primary/[0.06]">
                <h3 className="flex items-center gap-2 font-heading text-base font-bold text-white"><span>{SECTOR_ICONS[i]}</span>{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.text}</p>
              </div>
            </ScrollReveal>
          ))}
          <ScrollReveal delay="180ms">
            <div className="flex h-full flex-col justify-center rounded-2xl border border-accent/35 bg-accent/[0.05] p-5">
              <h3 className="font-heading text-base font-bold text-white">💡 {t("yourSector")}</h3>
              <div className="mt-2">
                <Cta href="/contact" variant="micro" event="cta_idee_activation">{t("ctaIdea")} →</Cta>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
