import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { Opportunity } from "@/components/sections/Opportunity";
import { Audiences } from "@/components/sections/Audiences";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Realisations } from "@/components/sections/Realisations";
import { StatsBand } from "@/components/sections/StatsBand";
import { Marquee } from "@/components/motion/Marquee";
import { Process } from "@/components/sections/Process";
import { WhyKaio } from "@/components/sections/WhyKaio";
import { SectorIdeas } from "@/components/sections/SectorIdeas";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";
import { IslandJourney } from "@/components/three/IslandJourney";
import { RING_MAPS } from "@/content/realisations";
import { ISLAND_BOOT_SCRIPT } from "@/lib/three/island/boot";

// The homepage is the 3D journey (spec specs/2026-09-27-3d-island-homepage.md): real sections, new
// order (Stats after Réalisations), every section floating over the world ("over3d").
export default async function HomePage() {
  const t = await getTranslations("b2b.realisations");
  return (
    <main>
      {/* Runs before the sections are parsed: html[data-island] is right on first paint (no sticky pop-in). */}
      <script dangerouslySetInnerHTML={{ __html: ISLAND_BOOT_SCRIPT }} />
      <IslandJourney maps={RING_MAPS} minutesUnit={t("units.minutes")} />
      <Hero />
      <Opportunity variant="over3d" />
      <Audiences />
      <ServicesGrid variant="over3d" />
      <Realisations />
      <StatsBand />
      <Marquee />
      <Process variant="over3d" />
      <WhyKaio />
      <SectorIdeas variant="over3d" />
      <FaqB2B variant="over3d" />
      <FinalCta variant="over3d" />
    </main>
  );
}
