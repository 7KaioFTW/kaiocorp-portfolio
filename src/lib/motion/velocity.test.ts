import { describe, expect, it } from "vitest";
import { marqueeRate } from "./velocity";

describe("marqueeRate", () => {
  it("idles at base speed in the last direction", () => {
    expect(marqueeRate(0, 1)).toEqual({ rate: 1, direction: 1 });
    expect(marqueeRate(0, -1)).toEqual({ rate: -1, direction: -1 });
  });
  it("follows the scroll direction and speeds up with velocity", () => {
    expect(marqueeRate(16, -1)).toEqual({ rate: 3, direction: 1 });
    expect(marqueeRate(-16, 1)).toEqual({ rate: -3, direction: -1 });
  });
  it("caps the boost at 5× base speed", () => {
    expect(marqueeRate(1000, 1).rate).toBe(5);
  });
});
