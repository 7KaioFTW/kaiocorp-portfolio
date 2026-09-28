// Pure: should the fixed header be hidden after this scroll step? — unit-tested in header.test.ts.
export interface HeaderScrollState {
  y: number;
  lastY: number;
  hidden: boolean;
  /** true while the mobile menu is open or focus is inside the header */
  locked: boolean;
}

const TOP_ZONE = 120; // px from the top where the header always shows
const JITTER = 4; // px of movement ignored

export function nextHeaderHidden({ y, lastY, hidden, locked }: HeaderScrollState): boolean {
  if (locked || y < TOP_ZONE) return false;
  const dy = y - lastY;
  if (dy > JITTER) return true;
  if (dy < -JITTER) return false;
  return hidden;
}
