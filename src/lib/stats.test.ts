import { describe, expect, it } from "vitest";
import mapsData from "@/data/maps.json";
import { TOTAL_MAPS, TOTAL_MINUTES, formatBillions } from "@/lib/stats";

describe("formatBillions", () => {
  it("always shows one decimal with the locale separator", () => {
    expect(formatBillions("fr", 5_000_000_000)).toBe("5,0");
    expect(formatBillions("en", 5_000_000_000)).toBe("5.0");
    expect(formatBillions("de", 4_939_159_700)).toBe("4,9");
  });
  it("floors instead of rounding (never overstates)", () => {
    expect(formatBillions("en", 4_999_999_999)).toBe("4.9");
  });
  it("defaults to the computed site total", () => {
    expect(Number(formatBillions("en"))).toBe(Math.floor(TOTAL_MINUTES / 100_000_000) / 10);
  });
});

describe("TOTAL_MAPS", () => {
  it("counts every entry in maps.json", () => {
    expect(TOTAL_MAPS).toBe(mapsData.length);
  });
});
