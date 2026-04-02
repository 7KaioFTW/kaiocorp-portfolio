import type { Metadata } from "next";
import { Inter, Orbitron, Noto_Sans_JP, Noto_Sans_SC } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/ui/JsonLd";
import { locales, rtlLocales, type Locale } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", display: "swap" });
const notoJP = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto-jp", display: "swap", weight: ["400", "700"] });
const notoSC = Noto_Sans_SC({ subsets: ["latin"], variable: "--font-noto-sc", display: "swap", weight: ["400", "700"] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function buildHreflangAlternates() {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = loc === "en" ? "https://kaiocorp.com" : `https://kaiocorp.com/${loc}`;
  }
  languages["x-default"] = "https://kaiocorp.com";
  return languages;
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  const canonicalUrl = params.locale === "en" ? "https://kaiocorp.com" : `https://kaiocorp.com/${params.locale}`;

  return {
    metadataBase: new URL("https://kaiocorp.com"),
    title: { template: "%s | Kaio — Fortnite UEFN Map Developer", default: t("homeTitle") },
    description: t("homeDescription"),
    openGraph: { type: "website", siteName: "Kaio UEFN Portfolio", locale: params.locale },
    twitter: { card: "summary_large_image", creator: "@7KaioFTW" },
    robots: { index: true, follow: true, "max-image-preview": "large" as const },
    alternates: {
      canonical: canonicalUrl,
      languages: buildHreflangAlternates(),
    },
  };
}

const personSchema = { "@context": "https://schema.org", "@type": "Person", name: "Kaio", jobTitle: "UEFN Map Developer", sameAs: ["https://twitter.com/7KaioFTW", "https://fortnite.gg/creator/kaio"], knowsAbout: ["UEFN", "Fortnite Creative", "Verse Programming", "Game Design"] };
const orgSchema = { "@context": "https://schema.org", "@type": "Organization", name: "Kaio Corporation", url: "https://kaiocorp.com" };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const locale = params.locale as Locale;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();
  const isRtl = rtlLocales.includes(locale);
  const cjkFont = locale === "ja" ? notoJP.variable : locale === "zh" ? notoSC.variable : "";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} className={`${inter.variable} ${orbitron.variable} ${cjkFont}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#7B2FBE" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3020506952463600" crossOrigin="anonymous"></script>
      </head>
      <body className="font-body bg-surface-dark text-slate-200 antialiased">
        <NextIntlClientProvider messages={messages}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-surface-dark focus:font-semibold">
            Skip to content
          </a>
          <JsonLd data={personSchema} />
          <JsonLd data={orgSchema} />
          <Header />
          <div id="main-content">
            {children}
          </div>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
