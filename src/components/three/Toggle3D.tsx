"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { islandStore, safeStorage, writePreference } from "@/lib/three/island/store";
import { cn } from "@/lib/utils";

// "Expérience 3D : activée / désactivée" (spec §6). Overrides the default (on, except Save-Data / < 4 GB)
// per visitor; the choice is stored in localStorage. IslandJourney reacts to the store's `pref`/`restarts`.
// It shows the EFFECTIVE state (is the 3D running?). Pressing it while the 3D is off always restarts
// the world, even when the stored preference is already "on" (slow-GPU give-up, failed start).
// Visuals follow html[data-island] (set before first paint by the boot script, then kept in sync with
// the store's status), so the state is right before hydration; aria-pressed follows the store.
// Accessibility: the name is constant ("Expérience 3D") and aria-pressed alone carries the state — the
// visible "activée / désactivée" words are aria-hidden, so a screen reader doesn't hear the state twice, and
// so is the label's trailing colon (visual punctuation before those words, not part of the name).

interface Toggle3DProps {
  className?: string;
}

const subscribe = islandStore.subscribe;
const getEnabled = () => islandStore.get().status !== "off";
const getUnsupported = () => islandStore.get().unsupported;
const getServerEnabled = () => true;
const getServerUnsupported = () => false;

function onClick() {
  // Read the store, not the render: rapid clicks can land before React re-renders.
  if (islandStore.get().status !== "off") {
    writePreference(safeStorage(), "off");
    islandStore.set({ pref: "off" });
  } else {
    writePreference(safeStorage(), "on");
    islandStore.restart();
  }
}

export function Toggle3D({ className }: Toggle3DProps) {
  const t = useTranslations("b2b.island");
  const enabled = useSyncExternalStore(subscribe, getEnabled, getServerEnabled);
  const unsupported = useSyncExternalStore(subscribe, getUnsupported, getServerUnsupported);
  const label = t("toggle");
  const colon = /\s*:$/.exec(label)?.[0] ?? ""; // "Expérience 3D :" (FR: no-break space), "3D experience:"

  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onClick}
      disabled={unsupported}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-white/10 bg-surface-dark/70 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-accent/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        // No WebGL2: 3D is impossible — hidden (not focusable, not announced) but its space is kept (no layout shift).
        unsupported && "invisible",
        className,
      )}
    >
      <span aria-hidden="true" className="relative h-5 w-9 flex-none rounded-full bg-accent transition-colors [html[data-island=off]_&]:bg-white/15">
        <span className="absolute left-0 top-0.5 h-4 w-4 translate-x-[18px] rounded-full bg-surface-dark transition-transform motion-reduce:transition-none [html[data-island=off]_&]:translate-x-0.5" />
      </span>
      <span>
        {label.slice(0, label.length - colon.length)}
        {colon && <span aria-hidden="true">{colon}</span>}
      </span>
      {/* Both states share one grid cell: the button never changes width (no layout shift). Visual only. */}
      <span aria-hidden="true" className="grid">
        <span className="col-start-1 row-start-1 [html[data-island=off]_&]:invisible">{t("on")}</span>
        <span className="invisible col-start-1 row-start-1 [html[data-island=off]_&]:visible">{t("off")}</span>
      </span>
    </button>
  );
}
