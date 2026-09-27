import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PresetRun } from "../types";

// One-shot neon sweep (CSS `.is-on` animation) the first time the element enters the viewport.
export const sweep: PresetRun = (els) => {
  for (const el of els) {
    ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => el.classList.add("is-on") });
  }
};
