// Scalar helpers shared by the island modules (prototype lines 265–271). Pure — no three, no DOM.
export const DEG = Math.PI / 180;

export const clamp = (x: number, min = 0, max = 1): number => Math.min(max, Math.max(min, x));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Smoothstep; works with reversed edges (a > b), which the prototype relies on. */
export const sstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t), 3);

/** Frame-rate independent exponential approach of `a` toward `b` (rate `k` per second). */
export const damp = (a: number, b: number, k: number, dt: number): number => lerp(a, b, 1 - Math.exp(-k * dt));
