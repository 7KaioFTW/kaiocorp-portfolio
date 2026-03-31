"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function CopyCode({ code }: { code: string }) {
  const t = useTranslations("maps");
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="mt-4 flex items-center gap-2">
      <code className="rounded-md border border-white/10 bg-surface-light px-4 py-2 font-heading text-lg tracking-widest text-accent">{code}</code>
      <button onClick={copy} className={cn("rounded-md border border-white/10 px-3 py-2 text-xs transition-all", copied ? "border-accent/30 text-accent" : "text-slate-400 hover:border-accent/20 hover:text-accent")}>{copied ? t("copied") : t("copy")}</button>
    </div>
  );
}
