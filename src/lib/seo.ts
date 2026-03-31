import { locales } from "@/i18n/routing";

export function buildAlternates(path: string, locale: string) {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = loc === "en" ? `https://kaiocorp.com${path}` : `https://kaiocorp.com/${loc}${path}`;
  }
  languages["x-default"] = `https://kaiocorp.com${path}`;

  const canonical = locale === "en"
    ? `https://kaiocorp.com${path}`
    : `https://kaiocorp.com/${locale}${path}`;

  return { canonical, languages };
}
