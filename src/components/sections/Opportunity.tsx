import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";

const LEVER_ICONS = ["⏱️", "🎮", "🔁", "🏆", "✨", "📈", "🤝"];

export async function Opportunity() {
  const t = await getTranslations("b2b.opportunity");
  const levers = t.raw("levers") as string[];
  return (
    <section className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {levers.map((label, i) => (
            <ScrollReveal key={label} delay={`${i * 50}ms`}>
              <div className="h-full rounded-xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-4 transition-all hover:-translate-y-1 hover:border-accent/40">
                <span className="mb-2 block text-xl">{LEVER_ICONS[i]}</span>
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
