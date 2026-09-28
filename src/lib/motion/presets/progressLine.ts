import { gsap } from "gsap";
import type { PresetRun } from "../types";

// Scrubbed scaleX line across a [data-steps] block; [data-step] children light up in order.
export const progressLine: PresetRun = (els) => {
  for (const line of els) {
    const scope = line.closest<HTMLElement>("[data-steps]");
    if (!scope) continue;
    const steps = Array.from(scope.querySelectorAll<HTMLElement>("[data-step]"));
    gsap.fromTo(
      line,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: scope,
          start: "top 75%",
          end: "bottom 60%",
          scrub: true,
          onUpdate: ({ progress }) => {
            steps.forEach((step, i) => step.classList.toggle("is-active", progress >= (i + 0.5) / steps.length));
          },
        },
      },
    );
  }
};
