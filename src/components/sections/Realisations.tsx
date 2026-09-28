import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { Glass } from "@/components/ui/Glass";
import { MapFocusCard } from "@/components/three/MapFocusCard";
import { RingMapList } from "@/components/three/RingMapList";
import { RING_MAPS, type ProjectCardMeta } from "@/content/realisations";

type ProjectText = { type: string; objective: string };

interface ProjectGridProps {
  items: ProjectCardMeta[];
}

export async function ProjectGrid({ items }: ProjectGridProps) {
  const t = await getTranslations("b2b.realisations");
  const projects = t.raw("projects") as Record<string, ProjectText>;
  const minU = t("units.minutes");
  const favU = t("units.favorites");

  const cards = items.map((p) => {
    const tx = projects[p.id];
    const result = `${p.minutesPlayed} ${minU} · ${p.favorites} ${favU} · v${p.version}`;
    return (
      <ScrollReveal key={p.id}>
        <article data-tilt data-cursor="view" className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-surface transition-colors hover:border-accent/45">
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1b1430] to-[#0c1730]">
            <div className="absolute inset-0">
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 380px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/10 to-transparent" />
            <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-surface-dark/80 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-accent backdrop-blur-sm">{tx.type}</span>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <h3 className="font-heading text-base font-bold text-white">
              {/* Stretched link: the whole card opens the map page, link name = title */}
              <Link
                href={`/maps/${p.id}` as `/maps/${string}`}
                className="after:absolute after:inset-0 after:z-[2] after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
              >
                {p.title}
              </Link>
            </h3>
            <p className="text-sm text-slate-400">{tx.objective}</p>
            <p className="mt-auto flex items-center gap-2 pt-2 text-sm font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400" />
              {result}
            </p>
          </div>
        </article>
      </ScrollReveal>
    );
  });

  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>;
}

// Homepage-only, always the 3D ring chapter (spec specs/2026-09-27-3d-island-homepage.md §3.2).
export async function Realisations() {
  const t = await getTranslations("b2b.realisations");
  // The ring chapter: sticky stage in a 300vh section while the 3D is on; normal flow otherwise.
  // The HTML list keeps all 10 ring maps accessible (no content exists only inside WebGL, spec §7).
  const island = await getTranslations("b2b.island");
  const minutesUnit = t("units.minutes");
  return (
    <section id="realisations" data-island-chapter="ring" className="island-over3d island-chapter--ring relative">
      <div className="island-stage">
        {/* 3D on: island-ring-layout (motion.css) splits the glass panel so the focused 3D screen stays clear —
            lg+: a grid, heading + focus card along the bottom and the map list in a right-hand column (the lg:col/row
            classes only place the pieces in that grid); below lg: heading on top, the list as a chip row above the
            card at the bottom. 3D off: one panel, vertical list. */}
        <div className="island-ring-layout mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-between gap-6 px-6 pb-10 pt-24 lg:flex-row lg:items-end">
          <Glass on className="island-glass--split max-w-xl">
            <div className="lg:col-start-1 lg:row-start-2">
              <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} compact />
            </div>
            <div className="mt-6 lg:col-start-3 lg:row-span-2 lg:row-start-1">
              <RingMapList maps={RING_MAPS} minutesUnit={minutesUnit} label={island("ringList")} />
              <div className="mt-6">
                <Cta href="/realisations" variant="micro" event="cta_voir_realisations">{t("ctaAll")} →</Cta>
              </div>
            </div>
          </Glass>
          <MapFocusCard maps={RING_MAPS} minutesUnit={minutesUnit} />
        </div>
      </div>
    </section>
  );
}
