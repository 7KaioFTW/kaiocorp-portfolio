import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildAlternates } from "@/lib/seo";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  return { title: t("contactTitle"), description: t("contactDescription"), alternates: buildAlternates("/contact", params.locale) };
}

export default async function ContactPage() {
  const t = await getTranslations("nav");
  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <div className="mx-auto max-w-2xl px-6">
        <Breadcrumb items={[{ label: t("home"), href: "/" }, { label: t("contact") }]} />
        <ContactForm />
      </div>
    </main>
  );
}
