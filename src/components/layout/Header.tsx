"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const NAV = [
    { label: t("home"), href: "/" as const },
    { label: t("maps"), href: "/maps" as const },
    { label: t("services"), href: "/services" as const },
    { label: t("blog"), href: "/blog" as const },
    { label: t("about"), href: "/about" as const },
  ];

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 40); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all duration-300", scrolled ? "bg-surface-dark/90 backdrop-blur-md border-b border-white/5" : "bg-transparent")}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="Kaio Corporation" width={32} height={32} />
          <span className="font-heading text-lg font-bold tracking-widest text-white">KAIO</span>
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          {NAV.map((l) => (
            <li key={l.href}><Link href={l.href} className={cn("text-[13px] font-medium uppercase tracking-wider transition-colors", pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href)) ? "text-accent" : "text-slate-400 hover:text-white")}>{l.label}</Link></li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link href="/contact" className="rounded-md border border-accent/60 bg-accent/10 px-5 py-2 text-[13px] font-semibold uppercase tracking-wider text-accent transition-all hover:bg-accent/20 hover:shadow-lg hover:shadow-accent/10">{t("getInTouch")}</Link>
        </div>
        <button className="flex flex-col gap-1.5 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          <span className={cn("block h-0.5 w-6 bg-white transition-transform", open && "translate-y-2 rotate-45")} />
          <span className={cn("block h-0.5 w-6 bg-white transition-opacity", open && "opacity-0")} />
          <span className={cn("block h-0.5 w-6 bg-white transition-transform", open && "-translate-y-2 -rotate-45")} />
        </button>
      </nav>
      <div className={cn("overflow-hidden border-b border-white/5 bg-surface-dark/95 backdrop-blur-md transition-all duration-300 md:hidden", open ? "max-h-80 opacity-100" : "max-h-0 opacity-0 border-b-0")}>
        <div className="flex flex-col gap-4 px-6 py-6">
          {NAV.map((l) => <Link key={l.href} href={l.href} className={cn("text-sm", pathname === l.href ? "text-accent" : "text-slate-400 hover:text-white")}>{l.label}</Link>)}
          <div className="mt-2 flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/contact" className="flex-1 rounded-md bg-accent px-5 py-3 text-center text-sm font-bold text-surface-dark">{t("getInTouch")}</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
