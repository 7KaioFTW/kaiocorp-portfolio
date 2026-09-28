// Seeded randomness for the procedural island. One independent stream per scene module
// (`rngFor("clouds")`), so adding, skipping or reordering a module never changes another's layout.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  range(min: number, max: number): number;
}

export const WORLD_SEED = 20260927;

/** mulberry32 — the prototype's generator (playground/3d-proto-a-island.html:272). */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32-bit FNV-1a hash of a module name. */
export function hashName(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function rngFor(name: string): Rng {
  const next = mulberry32((WORLD_SEED ^ hashName(name)) >>> 0);
  return { next, range: (min, max) => min + (max - min) * next() };
}
