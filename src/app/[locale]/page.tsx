import dynamic from "next/dynamic";
import { getLocale } from "next-intl/server";
import { Hero } from "@/components/sections/Hero";
import { LatestPosts } from "@/components/sections/LatestPosts";
import { getBlogPosts } from "@/content/blog";

const FeaturedMaps = dynamic(() => import("@/components/sections/FeaturedMaps").then(m => ({ default: m.FeaturedMaps })));
const BrandCollabs = dynamic(() => import("@/components/sections/BrandCollabs").then(m => ({ default: m.BrandCollabs })));
const StatsSection = dynamic(() => import("@/components/sections/StatsSection").then(m => ({ default: m.StatsSection })));
const ServicesPreview = dynamic(() => import("@/components/sections/ServicesPreview").then(m => ({ default: m.ServicesPreview })));
const BottomCTA = dynamic(() => import("@/components/sections/BottomCTA").then(m => ({ default: m.BottomCTA })));

export default async function HomePage() {
  const locale = await getLocale();
  const posts = getBlogPosts(locale).slice(0, 3).map(({ slug, title, description, date, category, readingTime }) => ({ slug, title, description, date, category, readingTime }));

  return (
    <main>
      <Hero />
      <FeaturedMaps />
      <BrandCollabs />
      <StatsSection />
      <ServicesPreview />
      <LatestPosts posts={posts} />
      <BottomCTA />
    </main>
  );
}
