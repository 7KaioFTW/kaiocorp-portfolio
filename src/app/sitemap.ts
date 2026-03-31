import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import mapsData from "@/data/maps.json";
import { blogPosts } from "@/content/blog";
import type { FortniteMap } from "@/types";

const maps = mapsData as FortniteMap[];

function localeUrl(path: string, locale: string) {
  return locale === "en" ? `https://kaiocorp.com${path}` : `https://kaiocorp.com/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const staticPages = [
    { path: "", priority: 1.0, freq: "weekly" as const },
    { path: "/maps", priority: 0.9, freq: "weekly" as const },
    { path: "/services", priority: 0.9, freq: "monthly" as const },
    { path: "/about", priority: 0.7, freq: "monthly" as const },
    { path: "/contact", priority: 0.6, freq: "monthly" as const },
    { path: "/blog", priority: 0.8, freq: "daily" as const },
  ];

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: localeUrl(page.path || "/", locale),
        lastModified: new Date(),
        changeFrequency: page.freq,
        priority: page.priority,
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
      });
    }
  }

  return entries;
}
