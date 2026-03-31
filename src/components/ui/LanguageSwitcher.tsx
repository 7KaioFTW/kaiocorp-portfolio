"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname, localeNames, type Locale } from "@/i18n/routing";
import { locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLocale = (next: Locale) => {
    setOpen(false);
    router.replace(pathname, { locale: next });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition-all hover:border-white/20 hover:text-white"
        aria-label="Change language"
      >
        {locale.toUpperCase()}
      </button>
      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-48 rounded-lg border border-white/10 bg-surface-dark/95 py-1 shadow-xl backdrop-blur-md">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={cn(
                "w-full px-4 py-2 text-start text-xs transition-colors",
                l === locale ? "text-accent" : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
