import { locales } from "@/i18n/routing";

/**
 * Canonical site origin — no `www`, no trailing slash.
 * Single source of truth for every SEO URL (canonical, hreflang, sitemap,
 * robots, metadataBase, JSON-LD). Never hardcode the domain anywhere else.
 */
export const SITE_URL = "https://kaiocorp.com";

/** Absolute URL for a path in a given locale (fr = root; others = "/{locale}" prefix). */
export function localeUrl(path: string, locale: string): string {
  return locale === "fr" ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

/** hreflang alternates map for a path: every routed locale + `x-default` (fr root). */
export function localeAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = localeUrl(path, loc);
  languages["x-default"] = localeUrl(path, "fr");
  return languages;
}

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
  return { canonical: localeUrl(path, locale), languages: localeAlternates(path) };
}
