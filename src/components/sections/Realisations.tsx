import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SectionHead } from "@/components/ui/SectionHead";
import { Cta } from "@/components/ui/Cta";
import { REALISATIONS_META, type ProjectCardMeta } from "@/content/realisations";
import { cn } from "@/lib/utils";

type ProjectText = { type: string; objective: string };

interface ProjectGridProps {
  items: ProjectCardMeta[];
  /** "gallery" = pinned horizontal scroll on desktop (homepage only). */
  variant?: "grid" | "gallery";
}

export async function ProjectGrid({ items, variant = "grid" }: ProjectGridProps) {
  const t = await getTranslations("b2b.realisations");
  const projects = t.raw("projects") as Record<string, ProjectText>;
  const minU = t("units.minutes");
  const favU = t("units.favorites");
  const isGallery = variant === "gallery";

  const cards = items.map((p) => {
    const tx = projects[p.id];
    const result = `${p.minutesPlayed} ${minU} · ${p.favorites} ${favU} · v${p.version}`;
    return (
      <ScrollReveal key={p.id} className={cn(isGallery && "lg:w-[26rem] lg:shrink-0 lg:snap-start")}>
        <article data-tilt data-cursor="view" className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-surface transition-colors hover:border-accent/45">
          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1b1430] to-[#0c1730]">
            <div data-gallery-img={isGallery ? "" : undefined} className={cn("absolute inset-0", isGallery && "lg:inset-x-[-10%]")}>
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                sizes={isGallery ? "(max-width: 1024px) 100vw, 500px" : "(max-width: 768px) 100vw, 380px"}
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

  if (!isGallery) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards}</div>;
  return (
    <div data-motion="gallery" className="lg:snap-x lg:snap-mandatory lg:overflow-x-auto lg:pb-4 lg:[&.is-pinned]:overflow-visible">
      <div data-gallery-track className="grid gap-4 sm:grid-cols-2 lg:flex lg:w-max lg:gap-6">
        {cards}
      </div>
    </div>
  );
}

export async function Realisations() {
  const t = await getTranslations("b2b.realisations");
  return (
    <section id="realisations" className="overflow-x-clip bg-surface-dark py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <div className="mt-12">
          <ProjectGrid items={REALISATIONS_META} variant="gallery" />
        </div>
        <div className="mt-9">
          <Cta href="/realisations" variant="micro" event="cta_voir_realisations">{t("ctaAll")} →</Cta>
        </div>
      </div>
    </section>
  );
}
