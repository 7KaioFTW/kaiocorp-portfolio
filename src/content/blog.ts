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

export function getBlogPosts(locale: string): BlogPost[] {
  switch (locale) {
    case "en": return en;
    case "fr": return require("./blog/fr").blogPosts;
    case "es": return require("./blog/es").blogPosts;
    case "de": return require("./blog/de").blogPosts;
    case "pt": return require("./blog/pt").blogPosts;
    case "ar": return require("./blog/ar").blogPosts;
    case "ja": return require("./blog/ja").blogPosts;
    case "zh": return require("./blog/zh").blogPosts;
    case "pt-BR": return require("./blog/pt-BR").blogPosts;
    case "nl": return require("./blog/nl").blogPosts;
    case "da": return require("./blog/da").blogPosts;
    case "ro": return require("./blog/ro").blogPosts;
    case "ru": return require("./blog/ru").blogPosts;
    default: return en;
  }
}

// Default English export for backward compat (sitemap, generateStaticParams)
export const blogPosts = en;
