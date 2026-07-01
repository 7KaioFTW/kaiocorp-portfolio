export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: "Map Design" | "Verse Scripting" | "Creator Economy" | "Tutorials";
  tags: string[];
  readingTime: string;
  content: string;
}

// English is always needed (default fallback + sitemap slugs)
import { blogPosts as en } from "./blog/en";

// Keep this switch in sync with the routed locales in src/i18n/routing.ts.
// Blog files for dropped locales (./blog/{pt,ar,ja,zh,pt-BR,nl,da,ro,ru}.ts) stay on
// disk but are intentionally un-referenced — re-activate one by re-adding its case here
// AND its locale in routing.ts. Unknown/dropped locales fall back to English.
export function getBlogPosts(locale: string): BlogPost[] {
  switch (locale) {
    case "fr": return require("./blog/fr").blogPosts;
    case "es": return require("./blog/es").blogPosts;
    case "de": return require("./blog/de").blogPosts;
    case "en":
    default: return en;
  }
}

// Default English export for backward compat (sitemap, generateStaticParams)
export const blogPosts = en;
