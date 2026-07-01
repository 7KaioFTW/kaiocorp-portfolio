import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

// Active, routed locales (sitemap + hreflang). Reduced from 13 → 4 to avoid
// thin/duplicate content and crawl-budget waste on a young domain. Translated
// src/messages/*.json + src/content/blog/* for the dropped locales stay in the
// repo (un-routed) so they can be re-activated by adding them back here.
export const locales = [
  "en", "fr", "es", "de",
] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "fr",
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
};

// No RTL locale currently routed (ar dropped). Re-add "ar" here if re-activated.
export const rtlLocales: Locale[] = [];
