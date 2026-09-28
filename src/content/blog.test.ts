// src/content/blog.test.ts
import { describe, expect, it } from "vitest";
import { formatBillions } from "@/lib/stats";
import type { BlogPost } from "./blog";

describe("blog posts (routed locales)", () => {
  // Imported directly: getBlogPosts() resolves fr/es/de with a runtime require() that only the Next bundler handles.
  it.each(["fr", "en", "es", "de"])("%s quotes the computed total minutes, never a stale hardcoded one", async (locale) => {
    const posts = (await import(`./blog/${locale}.ts`)).blogPosts as BlogPost[];
    const text = posts.map((p) => p.content).join("\n");
    expect(text).not.toContain("${formatBillions"); // interpolation landed in a template literal, not a plain string
    expect(text).toContain(formatBillions(locale));
    expect(text).not.toMatch(/4[,.]7 ?(milliards|billion|Milliarden)|4\.700 millones/);
  });
});
