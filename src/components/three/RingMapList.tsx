"use client";

import { useEffect, useRef, useSyncExternalStore, type FocusEvent } from "react";
import { Link } from "@/i18n/routing";
import { islandStore } from "@/lib/three/island/store";
import type { RingMapInfo } from "@/lib/three/island/types";

// The ring chapter's HTML list of the 10 maps (spec §7). While the 3D is live, the item of the screen the camera
// faces carries data-active; below lg (motion.css) the list is a horizontal chip row, kept scrolled to that chip.

interface RingMapListProps {
  maps: RingMapInfo[];
  minutesUnit: string;
  label: string;
}

const subscribe = islandStore.subscribe;
const getActive = () => {
  const { status, focus } = islandStore.get();
  return status === "live" ? focus : -1;
};
const getServerActive = () => -1;

/**
 * Scrolls the chip row itself (never the page) so `item` sits at the row's snap start (the last chips stop at the
 * end). No-op when the list is not a scrolling row (lg+ column, 3D off).
 */
function scrollChipIntoRow(list: HTMLElement, item: Element, behavior: ScrollBehavior): void {
  if (list.scrollWidth <= list.clientWidth) return;
  const pad = parseFloat(getComputedStyle(list).scrollPaddingLeft) || 0;
  list.scrollBy({ left: item.getBoundingClientRect().left - list.getBoundingClientRect().left - pad, behavior });
}

/**
 * Keyboard focus: the focused chip always lands fully in the row (with mandatory snapping, the browser's own
 * focus scroll can re-snap it half out of view). Keyboard only — a mouse/tap focuses the link on pointer down,
 * and moving the chip then would swallow the click.
 */
function onChipFocus(e: FocusEvent<HTMLOListElement>): void {
  const target = e.target as HTMLElement;
  const item = target.matches(":focus-visible") ? target.closest("li") : null;
  if (item) scrollChipIntoRow(e.currentTarget, item, "auto");
}

export function RingMapList({ maps, minutesUnit, label }: RingMapListProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const active = useSyncExternalStore(subscribe, getActive, getServerActive);

  // Low frequency (focus changes only): keep the highlighted chip in view, unless the visitor is tabbing
  // through the row (keyboard focus wins).
  useEffect(() => {
    const list = listRef.current;
    const item = active >= 0 ? list?.children[active] : undefined;
    if (!list || !item || list.contains(document.activeElement)) return;
    scrollChipIntoRow(list, item, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  }, [active]);

  return (
    <ol ref={listRef} aria-label={label} onFocus={onChipFocus} className="grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
      {maps.map((m, i) => (
        <li key={m.id} data-active={i === active ? "" : undefined} className="min-w-0">
          <Link
            href={`/maps/${m.id}` as `/maps/${string}`}
            className="font-semibold text-slate-200 underline-offset-4 hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span aria-hidden="true" className="mr-1.5 font-heading text-accent">{String(i + 1).padStart(2, "0")}</span>
            {m.title}
          </Link>{" "}
          <span className="whitespace-nowrap text-slate-400">· {m.minutes} {minutesUnit}</span>
        </li>
      ))}
    </ol>
  );
}
