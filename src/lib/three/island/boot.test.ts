import { describe, expect, it } from "vitest";
import { ISLAND_BOOT_SCRIPT } from "./boot";
import { selectTier } from "./quality";
import { readPreference } from "./store";

interface Env {
  stored: string | null;
  storageThrows: boolean;
  reducedMotion: boolean;
  saveData: boolean | undefined;
  deviceMemory: number | undefined;
}

function runBootScript(env: Env): string | undefined {
  const attrs: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (name: string, value: string) => void (attrs[name] = value) } };
  const localStorage = {
    getItem: () => {
      if (env.storageThrows) throw new Error("SecurityError");
      return env.stored;
    },
  };
  const matchMedia = (query: string) => ({ matches: query.includes("reduce") && env.reducedMotion });
  const navigator = { connection: env.saveData === undefined ? undefined : { saveData: env.saveData }, deviceMemory: env.deviceMemory };
  new Function("document", "localStorage", "matchMedia", "navigator", ISLAND_BOOT_SCRIPT)(document, localStorage, matchMedia, navigator);
  return attrs["data-island"];
}

function expected(env: Env): string {
  const storage = { getItem: () => (env.storageThrows ? (() => { throw new Error("SecurityError"); })() : env.stored) };
  const tier = selectTier(
    { webgl2: true, reducedMotion: env.reducedMotion, saveData: env.saveData === true, deviceMemory: env.deviceMemory, coarsePointer: false, devicePixelRatio: 1 },
    readPreference(storage),
  );
  return tier === "off" ? "off" : "pending";
}

describe("ISLAND_BOOT_SCRIPT", () => {
  const envs: Env[] = [];
  for (const stored of [null, "on", "off", "garbage"])
    for (const storageThrows of [false, true])
      for (const reducedMotion of [false, true])
        for (const saveData of [undefined, false, true])
          for (const deviceMemory of [undefined, 2, 4, 8]) envs.push({ stored, storageThrows, reducedMotion, saveData, deviceMemory });

  it(`agrees with selectTier() for all ${envs.length} combinations`, () => {
    for (const env of envs) expect(runBootScript(env), JSON.stringify(env)).toBe(expected(env));
  });

  it("never throws, even without matchMedia", () => {
    expect(() => new Function("document", "localStorage", "matchMedia", "navigator", ISLAND_BOOT_SCRIPT)({ documentElement: { setAttribute() {} } }, null, undefined, {})).not.toThrow();
  });
});
