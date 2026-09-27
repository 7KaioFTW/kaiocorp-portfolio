import { describe, expect, it } from "vitest";
import { safely } from "./safely";

describe("safely", () => {
  it("returns the function's result", () => {
    expect(safely(() => 42, () => undefined)).toBe(42);
  });
  it("reports a thrown error and returns undefined instead of throwing", () => {
    const seen: unknown[] = [];
    const boom = new Error("preset failed");
    expect(
      safely(
        () => {
          throw boom;
        },
        (e) => seen.push(e),
      ),
    ).toBeUndefined();
    expect(seen).toEqual([boom]);
  });
});
