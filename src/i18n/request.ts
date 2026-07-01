import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

// Explicit per-locale loaders so webpack bundles ONLY the routed message files.
// A wildcard `import(`../messages/${locale}.json`)` builds a require-context over the
// whole src/messages/ dir, pulling every un-routed locale (~322KB) into the server
// build. Keep these keys in sync with routing.locales (add a locale here + in routing.ts).
const loaders = {
  fr: () => import("../messages/fr.json"),
  en: () => import("../messages/en.json"),
  es: () => import("../messages/es.json"),
  de: () => import("../messages/de.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (requested && requested in loaders ? requested : routing.defaultLocale) as keyof typeof loaders;
  return {
    locale,
    messages: (await loaders[locale]()).default,
  };
});
