import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { SERVICE_ICONS, type ServiceText } from "@/content/site";

export async function ServicesGrid({ withCta = true }: { withCta?: boolean }) {
  const t = await getTranslations("b2b.services");
  const items = t.raw("items") as ServiceText[];
  return (
    <section id="services" className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => (
            <ScrollReveal key={s.title} delay={`${(i % 3) * 60}ms`}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-accent/40 hover:bg-accent/[0.04]">
                <div className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/25 text-lg">{SERVICE_ICONS[i]}</div>
                <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.benefit}</p>
                <p className="mt-2 text-xs text-slate-500">{s.example}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
        {withCta && (
          <div className="mt-9">
            <Cta href="/services" variant="micro" event="card_service_click">{t("ctaMore")} →</Cta>
          </div>
        )}
      </div>
    </section>
  );
}
