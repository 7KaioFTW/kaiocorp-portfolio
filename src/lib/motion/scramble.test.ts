import { describe, expect, it } from "vitest";
import { scrambleFrame } from "./scramble";

const first = () => 0; // always the first glyph of each pool: "0", "A", "a"

describe("scrambleFrame", () => {
  it("returns the final text at progress 1", () => {
    expect(scrambleFrame("4,9 Md+", 1, first)).toBe("4,9 Md+");
  });
  it("keeps length, spaces and punctuation at progress 0", () => {
    expect(scrambleFrame("4,9 Md+", 0, first)).toBe("0,0 Aa+");
  });
  it("maps digits to digits and letters to same-case letters, accents included", () => {
    expect(scrambleFrame("ÉTÉ 24", 0, first)).toBe("AAA 00");
    expect(scrambleFrame("kaio", 0, first)).toBe("aaaa");
  });
  it("resolves left to right", () => {
    expect(scrambleFrame("WXYZ", 0.5, first)).toBe("WXAA");
  });
  it("clamps progress outside 0..1", () => {
    expect(scrambleFrame("WXYZ", 2, first)).toBe("WXYZ");
    expect(scrambleFrame("WXYZ", -1, first)).toBe("AAAA");
  });
});
