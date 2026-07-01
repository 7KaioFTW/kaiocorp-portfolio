import { locales } from "@/i18n/routing";

/**
 * Canonical site origin — no `www`, no trailing slash.
 * Single source of truth for every SEO URL (canonical, hreflang, sitemap,
 * robots, metadataBase, JSON-LD). Never hardcode the domain anywhere else.
 */
export const SITE_URL = "https://kaiocorp.com";

/** Open Graph `og:locale` in language_TERRITORY form. Keep keys in sync with routed locales. */
const OG_LOCALES: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
};

/** Returns the OG-spec locale (e.g. "fr_FR") for a routed locale code; defaults to fr_FR. */
export function ogLocale(locale: string): string {
  return OG_LOCALES[locale] ?? "fr_FR";
}

export function buildAlternates(path: string, locale: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = loc === "fr" ? `${SITE_URL}${path}` : `${SITE_URL}/${loc}${path}`;
  }
  languages["x-default"] = `${SITE_URL}${path}`;

  const canonical = locale === "fr"
    ? `${SITE_URL}${path}`
    : `${SITE_URL}/${locale}${path}`;

  return { canonical, languages };
}
