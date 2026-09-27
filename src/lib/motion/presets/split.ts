import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { shouldAnimate } from "../geometry";
import type { PresetRun } from "../types";

// Masked word reveal for SOLID-colour headings only (bg-clip-text gradients break when split).
// SplitText keeps the heading accessible (aria-label on the parent, aria-hidden pieces).
export const split: PresetRun = (els, { animateInView }) => {
  const vh = window.innerHeight;
  for (const el of els) {
    if (!shouldAnimate(el.getBoundingClientRect(), vh, animateInView)) continue;
    let played = false;
    SplitText.create(el, {
      type: "lines,words",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) => {
        if (played) return undefined; // re-split after a resize: words stay in place
        return gsap.from(self.words, {
          yPercent: 110,
          duration: 1,
          ease: "expo.out",
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onComplete: () => {
            played = true;
          },
        });
      },
    });
  }
};
