import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";
import creatorData from "@/data/creator.json";

export async function Footer() {
  const t = await getTranslations("b2b.footer");
  const cols = [
    {
      title: t("colSolutions"),
      links: [
        { label: t("linkActivations"), href: "/activations-de-marque" as const },
        { label: t("linkAgences"), href: "/agences" as const },
        { label: t("linkCreateurs"), href: "/createurs-esport" as const },
        { label: t("linkServices"), href: "/services" as const },
      ],
    },
    {
      title: t("colStudio"),
      links: [
        { label: t("linkRealisations"), href: "/realisations" as const },
        { label: t("linkMaps"), href: "/maps" as const },
        { label: t("linkBlog"), href: "/blog" as const },
        { label: t("linkContact"), href: "/contact" as const },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/5 bg-surface-dark">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/images/logo-mark.png" alt="KaioCorp" width={790} height={440} className="h-8 w-auto" />
              <span className="font-heading text-base font-extrabold tracking-[0.16em] text-white">KAIOCORP</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">{t("tagline")}</p>
            <p className="mt-3 text-sm text-slate-400">{TOTAL_MINUTES_LABEL} {t("minutesPlayed")}</p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{col.title}</h2>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">{l.label}</Link>
              ))}
            </div>
          ))}

          <div>
            <h2 className="mb-3.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t("colContact")}</h2>
            <a href={`mailto:${PROOF.email}`} className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">{PROOF.email}</a>
            <Link href="/contact" className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">{t("discuss")}</Link>
            <a href={creatorData.social.twitter} target="_blank" rel="noopener noreferrer" className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">{t("twitter")}</a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} KaioCorp — Kaio Corporation. {t("rights")}</span>
          <span>{t("epicDisclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
