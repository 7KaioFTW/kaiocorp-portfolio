import { getTranslations } from "next-intl/server";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { SERVICE_ICONS, type ServiceText } from "@/content/site";
import { cn } from "@/lib/utils";

interface ServicesGridProps {
  withCta?: boolean;
  variant?: SectionVariant;
}

export async function ServicesGrid({ withCta = true, variant = "default" }: ServicesGridProps) {
  const t = await getTranslations("b2b.services");
  const items = t.raw("items") as ServiceText[];
  const over3d = variant === "over3d";
  return (
    <section id="services" className={cn("py-20 md:py-24", over3d ? "island-over3d" : "border-t border-white/5 bg-surface-dark")}>
      <div className="mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s, i) => (
              <ScrollReveal key={s.title}>
                <div data-tilt className="relative h-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors hover:border-accent/40 hover:bg-accent/[0.04]">
                  <div className="mb-3.5 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-accent/25 text-lg">{SERVICE_ICONS[i]}</div>
                  <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{s.benefit}</p>
                  <p className="mt-2 text-xs text-slate-400">{s.example}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          {withCta && (
            <div className="mt-9">
              <Cta href="/services" variant="micro" event="card_service_click">{t("ctaMore")} →</Cta>
            </div>
          )}
        </Glass>
      </div>
    </section>
  );
}
