import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";
import { cn } from "@/lib/utils";

const TITLES = (mapsData as FortniteMap[]).map((m) => m.title);

// Decorative marquee of every map title (duplicates real content → aria-hidden). The CSS loop
// runs without JS; the motion engine bends its speed/direction with scroll velocity.
// Homepage-only, always over the 3D world: transparent background, the world shows through (spec §3.2).
export function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {TITLES.map((title, i) => (
        <span
          key={`${i}-${title}`}
          className={cn(
            "font-heading text-3xl font-extrabold uppercase md:text-5xl",
            i % 2 === 0 ? "text-white/85" : "text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)]",
          )}
        >
          {title}
          <span className="mx-6 text-accent md:mx-10">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div data-motion="marquee" aria-hidden="true" className="overflow-hidden border-y border-white/5 py-6 md:py-8">
      <div className="motion-marquee-track flex w-max whitespace-nowrap">
        {row}
        {row}
      </div>
    </div>
  );
}
