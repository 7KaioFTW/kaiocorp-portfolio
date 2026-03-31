"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import creatorData from "@/data/creator.json";
import type { Creator } from "@/types";

const creator = creatorData as Creator;
const inputCls = "w-full rounded-md border border-white/10 bg-surface-light px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent";

export function ContactForm() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    try {
      const res = await fetch("https://formsubmit.co/ajax/contact@kaiocorp.com", { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) form.reset();
    } catch { setStatus("error"); }
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <h1 className="mb-2 font-heading text-2xl font-bold uppercase tracking-wide text-white md:text-3xl">{t("title")}</h1>
      <p className="mb-10 text-sm text-slate-400">{t("subtitle")}</p>
      {status === "sent" ? (
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-10 text-center animate-[fadeIn_0.3s_ease-out]">
          <p className="font-heading text-lg font-bold text-accent">{t("sent")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("sentSubtitle")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />
          <div className="grid gap-5 md:grid-cols-2">
            <div><label htmlFor="project" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{t("projectType")}</label><select id="project" name="project_type" required className={inputCls}><option value="">{t("select")}</option><option>{t("projectCompetitive")}</option><option>{t("projectTycoon")}</option><option>{t("projectCustom")}</option><option>{t("projectVerse")}</option><option>{t("projectBrand")}</option><option>{t("projectOther")}</option></select></div>
            <div><label htmlFor="timeline" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{t("timeline")}</label><select id="timeline" name="timeline" required className={inputCls}><option value="">{t("select")}</option><option>{t("timelineAsap")}</option><option>{t("timeline1to3")}</option><option>{t("timelineFlexible")}</option></select></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div><label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{t("name")}</label><input type="text" id="name" name="name" required placeholder={t("namePlaceholder")} className={inputCls} /></div>
            <div><label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{t("email")}</label><input type="email" id="email" name="email" required placeholder={t("emailPlaceholder")} className={inputCls} /></div>
          </div>
          <div><label htmlFor="message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{t("message")}</label><textarea id="message" name="message" required rows={4} placeholder={t("messagePlaceholder")} className={cn(inputCls, "resize-none")} /></div>
          <button type="submit" disabled={status === "sending"} className={cn("w-full rounded-md bg-accent py-3 font-heading text-[13px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:bg-accent-light hover:shadow-lg hover:shadow-accent/15", status === "sending" && "cursor-wait opacity-70")}>{status === "sending" ? t("sending") : t("send")}</button>
          {status === "error" && <p className="text-xs text-red-300">{t("error", { email: creator.email })}</p>}
        </form>
      )}
      <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-400">
        <a href={`mailto:${creator.email}`} className="hover:text-accent">{creator.email}</a>
        <a href={creator.social.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Twitter</a>
      </div>
    </div>
  );
}
