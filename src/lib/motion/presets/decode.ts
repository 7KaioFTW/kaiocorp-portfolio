import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrambleFrame } from "../scramble";
import type { PresetRun } from "../types";

// HUD scramble on short single-line text. The DOM is only swapped while the scramble runs: an
// sr-only copy keeps the final text for screen readers, the animated layer is aria-hidden and
// width-locked. On completion the element is a single plain text node again (clean copy/find).
export const decode: PresetRun = (els) => {
  const vh = window.innerHeight;
  for (const el of els) {
    if (el.hasAttribute("data-decoded")) continue;
    const final = el.textContent ?? "";
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue; // not rendered at this breakpoint
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || rect.height;
    if (final.trim() === "" || rect.height > lineHeight * 1.5) continue; // multi-line: skip
    el.setAttribute("data-decoded", "");

    const play = () => {
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = final;
      const layer = document.createElement("span");
      layer.className = "motion-decode";
      layer.setAttribute("aria-hidden", "true");
      layer.textContent = final;
      el.replaceChildren(sr, layer);
      // Lock the text's own width while scrambling (glyph widths vary) so nothing reflows.
      layer.style.width = `${layer.getBoundingClientRect().width}px`;
      const state = { p: 0 };
      gsap.to(state, {
        p: 1,
        duration: 1.1,
        ease: "power2.out",
        onUpdate: () => {
          layer.textContent = scrambleFrame(final, state.p);
        },
        onComplete: () => {
          el.textContent = final;
        },
      });
    };

    if (rect.bottom <= 0) continue; // above the viewport: stays as is
    if (rect.top < vh) play(); // visible now: "boot" effect
    else ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: play });
  }
};
