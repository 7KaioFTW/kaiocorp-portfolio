import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}

export function SectionHead({ eyebrow, title, lead, center }: SectionHeadProps) {
  return (
    <ScrollReveal className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl">{title}</h2>
      {lead && <p className={cn("mt-4 text-base leading-relaxed text-slate-400 md:text-lg", center && "mx-auto")}>{lead}</p>}
    </ScrollReveal>
  );
}
