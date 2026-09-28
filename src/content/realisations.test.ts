// src/content/realisations.test.ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import mapsData from "@/data/maps.json";
import { RING_MAPS } from "./realisations";

describe("RING_MAPS (3D ring chapter + its HTML list)", () => {
  it("lists 10 distinct maps — the ring has 10 slots", () => {
    expect(RING_MAPS).toHaveLength(10);
    expect(new Set(RING_MAPS.map((m) => m.id)).size).toBe(10);
  });
  it("takes every field from maps.json (single source of truth)", () => {
    for (const r of RING_MAPS) {
      const m = mapsData.find((x) => x.id === r.id);
      expect(m, r.id).toBeDefined();
      expect(r.title).toBe(m?.title);
      expect(r.creator).toBe(m?.creator);
      expect(r.minutes).toBe(m?.stats.minutesPlayed);
      expect(r.thumbnail).toBe(m?.thumbnail);
      expect(m?.tags).toContain(r.tag);
    }
  });
  it("only uses thumbnails that exist on disk (no 400 in the ring)", () => {
    for (const r of RING_MAPS) expect(existsSync(join(process.cwd(), "public", r.thumbnail)), r.thumbnail).toBe(true);
  });
});
