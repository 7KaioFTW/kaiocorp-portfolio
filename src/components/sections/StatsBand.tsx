import { getTranslations } from "next-intl/server";
import { Glass } from "@/components/ui/Glass";
import mapsData from "@/data/maps.json";
import { TOTAL_COLLABORATORS, TOTAL_MAPS, TOTAL_MINUTES_LABEL } from "@/lib/stats";

// Homepage-only, always over the 3D world (spec specs/2026-09-27-3d-island-homepage.md §3.3).
export async function StatsBand() {
  const t = await getTranslations("b2b.stats");
  const brandCount = (mapsData as { brand?: string }[]).filter((m) => m.brand).length;

  const STATS = [
    { num: TOTAL_MINUTES_LABEL, lbl: t("minutesPlayed") },
    { num: `${TOTAL_MAPS}+`, lbl: t("shipped") },
    { num: `${TOTAL_COLLABORATORS}`, lbl: t("creators") },
    { num: `${brandCount} ${t("brandsUnit")}`, lbl: t("brandActivations") },
  ];

  // Stats chapter: sticky stage (150vh section) under the rising pillars. While the 3D is live the
  // visible numbers count up with their pillar (IslandJourney writes the aria-hidden layer); screen
  // readers and the static fallback always get the final value.
  return (
    <section data-island-chapter="stats" className="island-over3d island-chapter--stats relative">
      <div className="island-stage">
        <div className="mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-end px-6 pb-10 pt-24">
          <Glass on>
            <div aria-hidden="true" data-motion="sweep" className="motion-scan pointer-events-none absolute inset-x-0 top-0 h-px" />
            <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
              {STATS.map((s, i) => (
                <div key={s.lbl}>
                  <div className="bg-gradient-to-r from-white to-accent bg-clip-text font-heading text-2xl font-extrabold text-transparent sm:text-3xl md:text-4xl xl:text-5xl">
                    <span aria-hidden="true" data-island-stat={i} data-final={s.num}>{s.num}</span>
                    <span className="sr-only">{s.num}</span>
                  </div>
                  <div className="mt-1.5 text-sm text-slate-400">{s.lbl}</div>
                </div>
              ))}
            </div>
          </Glass>
        </div>
      </div>
    </section>
  );
}
