import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildAlternates } from "@/lib/seo";
import { getBlogPosts } from "@/content/blog";
import { BlogList } from "./BlogList";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "metadata" });
  return { title: t("blogTitle"), description: t("blogDescription"), alternates: buildAlternates("/blog", params.locale) };
}

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const posts = getBlogPosts(locale);

  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <div className="mx-auto max-w-5xl px-6">
        <Breadcrumb items={[{ label: tNav("home"), href: "/" }, { label: tNav("blog") }]} />
        <h1 className="mb-2 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("pageTitle")}</h1>
        <p className="mb-10 max-w-2xl text-sm text-slate-400">{t("pageDescription")}</p>
        <BlogList posts={posts} />
      </div>
    </main>
  );
}
