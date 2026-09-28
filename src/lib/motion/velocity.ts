// Pure: scroll velocity (Lenis px/frame) → marquee playback rate — unit-tested in velocity.test.ts.
export function marqueeRate(velocity: number, prevDirection: 1 | -1): { rate: number; direction: 1 | -1 } {
  const direction: 1 | -1 = velocity > 0.5 ? 1 : velocity < -0.5 ? -1 : prevDirection;
  const boost = Math.min(Math.abs(velocity) / 8, 4);
  return { rate: direction * (1 + boost), direction };
}
