import { getTranslations } from "next-intl/server";
import { BriefForm } from "@/components/forms/BriefForm";
import { Cta } from "@/components/ui/Cta";
import { Glass, type SectionVariant } from "@/components/ui/Glass";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { PROOF, type ProjectType } from "@/content/site";
import { cn } from "@/lib/utils";

interface FinalCtaProps {
  id?: string;
  eyebrow?: string;
  title?: string;
  text?: string;
  defaultType?: ProjectType;
  variant?: SectionVariant;
}

export async function FinalCta({ id = "contact", eyebrow, title, text, defaultType, variant = "default" }: FinalCtaProps) {
  const t = await getTranslations("b2b.finalCta");
  const eb = eyebrow ?? t("eyebrow");
  const ti = title ?? t("title");
  const tx = text ?? t("text");
  const over3d = variant === "over3d";
  return (
    <section
      id={id}
      data-island-chapter={over3d ? "cta" : undefined}
      className={cn(
        "relative overflow-hidden py-20 md:py-24",
        over3d ? "island-over3d" : "border-t border-white/5 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(123,47,190,0.16),transparent_70%)]",
      )}
    >
      {!over3d && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex select-none items-center">
          <div data-motion="parallax" data-axis="x" data-speed="-0.3" className="whitespace-nowrap font-heading text-[22vw] font-extrabold leading-none text-transparent [-webkit-text-stroke:1px_rgba(123,47,190,0.28)]">
            KAIOCORP KAIOCORP
          </div>
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <Glass on={over3d}>
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <ScrollReveal>
              <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eb}</p>
              <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{ti}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400 md:text-lg">{tx}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Cta href={`mailto:${PROOF.email}?subject=Brief%20projet%20Fortnite`} variant="ghost" event="cta_email">✉️ {t("emailBtn")}</Cta>
              </div>
              <p className={cn("mt-6 flex items-center gap-2 text-sm", over3d ? "text-slate-400" : "text-slate-500")}>
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px] shadow-accent" />
                {t("responseNote")} · {PROOF.email}
              </p>
            </ScrollReveal>
            <ScrollReveal>
              <BriefForm defaultType={defaultType} />
            </ScrollReveal>
          </div>
        </Glass>
      </div>
    </section>
  );
}
