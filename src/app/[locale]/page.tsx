import { Hero } from "@/components/sections/Hero";
import { Opportunity } from "@/components/sections/Opportunity";
import { Audiences } from "@/components/sections/Audiences";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { StatsBand } from "@/components/sections/StatsBand";
import { Realisations } from "@/components/sections/Realisations";
import { Process } from "@/components/sections/Process";
import { WhyKaio } from "@/components/sections/WhyKaio";
import { SectorIdeas } from "@/components/sections/SectorIdeas";
import { FaqB2B } from "@/components/sections/FaqB2B";
import { FinalCta } from "@/components/sections/FinalCta";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Opportunity />
      <Audiences />
      <ServicesGrid />
      <StatsBand />
      <Realisations />
      <Process />
      <WhyKaio />
      <SectorIdeas />
      <FaqB2B />
      <FinalCta />
    </main>
  );
}
