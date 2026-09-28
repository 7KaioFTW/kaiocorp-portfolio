// src/lib/three/island/store.ts
// Tiny external store shared by IslandJourney (writer), Toggle3D and MapFocusCard (readers via
// useSyncExternalStore). No three import — safe in the initial bundle.
import type { Preference } from "./quality";

/** Mirrors `html[data-island]`: pending (decided on, not loaded) → loading → live; off = poster. */
export type IslandStatus = "pending" | "loading" | "live" | "off";

export interface IslandSnapshot {
  readonly pref: Preference;
  readonly status: IslandStatus;
  /** Index in the ring's map list of the screen the camera faces. */
  readonly focus: number;
  /** No WebGL2 on this device (not merely a software-only GL): the toggle hides itself. */
  readonly unsupported: boolean;
  /** Explicit "3D on" requests (the toggle, via restart()); each one restarts the world. */
  readonly restarts: number;
}

export interface IslandStore {
  get(): IslandSnapshot;
  set(patch: Partial<IslandSnapshot>): void;
  subscribe(listener: () => void): () => void;
  reset(): void;
  /**
   * The visitor asked for 3D: pref "on" + a restart request, so the world restarts even when pref is
   * already "on" (set() no-ops on unchanged values) — after a slow-GPU give-up or a failed start.
   * No-op when WebGL2 is missing.
   */
  restart(): void;
}

const INITIAL: IslandSnapshot = { pref: "auto", status: "pending", focus: 0, unsupported: false, restarts: 0 };

export function createIslandStore(initial: IslandSnapshot = INITIAL): IslandStore {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const set = (patch: Partial<IslandSnapshot>) => {
    const keys = Object.keys(patch) as (keyof IslandSnapshot)[];
    if (keys.every((key) => patch[key] === snapshot[key])) return; // unchanged → same snapshot object
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  };
  return {
    get: () => snapshot,
    set,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset: () => set(initial),
    restart() {
      if (!snapshot.unsupported) set({ pref: "on", restarts: snapshot.restarts + 1 });
    },
  };
}

export const islandStore = createIslandStore();

export const PREF_KEY = "kc-island-3d";

/** localStorage, or null when unavailable (SSR, blocked storage, sandboxed iframes). */
export function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readPreference(storage: Pick<Storage, "getItem"> | null): Preference {
  try {
    const value = storage?.getItem(PREF_KEY);
    return value === "on" || value === "off" ? value : "auto";
  } catch {
    return "auto";
  }
}

export function writePreference(storage: Pick<Storage, "setItem" | "removeItem"> | null, pref: Preference): void {
  try {
    if (pref === "auto") storage?.removeItem(PREF_KEY);
    else storage?.setItem(PREF_KEY, pref);
  } catch {
    // Blocked storage: the choice still applies for this page view (store state).
  }
}
