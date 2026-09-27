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
        <div data-steps className="relative mt-12">
          <div aria-hidden="true" className="absolute inset-x-0 -top-6 hidden h-px bg-white/10 lg:block">
            <div data-motion="progress-line" className="h-full origin-left bg-gradient-to-r from-primary to-accent shadow-[0_0_12px] shadow-accent/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s, i) => (
              <ScrollReveal key={s.title}>
                <div data-step className="h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition-colors duration-500 [&.is-active]:border-accent/30">
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent font-heading text-sm font-extrabold text-surface-dark transition-shadow duration-500 [.is-active_&]:shadow-[0_0_24px_rgba(0,212,255,0.55)]">{i + 1}</div>
                  <h3 className="font-heading text-base font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{s.text}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
