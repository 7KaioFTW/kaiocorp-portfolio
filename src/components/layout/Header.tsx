"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Cta } from "@/components/ui/Cta";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("b2b.nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const NAV = [
    { label: t("activations"), href: "/activations-de-marque" as const },
    { label: t("agences"), href: "/agences" as const },
    { label: t("createurs"), href: "/createurs-esport" as const },
    { label: t("realisations"), href: "/realisations" as const },
    { label: t("services"), href: "/services" as const },
  ];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "border-b border-white/5 bg-surface-dark/85 backdrop-blur-md" : "bg-transparent")}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-mark.png" alt="KaioCorp" width={790} height={440} priority className="h-9 w-auto" />
          <span className="font-heading text-lg font-extrabold tracking-[0.16em] text-white">KAIOCORP</span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {NAV.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={cn("text-[13px] font-medium uppercase tracking-wider transition-colors", pathname.startsWith(l.href) ? "text-accent" : "text-slate-400 hover:text-white")}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Cta href="/contact" variant="primary" event="cta_discuter_projet" eventParams={{ from: "header" }} className="h-10 px-5 text-xs">
            {t("cta")}
          </Cta>
        </div>

        <button className="flex flex-col gap-1.5 lg:hidden" onClick={() => setOpen(!open)} aria-label={t("menu")} aria-expanded={open}>
          <span className={cn("block h-0.5 w-6 bg-white transition-transform", open && "translate-y-2 rotate-45")} />
          <span className={cn("block h-0.5 w-6 bg-white transition-opacity", open && "opacity-0")} />
          <span className={cn("block h-0.5 w-6 bg-white transition-transform", open && "-translate-y-2 -rotate-45")} />
        </button>
      </nav>

      <div className={cn("overflow-hidden border-white/5 bg-surface-dark/97 backdrop-blur-md transition-all duration-300 lg:hidden", open ? "max-h-[26rem] border-b opacity-100" : "max-h-0 opacity-0")}>
        <div className="flex flex-col gap-4 px-6 py-6">
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className={cn("text-sm uppercase tracking-wider", pathname.startsWith(l.href) ? "text-accent" : "text-slate-300 hover:text-white")}>
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3">
            <LanguageSwitcher />
            <Cta href="/contact" variant="primary" className="h-11 flex-1" event="cta_discuter_projet" eventParams={{ from: "mobile" }}>
              {t("cta")}
            </Cta>
          </div>
        </div>
      </div>
    </header>
  );
}
