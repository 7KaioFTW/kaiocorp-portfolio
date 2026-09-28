"use client";

import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/routing";
import { islandStore } from "@/lib/three/island/store";
import type { RingMapInfo } from "@/lib/three/island/types";

// HTML card for the ring screen the camera faces (spec §3.1). Only rendered while the 3D is live;
// the ring chapter's HTML list carries the same maps for everyone else.

interface MapFocusCardProps {
  maps: RingMapInfo[];
  minutesUnit: string;
}

const subscribe = islandStore.subscribe;
const getFocus = () => islandStore.get().focus;
const getLive = () => islandStore.get().status === "live";
const getServerFocus = () => 0;
const getServerLive = () => false;

export function MapFocusCard({ maps, minutesUnit }: MapFocusCardProps) {
  const focus = useSyncExternalStore(subscribe, getFocus, getServerFocus);
  const live = useSyncExternalStore(subscribe, getLive, getServerLive);
  const map = maps[focus];
  if (!live || !map) return null;
  return (
    <div data-island-focus className="island-glass relative w-full max-w-sm shrink-0 lg:col-start-2 lg:row-start-2">
      <p aria-hidden="true" className="font-heading text-3xl font-extrabold leading-none text-white md:text-5xl">
        {String(focus + 1).padStart(2, "0")}
        <small className="ml-1.5 text-base font-semibold tracking-[0.14em] text-slate-400">/{maps.length}</small>
      </p>
      <div key={map.id} className="island-swap">
        <h3 className="mt-2 font-heading text-sm font-bold uppercase tracking-[0.08em] text-white md:mt-3 md:text-base">
          <Link
            href={`/maps/${map.id}` as `/maps/${string}`}
            className="after:absolute after:inset-0 after:rounded-[1.25rem] hover:text-accent focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent"
          >
            {map.title}
            <span aria-hidden="true"> ↗</span>
          </Link>
        </h3>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          {map.creator} · {map.minutes} {minutesUnit}
        </p>
      </div>
    </div>
  );
}
