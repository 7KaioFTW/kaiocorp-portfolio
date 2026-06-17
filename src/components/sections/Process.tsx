import { getTranslations } from "next-intl/server";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import type { StepText } from "@/content/site";

export async function Process() {
  const t = await getTranslations("b2b.process");
  const items = t.raw("items") as StepText[];
  return (
    <section id="process" className="border-t border-white/5 bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => (
            <ScrollReveal key={s.title} delay={`${(i % 3) * 60}ms`}>
              <div className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent font-heading text-sm font-extrabold text-surface-dark">{i + 1}</div>
                <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
