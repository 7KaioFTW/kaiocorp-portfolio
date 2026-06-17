"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";

type Variant = "primary" | "ghost" | "micro";

interface CtaProps {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  event?: string;
  eventParams?: Record<string, string>;
  external?: boolean;
  className?: string;
}

const base = "inline-flex items-center justify-center gap-2 font-heading font-bold uppercase tracking-wider transition-all";
const styles: Record<Variant, string> = {
  primary:
    "h-12 rounded-md bg-gradient-to-r from-primary to-accent px-7 text-[13px] text-surface-dark shadow-lg shadow-accent/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30",
  ghost:
    "h-12 rounded-md border border-white/15 bg-white/[0.02] px-7 text-[13px] text-white hover:border-accent hover:text-accent",
  micro: "text-[13px] normal-case tracking-normal text-accent hover:text-accent-dark",
};

export function Cta({ href, children, variant = "primary", event, eventParams, external, className }: CtaProps) {
  function onClick() {
    if (event) track(event, eventParams);
  }
  const cls = cn(base, styles[variant], className);

  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} onClick={onClick} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href as never} onClick={onClick} className={cls}>
      {children}
    </Link>
  );
}
