import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const locales = [
  "en", "fr", "es", "de", "pt", "ar", "ja", "zh", "pt-BR", "nl", "da", "ro", "ru",
] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
  ar: "العربية",
  ja: "日本語",
  zh: "中文",
  "pt-BR": "Português (Brasil)",
  nl: "Nederlands",
  da: "Dansk",
  ro: "Română",
  ru: "Русский",
};

export const rtlLocales: Locale[] = ["ar"];
