import { Link } from "@/i18n/routing";
import { PROOF } from "@/content/site";
import { TOTAL_MINUTES_LABEL } from "@/lib/stats";
import creatorData from "@/data/creator.json";

const COLS = [
  {
    title: "Solutions",
    links: [
      { label: "Activations de marque", href: "/activations-de-marque" as const },
      { label: "Agences", href: "/agences" as const },
      { label: "Créateurs & Esport", href: "/createurs-esport" as const },
      { label: "Services", href: "/services" as const },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Réalisations", href: "/realisations" as const },
      { label: "Maps", href: "/maps" as const },
      { label: "Blog", href: "/blog" as const },
      { label: "Contact", href: "/contact" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-dark">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent font-heading text-sm font-extrabold text-surface-dark">K</span>
              <span className="font-heading text-base font-extrabold tracking-[0.16em] text-white">KAIOCORP</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-400">Studio créatif d’expériences Fortnite sur-mesure. UEFN · Verse · Unreal Engine 5.</p>
            <p className="mt-3 text-sm text-slate-400">{TOTAL_MINUTES_LABEL} minutes jouées</p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{col.title}</h2>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">{l.label}</Link>
              ))}
            </div>
          ))}

          <div>
            <h2 className="mb-3.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Contact</h2>
            <a href={`mailto:${PROOF.email}`} className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">{PROOF.email}</a>
            <Link href="/contact" className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">Discuter de votre projet</Link>
            <a href={creatorData.social.twitter} target="_blank" rel="noopener noreferrer" className="mb-2.5 block text-sm text-slate-400 transition-colors hover:text-accent">Twitter / X</a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} KaioCorp — Kaio Corporation. Tous droits réservés.</span>
          <span>Non affilié à Epic Games. Fortnite est une marque d’Epic Games, Inc.</span>
        </div>
      </div>
    </footer>
  );
}
