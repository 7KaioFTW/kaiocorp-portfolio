"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { cn } from "@/lib/utils";
import type { BlogPost } from "@/content/blog";

const CATEGORIES = ["All", "Map Design", "Verse Scripting", "Creator Economy", "Tutorials"] as const;

export function BlogList({ posts }: { posts: BlogPost[] }) {
  const t = useTranslations("blog");
  const [cat, setCat] = useState<string>("All");
  const filtered = useMemo(() => cat === "All" ? posts : posts.filter((p) => p.category === cat), [posts, cat]);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => <button key={c} onClick={() => setCat(c)} className={cn("rounded-md px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all", cat === c ? "bg-accent/15 text-accent" : "text-slate-400 hover:bg-white/5 hover:text-slate-400")}>{c === "All" ? t("filterAll") : c}</button>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((post, i) => (
          <ScrollReveal key={post.slug} delay={`${i * 60}ms`}>
            <Link href={`/blog/${post.slug}` as `/blog/${string}`} className="group block rounded-lg border border-white/5 bg-surface-light/30 p-5 transition-all hover:border-accent/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">{post.category}</span>
              <h2 className="mt-1 mb-2 font-heading text-xs font-bold uppercase tracking-wide text-white group-hover:text-accent">{post.title}</h2>
              <p className="mb-3 text-xs text-slate-400 line-clamp-2">{post.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400"><span>{post.date}</span><span>{post.readingTime}</span></div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </>
  );
}
