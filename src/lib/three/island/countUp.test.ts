import { describe, expect, it } from "vitest";
import { countUpText } from "./countUp";

describe("countUpText", () => {
  it("returns the final label at t ≥ 1", () => {
    expect(countUpText("4,9 Md+", 1)).toBe("4,9 Md+");
    expect(countUpText("4,9 Md+", 1.3)).toBe("4,9 Md+");
  });
  it("keeps decimals, the comma separator and the suffix", () => {
    expect(countUpText("4,9 Md+", 0)).toBe("0,0 Md+");
    expect(countUpText("4,9 Md+", 0.2)).toBe("1,0 Md+");
  });
  it("keeps a dot separator", () => {
    expect(countUpText("4.9B+", 0.2)).toBe("1.0B+");
  });
  it("counts integers with their suffix / unit", () => {
    expect(countUpText("16+", 0.5)).toBe("8+");
    expect(countUpText("3 marques", 0)).toBe("0 marques");
    expect(countUpText("5", 0.6)).toBe("3");
  });
  it("clamps negative / invalid t to 0 and leaves number-less labels alone", () => {
    expect(countUpText("16+", -1)).toBe("0+");
    expect(countUpText("16+", Number.NaN)).toBe("0+");
    expect(countUpText("—", 0.3)).toBe("—");
  });
});
