"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";
import { PROOF, type ProjectType, type ProjectTypeOption } from "@/content/site";

const field =
  "w-full rounded-lg border border-white/10 bg-surface-dark px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

export function BriefForm({ defaultType }: { defaultType?: ProjectType }) {
  const t = useTranslations("b2b.form");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const projectTypes = t.raw("projectTypes") as ProjectTypeOption[];
  const budgets = t.raw("budgets") as string[];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    track("form_submit", { type: (form.elements.namedItem("project_type") as HTMLSelectElement)?.value });
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${PROOF.email}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      setStatus(res.ok ? "sent" : "error");
      if (res.ok) form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-10 text-center animate-[fadeIn_0.3s_ease-out]">
        <p className="font-heading text-lg font-bold text-accent">{t("sentTitle")}</p>
        <p className="mt-2 text-sm text-slate-400">{t("sentText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.07] bg-surface p-6 sm:p-7">
      <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="_subject" value="Nouveau brief — KaioCorp" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nom">{t("labelNom")}</label>
          <input id="nom" name="nom" required placeholder={t("phNom")} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">{t("labelEmail")}</label>
          <input id="email" name="email" type="email" required placeholder={t("phEmail")} className={field} />
        </div>
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="entreprise">{t("labelEntreprise")}</label>
        <input id="entreprise" name="entreprise" placeholder={t("phEntreprise")} className={field} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="project_type">{t("labelType")}</label>
          <select id="project_type" name="project_type" defaultValue={defaultType ?? projectTypes[0].value} className={field}>
            {projectTypes.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="budget">{t("labelBudget")}</label>
          <select id="budget" name="budget" className={field}>
            {budgets.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="message">{t("labelMessage")}</label>
        <textarea id="message" name="message" rows={4} placeholder={t("phMessage")} className={cn(field, "resize-none")} />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "mt-5 w-full rounded-md bg-gradient-to-r from-primary to-accent py-3.5 font-heading text-[13px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:shadow-lg hover:shadow-accent/25",
          status === "sending" && "cursor-wait opacity-70"
        )}
      >
        {status === "sending" ? t("sending") : `${t("submit")} →`}
      </button>
      {status === "error" && (
        <p className="mt-3 text-xs text-red-300">
          {t("errorText")}{" "}
          <a href={`mailto:${PROOF.email}`} className="underline">{PROOF.email}</a>.
        </p>
      )}
    </form>
  );
}
