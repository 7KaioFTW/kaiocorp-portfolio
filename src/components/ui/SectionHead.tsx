import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
  /** Tighter type from lg up (homepage ring chapter: pinned over the 3D screens). */
  compact?: boolean;
}

export function SectionHead({ eyebrow, title, lead, center, compact }: SectionHeadProps) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <p data-motion="decode" className="font-heading text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 data-motion="split" className={cn("mt-3 font-heading text-3xl font-bold leading-tight text-white md:text-4xl", compact && "lg:mt-2 lg:text-3xl")}>{title}</h2>
      {lead && (
        <ScrollReveal>
          <p className={cn("mt-4 text-base leading-relaxed text-slate-400 md:text-lg", compact && "lg:mt-2 lg:text-base", center && "mx-auto")}>{lead}</p>
        </ScrollReveal>
      )}
    </div>
  );
}
