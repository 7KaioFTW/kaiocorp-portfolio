import { describe, expect, it } from "vitest";
import { nextHeaderHidden } from "./header";

const base = { y: 500, lastY: 480, hidden: false, locked: false };

describe("nextHeaderHidden", () => {
  it("hides when scrolling down past the threshold", () => {
    expect(nextHeaderHidden(base)).toBe(true);
  });
  it("shows when scrolling up", () => {
    expect(nextHeaderHidden({ ...base, y: 460, lastY: 480, hidden: true })).toBe(false);
  });
  it("never hides near the top of the page", () => {
    expect(nextHeaderHidden({ ...base, y: 100, lastY: 60 })).toBe(false);
  });
  it("never hides while locked (menu open or focus inside)", () => {
    expect(nextHeaderHidden({ ...base, locked: true })).toBe(false);
  });
  it("keeps its state on tiny scroll jitter", () => {
    expect(nextHeaderHidden({ ...base, y: 482, lastY: 480, hidden: true })).toBe(true);
    expect(nextHeaderHidden({ ...base, y: 482, lastY: 480, hidden: false })).toBe(false);
  });
});
