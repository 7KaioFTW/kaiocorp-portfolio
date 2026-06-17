import { getTranslations } from "next-intl/server";
import { SectionHead } from "@/components/ui/SectionHead";
import { JsonLd } from "@/components/ui/JsonLd";
import type { QA } from "@/content/site";

export async function FaqB2B() {
  const t = await getTranslations("b2b.faq");
  const items = t.raw("items") as QA[];
  return (
    <section id="faq" className="bg-surface-dark py-20 md:py-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="mx-auto max-w-3xl px-6">
        <SectionHead center eyebrow={t("eyebrow")} title={t("title")} />
        <div className="mt-10 space-y-2.5">
          {items.map((f) => (
            <details key={f.q} className="group rounded-xl border border-white/[0.07] bg-white/[0.02]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex-none text-xl text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
