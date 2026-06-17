"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/track";
import { PROOF, PROJECT_TYPES, BUDGETS, type ProjectType } from "@/content/site";

const field =
  "w-full rounded-lg border border-white/10 bg-surface-dark px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15";
const label = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";

export function BriefForm({ defaultType }: { defaultType?: ProjectType }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
        <p className="font-heading text-lg font-bold text-accent">Message envoyé&nbsp;!</p>
        <p className="mt-2 text-sm text-slate-400">Merci, on revient vers vous sous 24&nbsp;h pour discuter de votre projet.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.07] bg-surface p-6 sm:p-7">
      <input type="text" name="_honey" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="_subject" value="Nouveau brief — KaioCorp" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nom">Nom</label>
          <input id="nom" name="nom" required placeholder="Votre nom" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required placeholder="vous@entreprise.com" className={field} />
        </div>
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="entreprise">Entreprise</label>
        <input id="entreprise" name="entreprise" placeholder="Marque, agence, structure…" className={field} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="project_type">Type de projet</label>
          <select id="project_type" name="project_type" defaultValue={defaultType ?? PROJECT_TYPES[0]} className={field}>
            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="budget">Budget estimé</label>
          <select id="budget" name="budget" className={field}>
            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className={label} htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={4} placeholder="Décrivez votre idée, votre audience, votre objectif…" className={cn(field, "resize-none")} />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "mt-5 w-full rounded-md bg-gradient-to-r from-primary to-accent py-3.5 font-heading text-[13px] font-bold uppercase tracking-wider text-surface-dark transition-all hover:shadow-lg hover:shadow-accent/25",
          status === "sending" && "cursor-wait opacity-70"
        )}
      >
        {status === "sending" ? "Envoi…" : "Discuter de votre projet →"}
      </button>
      {status === "error" && (
        <p className="mt-3 text-xs text-red-300">
          Une erreur est survenue. Écrivez-nous directement à{" "}
          <a href={`mailto:${PROOF.email}`} className="underline">{PROOF.email}</a>.
        </p>
      )}
    </form>
  );
}
