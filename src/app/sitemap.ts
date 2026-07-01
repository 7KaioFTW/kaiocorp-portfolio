import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { localeUrl, localeAlternates } from "@/lib/seo";
import mapsData from "@/data/maps.json";
import { blogPosts } from "@/content/blog";
import type { FortniteMap } from "@/types";

const maps = mapsData as FortniteMap[];

// Content-derived "last updated" — stable across deploys (changes only when real
// content changes), so build time never leaks into <lastmod> for static pages.
const siteLastMod = new Date(
  Math.max(
    ...maps.map((m) => new Date(m.updated).getTime()),
    ...blogPosts.map((p) => new Date(p.date).getTime()),
  ),
);

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const staticPages = [
    { path: "", priority: 1.0, freq: "weekly" as const },
    { path: "/activations-de-marque", priority: 0.95, freq: "monthly" as const },
    { path: "/agences", priority: 0.9, freq: "monthly" as const },
    { path: "/createurs-esport", priority: 0.9, freq: "monthly" as const },
    { path: "/realisations", priority: 0.9, freq: "weekly" as const },
    { path: "/maps", priority: 0.8, freq: "weekly" as const },
    { path: "/services", priority: 0.9, freq: "monthly" as const },
    { path: "/about", priority: 0.7, freq: "monthly" as const },
    { path: "/contact", priority: 0.7, freq: "monthly" as const },
    { path: "/blog", priority: 0.8, freq: "daily" as const },
  ];

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(page.path, locale),
        lastModified: siteLastMod,
        changeFrequency: page.freq,
        priority: page.priority,
        alternates: { languages: localeAlternates(page.path) },
      });
    }
  }

  for (const map of maps) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(`/maps/${map.id}`, locale),
        lastModified: new Date(map.updated),
        changeFrequency: "monthly",
        priority: 0.85,
        alternates: { languages: localeAlternates(`/maps/${map.id}`) },
      });
    }
  }

  for (const post of blogPosts) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(`/blog/${post.slug}`, locale),
        lastModified: new Date(post.date),
        changeFrequency: "weekly",
        priority: 0.75,
        alternates: { languages: localeAlternates(`/blog/${post.slug}`) },
      });
    }
  }

  return entries;
}
