import type { PresetRun } from "../types";
import { decode } from "./decode";
import { marquee } from "./marquee";
import { parallax } from "./parallax";
import { glow, magnetic, tilt } from "./pointer";
import { progressLine } from "./progressLine";
import { reveal } from "./reveal";
import { split } from "./split";
import { sweep } from "./sweep";

// Order matters: presets that change layout (split) run before the ones that measure.
export const PRESETS: ReadonlyArray<readonly [selector: string, run: PresetRun]> = [
  ['[data-motion="split"]', split],
  ['[data-motion="reveal"]', reveal],
  ['[data-motion="decode"]', decode],
  ['[data-motion="parallax"]', parallax],
  ['[data-motion="marquee"]', marquee],
  ['[data-motion="progress-line"]', progressLine],
  ['[data-motion="sweep"]', sweep],
  ["[data-magnetic]", magnetic],
  ["[data-tilt]", tilt],
  ["[data-glow]", glow],
];
