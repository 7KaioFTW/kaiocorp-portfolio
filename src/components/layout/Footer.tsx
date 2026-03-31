import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import creatorData from "@/data/creator.json";
import type { Creator } from "@/types";

const c = creatorData as Creator;

export function Footer() {
  const t = useTranslations("nav");
  const tF = useTranslations("footer");

  return (
    <footer className="border-t border-white/5 bg-surface-dark">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <Link href="/" className="font-heading text-sm font-bold tracking-widest text-white">KAIO</Link>
            <Link href="/maps" className="text-xs text-slate-400 hover:text-accent">{t("maps")}</Link>
            <Link href="/services" className="text-xs text-slate-400 hover:text-accent">{t("services")}</Link>
            <Link href="/blog" className="text-xs text-slate-400 hover:text-accent">{t("blog")}</Link>
            <Link href="/about" className="text-xs text-slate-400 hover:text-accent">{t("about")}</Link>
            <Link href="/contact" className="text-xs text-slate-400 hover:text-accent">{t("contact")}</Link>
          </div>
          <div className="flex items-center gap-6">
            <a href={c.social.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-accent">Twitter</a>
            <a href={`mailto:${c.email}`} className="text-xs text-slate-400 hover:text-accent">{c.email}</a>
          </div>
        </div>
        <p className="mt-8 text-center text-[11px] tracking-wider text-slate-400 md:text-left">
          {tF("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
