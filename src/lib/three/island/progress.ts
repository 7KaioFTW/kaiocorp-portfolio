// Scroll position → camera progress p ∈ [0, 1] (spec §3.2), driven by the real homepage sections.
// Pure: IslandJourney measures the sections (on load / resize / content change) and passes the boxes in.

/** p reached at document scroll position y. Anchors are sorted by y; progress is linear between them. */
export interface Anchor {
  readonly y: number;
  readonly p: number;
}

/** Document-space measurements (px) of the homepage chapters. */
export interface ChapterBoxes {
  /** documentElement.clientHeight — stable under mobile toolbar show/hide. */
  viewport: number;
  /** scrollHeight − viewport. */
  maxScroll: number;
  heroBottom: number;
  ringTop: number;
  ringHeight: number;
  /** Height of the ring chapter's sticky stage. */
  ringStage: number;
  statsTop: number;
  statsHeight: number;
  statsStage: number;
  ctaTop: number;
  ctaHeight: number;
}

/** Spec §3.2 table: p at each chapter boundary (prototype keyframe space). */
export const CHAPTER_P = {
  heroEnd: 0.14,
  ringStart: 0.27,
  ringEnd: 0.556,
  statsStart: 0.59,
  statsEnd: 0.8,
  ctaStart: 0.906,
  end: 1,
} as const;

/**
 * Scroll range [start, end] during which a sticky stage is pinned inside its section.
 * The stage sticks at `top = min(0, viewport − stage)` (a taller-than-viewport stage pins by its bottom).
 */
export function stickyRange(sectionTop: number, sectionHeight: number, stage: number, viewport: number): [number, number] {
  const stickTop = Math.min(0, viewport - stage);
  const start = sectionTop - stickTop;
  const end = sectionTop + sectionHeight - stage - stickTop;
  return [start, Math.max(start, end)];
}

function monotonic(anchors: Anchor[]): Anchor[] {
  let previous = -Infinity;
  return anchors.map(({ y, p }) => {
    const safeY = Math.max(y, previous);
    previous = safeY;
    return { y: safeY, p };
  });
}

export function buildAnchors(b: ChapterBoxes): Anchor[] {
  const [ringStart, ringEnd] = stickyRange(b.ringTop, b.ringHeight, b.ringStage, b.viewport);
  const [statsStart, statsEnd] = stickyRange(b.statsTop, b.statsHeight, b.statsStage, b.viewport);
  const ctaEnd = Math.min(b.maxScroll, b.ctaTop + Math.max(0, b.ctaHeight - b.viewport));
  return monotonic([
    { y: 0, p: 0 },
    { y: b.heroBottom, p: CHAPTER_P.heroEnd },
    { y: ringStart, p: CHAPTER_P.ringStart },
    { y: ringEnd, p: CHAPTER_P.ringEnd },
    // ringEnd → statsStart is the section boundary: the gap 0.556 → 0.59 is interpolated across it
    { y: statsStart, p: CHAPTER_P.statsStart },
    { y: statsEnd, p: CHAPTER_P.statsEnd },
    { y: b.ctaTop - b.viewport, p: CHAPTER_P.ctaStart },
    { y: ctaEnd, p: CHAPTER_P.end },
  ]);
}

/** Piecewise-linear p at `scrollY`, clamped to the first/last anchor. Zero-length segments jump. */
export function progressAt(scrollY: number, anchors: readonly Anchor[]): number {
  if (anchors.length === 0) return 0;
  if (scrollY <= anchors[0].y) return anchors[0].p;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (scrollY < b.y) return a.p + ((scrollY - a.y) / (b.y - a.y)) * (b.p - a.p);
  }
  return anchors[anchors.length - 1].p;
}

/** Inverse of progressAt: the first scroll position that reaches `p` (used by the dev e2e scripts). */
export function scrollForProgress(p: number, anchors: readonly Anchor[]): number {
  if (anchors.length === 0) return 0;
  if (p <= anchors[0].p) return anchors[0].y;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (p <= b.p && b.p > a.p) return a.y + ((p - a.p) / (b.p - a.p)) * (b.y - a.y);
  }
  return anchors[anchors.length - 1].y;
}
