"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface LatestPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  readingTime: string;
}

export function LatestPosts({ posts }: { posts: LatestPost[] }) {
  const t = useTranslations("latestPosts");

  return (
    <section className="bg-surface-dark py-24">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal><h2 className="mb-12 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h2></ScrollReveal>
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((post, i) => (
            <ScrollReveal key={post.slug} delay={`${i * 100}ms`}>
              <Link href={`/blog/${post.slug}` as `/blog/${string}`} className="group block rounded-lg border border-white/5 bg-surface-light/30 p-5 transition-all hover:border-accent/20">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">{post.category}</span>
                <h3 className="mt-1 mb-2 font-heading text-xs font-bold uppercase tracking-wide text-white group-hover:text-accent">{post.title}</h3>
                <p className="mb-3 text-xs text-slate-400 line-clamp-2">{post.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400"><span>{post.date}</span><span>{post.readingTime}</span></div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay="300ms">
          <div className="mt-8 text-center">
            <Link href="/blog" className="text-sm font-semibold text-accent hover:text-accent-light">{t("readMore")} &rarr;</Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
