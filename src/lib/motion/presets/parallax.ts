import { gsap } from "gsap";
import type { PresetRun } from "../types";

// Scrubbed drift. data-speed = fraction of the element's own size travelled across its trigger
// (default 0.2); data-axis="x" drifts horizontally. Trigger = enclosing <section>, else parent.
export const parallax: PresetRun = (els) => {
  const vh = window.innerHeight;
  for (const el of els) {
    const speed = Number(el.dataset.speed ?? "0.2");
    const prop = el.dataset.axis === "x" ? "xPercent" : "yPercent";
    const trigger = el.closest("section") ?? el.parentElement ?? el;
    // Triggers inside the first screen start at scroll 0 so nothing jumps when the engine arrives.
    const nearTop = trigger.getBoundingClientRect().top + window.scrollY < vh;
    let settled = false;
    gsap.to(el, {
      [prop]: speed * 100,
      ease: "none",
      scrollTrigger: {
        trigger,
        start: nearTop ? 0 : "top bottom",
        end: "bottom top",
        scrub: 0.6,
        // The engine can arrive mid-range (reload / restored scroll): GSAP would apply that progress
        // in one frame — glide into place instead of snapping.
        onRefresh: (self) => {
          if (settled) return;
          settled = true;
          const anim = self.animation;
          if (!anim || self.progress < 0.001) return;
          const to = self.progress;
          anim.progress(0);
          gsap.to(anim, { progress: to, duration: 0.8, ease: "power2.out" });
        },
      },
    });
  }
};
