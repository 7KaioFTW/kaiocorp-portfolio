"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapRow } from "@/components/maps/MapRow";
import { cn, leaderboardOrder } from "@/lib/utils";
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";

const allMaps = mapsData as FortniteMap[];
const FILTERS = ["All", "Martoz", "GamersOrigin", "WZF", "7Kaio", "Greencat", "Teekzie", "Knzi"] as const;
const KEY: Record<string, string> = { Martoz: "MARTOZ", GamersOrigin: "GAMERSORIGIN", WZF: "WZF", "7Kaio": "7KAIO", Greencat: "GREENCAT", Teekzie: "TEEKZIE", Knzi: "KNZI" };

export function MapLeaderboard() {
  const t = useTranslations("maps");
  const [filter, setFilter] = useState<string>("All");
  const maps = useMemo(() => {
    const f = filter === "All" ? allMaps : allMaps.filter((m) => m.creator === KEY[filter]);
    return leaderboardOrder(f);
  }, [filter]);

  // New rows mounted by a filter change → ask the motion engine to animate them.
  const firstFilter = useRef(true);
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    window.dispatchEvent(new Event("motion:rescan"));
  }, [filter]);

  return (
    <>
      <div className="mb-8 flex gap-2">
        {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={cn("rounded-md px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all", filter === f ? "bg-accent/15 text-accent" : "text-slate-400 hover:bg-white/5 hover:text-slate-400")}>{f === "All" ? t("filterAll") : f}</button>)}
      </div>
      <div className="flex flex-col gap-2">{maps.map((map, i) => <MapRow key={map.id} map={map} rank={i + 1} />)}</div>
    </>
  );
}
