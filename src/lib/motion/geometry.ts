// Pure helpers (no DOM, no GSAP) — unit-tested in geometry.test.ts.

export interface VerticalRect {
  top: number;
  bottom: number;
}

/**
 * Should an element get a hidden initial state?
 * - Never if it is above the viewport (scrolled past — hiding it would strand it).
 * - On first load only if entirely below the fold: in-view content was painted before the
 *   engine arrived, re-hiding it would flicker.
 * - After a client navigation (animateInView), anything not above the viewport animates.
 */
export function shouldAnimate(rect: VerticalRect, viewportHeight: number, animateInView: boolean): boolean {
  if (rect.bottom <= 0) return false;
  if (animateInView) return true;
  return rect.top >= viewportHeight;
}

/** Pointer position inside an element (0..1 per axis) → 3D tilt in degrees, clamped to ±max. */
export function tiltAngles(px: number, py: number, max = 8): { rotationX: number; rotationY: number } {
  const cx = Math.min(Math.max(px, 0), 1) - 0.5;
  const cy = Math.min(Math.max(py, 0), 1) - 0.5;
  return { rotationX: -cy * 2 * max, rotationY: cx * 2 * max };
}
