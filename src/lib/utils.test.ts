// src/lib/utils.test.ts
import { describe, expect, it } from "vitest";
import mapsData from "@/data/maps.json";
import type { FortniteMap } from "@/types";
import { leaderboardOrder, parseStatNumber } from "./utils";

const map = (id: string, minutesPlayed: string, pinned?: boolean) => ({ id, pinned, stats: { minutesPlayed } });

describe("leaderboardOrder", () => {
  it("puts pinned maps first, then the rest by minutes played (highest first)", () => {
    const out = leaderboardOrder([map("a", "12M"), map("b", "1.6B"), map("pin", "228.1M", true), map("c", "895.1K")]);
    expect(out.map((m) => m.id)).toEqual(["pin", "b", "a", "c"]);
  });
  it("keeps pinned maps in their data order and does not mutate the input", () => {
    const input = [map("p2", "1K", true), map("x", "5M"), map("p1", "9B", true)];
    const out = leaderboardOrder(input);
    expect(out.map((m) => m.id)).toEqual(["p2", "p1", "x"]);
    expect(input.map((m) => m.id)).toEqual(["p2", "x", "p1"]);
  });
  it("pins Sprite Pillars at the top of the real leaderboard", () => {
    const out = leaderboardOrder(mapsData as FortniteMap[]);
    expect(out[0].id).toBe("sprite-pillars");
    const rest = out.slice(1).map((m) => parseStatNumber(m.stats.minutesPlayed));
    expect(rest).toEqual([...rest].sort((a, b) => b - a));
  });
});
