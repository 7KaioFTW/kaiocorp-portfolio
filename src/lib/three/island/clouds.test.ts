import { describe, expect, it } from "vitest";
import { cloudPlan } from "./clouds";
import { settingsFor } from "./quality";

describe("cloudPlan (spec §4: clouds detail and count per tier)", () => {
  it("high tier = prototype: detail 5, 64 sea / 8 background / 11 portal clusters", () => {
    expect(cloudPlan(settingsFor("high", 1))).toEqual({ detail: 5, sea: 64, background: 8, portal: 11 });
  });
  it("medium tier: detail 3 and −40 % clusters (path clusters are never thinned)", () => {
    expect(cloudPlan(settingsFor("medium", 1))).toEqual({ detail: 3, sea: 38, background: 5, portal: 7 });
  });
});
