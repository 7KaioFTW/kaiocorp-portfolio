import type Lenis from "lenis";

export type Cleanup = () => void;

export interface PresetEnv {
  /** false on first load (only below-the-fold elements animate), true after navigation/rescan. */
  animateInView: boolean;
  lenis: Lenis;
}

/** A preset receives the not-yet-processed elements matching its selector. */
export type PresetRun = (els: HTMLElement[], env: PresetEnv) => Cleanup | void;
