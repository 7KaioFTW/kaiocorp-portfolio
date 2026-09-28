import { describe, expect, it, vi } from "vitest";
import { PREF_KEY, createIslandStore, readPreference, writePreference } from "./store";

describe("createIslandStore", () => {
  it("starts from the defaults", () => {
    expect(createIslandStore().get()).toEqual({ pref: "auto", status: "pending", focus: 0, unsupported: false, restarts: 0 });
  });
  it("notifies subscribers with a new snapshot on change", () => {
    const store = createIslandStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.get();
    store.set({ status: "live", focus: 3 });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).not.toBe(before);
    expect(store.get()).toMatchObject({ status: "live", focus: 3 });
  });
  it("keeps the same snapshot and stays silent when nothing changes (stable useSyncExternalStore)", () => {
    const store = createIslandStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const before = store.get();
    store.set({ status: "pending", focus: 0 });
    expect(listener).not.toHaveBeenCalled();
    expect(store.get()).toBe(before);
  });
  it("unsubscribes and resets", () => {
    const store = createIslandStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    store.set({ focus: 2 });
    expect(listener).not.toHaveBeenCalled();
    store.reset();
    expect(store.get().focus).toBe(0);
  });
});

describe("restart (explicit 3D on — Ruling S2)", () => {
  it("reaches the world even when pref is already on (set() alone would stay silent)", () => {
    const store = createIslandStore();
    store.set({ pref: "on", status: "off" }); // e.g. the world gave up on a slow GPU
    const listener = vi.fn();
    store.subscribe(listener);
    store.restart();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toMatchObject({ pref: "on", restarts: 1 });
    store.restart();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.get().restarts).toBe(2);
  });
  it("turns an off/auto preference on in the same notification", () => {
    const store = createIslandStore();
    store.set({ pref: "off", status: "off" });
    const listener = vi.fn();
    store.subscribe(listener);
    store.restart();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toMatchObject({ pref: "on", restarts: 1 });
  });
  it("does nothing when WebGL2 is missing", () => {
    const store = createIslandStore();
    store.set({ unsupported: true, status: "off" });
    const listener = vi.fn();
    store.subscribe(listener);
    store.restart();
    expect(listener).not.toHaveBeenCalled();
    expect(store.get()).toMatchObject({ pref: "auto", restarts: 0 });
  });
  it("reset() clears the restart count", () => {
    const store = createIslandStore();
    store.restart();
    store.reset();
    expect(store.get().restarts).toBe(0);
  });
});

describe("preference persistence", () => {
  const memory = () => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
  };
  it("reads on/off, anything else is auto", () => {
    const s = memory();
    expect(readPreference(s)).toBe("auto");
    s.data.set(PREF_KEY, "on");
    expect(readPreference(s)).toBe("on");
    s.data.set(PREF_KEY, "off");
    expect(readPreference(s)).toBe("off");
    s.data.set(PREF_KEY, "yes");
    expect(readPreference(s)).toBe("auto");
  });
  it("survives missing or throwing storage", () => {
    expect(readPreference(null)).toBe("auto");
    const throwing = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readPreference(throwing)).toBe("auto");
    expect(() => writePreference(throwing, "on")).not.toThrow();
    expect(() => writePreference(null, "on")).not.toThrow();
  });
  it("writes on/off and clears auto", () => {
    const s = memory();
    writePreference(s, "off");
    expect(s.data.get(PREF_KEY)).toBe("off");
    writePreference(s, "auto");
    expect(s.data.has(PREF_KEY)).toBe(false);
  });
});
