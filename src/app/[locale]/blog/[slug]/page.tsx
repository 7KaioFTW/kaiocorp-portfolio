import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { JsonLd } from "@/components/ui/JsonLd";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { buildAlternates } from "@/lib/seo";
import { getBlogPosts, blogPosts } from "@/content/blog";

export function generateStaticParams() { return blogPosts.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: { locale: string; slug: string } }): Promise<Metadata> {
  const posts = getBlogPosts(params.locale);
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: buildAlternates(`/blog/${post.slug}`, params.locale),
    openGraph: { title: post.title, description: post.description, type: "article", publishedTime: post.date },
  };
}

export default async function BlogPostPage({ params }: { params: { locale: string; slug: string } }) {
  const posts = getBlogPosts(params.locale);
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) notFound();
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const t = await getTranslations("blog");
  const tNav = await getTranslations("nav");

  return (
    <main className="min-h-screen bg-surface-dark pb-24 pt-28">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, author: { "@type": "Person", name: "Kaio" }, datePublished: post.date, dateModified: post.date, publisher: { "@type": "Organization", name: "Kaio Corporation" } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: tNav("home"), item: "https://kaiocorp.com" }, { "@type": "ListItem", position: 2, name: tNav("blog"), item: "https://kaiocorp.com/blog" }, { "@type": "ListItem", position: 3, name: post.title }] }} />

      <article className="mx-auto max-w-3xl px-6">
        <Breadcrumb items={[{ label: tNav("home"), href: "/" }, { label: tNav("blog"), href: "/blog" }, { label: post.title }]} />

        <header className="mb-10">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">{post.category}</span>
          <h1 className="mt-2 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{post.title}</h1>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400"><span>{post.date}</span><span>{post.readingTime}</span></div>
        </header>

        <MarkdownRenderer content={post.content} />

        <div className="mt-14 rounded-lg border border-white/5 bg-surface-light/30 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold text-purple-300">K</div>
            <div><p className="font-heading text-sm font-bold text-white">Kaio</p><p className="text-xs text-slate-400">{t("authorTitle")}</p></div>
          </div>
          <p className="mt-3 text-xs text-slate-400">{t("authorBio")} <Link href="/about" className="text-accent hover:text-accent-light">{t("learnMore")} &rarr;</Link></p>
        </div>

        <div className="mt-10 rounded-lg border border-accent/10 bg-accent/5 p-6 text-center">
          <p className="mb-3 text-sm text-slate-400">{t("needMap")}</p>
          <Link href="/contact" className="text-sm font-semibold text-accent hover:text-accent-light">{t("getInTouch")} &rarr;</Link>
        </div>

        {related.length > 0 && (
          <div className="mt-14 border-t border-white/5 pt-10">
            <h2 className="mb-6 font-heading text-sm font-bold uppercase tracking-wider text-slate-400">{t("relatedArticles")}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}` as `/blog/${string}`} className="group rounded-lg border border-white/5 bg-surface-light/30 p-4 transition-all hover:border-accent/20">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-purple-300">{r.category}</span>
                  <h3 className="mt-1 font-heading text-[11px] font-bold uppercase text-white group-hover:text-accent">{r.title}</h3>
                  <p className="mt-1 text-[10px] text-slate-400">{r.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
