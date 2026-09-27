import { gsap } from "gsap";
import type { PresetRun } from "../types";

// Pinned horizontal gallery on desktop (≥ 1024 px). Below that the grid is untouched; without the
// engine the wrapper is a native horizontal scroller of the same height (no layout shift on upgrade).
export const gallery: PresetRun = (els, { lenis }) => {
  const mm = gsap.matchMedia();
  for (const el of els) {
    const track = el.querySelector<HTMLElement>("[data-gallery-track]");
    const section = el.closest("section");
    if (!track || !section) continue;
    mm.add("(min-width: 1024px)", () => {
      el.scrollLeft = 0;
      el.classList.add("is-pinned");
      const distance = () => Math.max(0, track.scrollWidth - el.clientWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          // Taller than the viewport (short laptops): pin by the bottom so the cards stay fully visible.
          start: () => (section.offsetHeight > window.innerHeight ? "bottom bottom" : "top top"),
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      track.querySelectorAll<HTMLElement>("[data-gallery-img]").forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -6 },
          {
            xPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          },
        );
      });
      // Keyboard: a focused card that is translated off-screen gets scrolled into view.
      const onFocus = (e: FocusEvent) => {
        const st = tween.scrollTrigger;
        const card = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>("[data-motion='reveal']") : null;
        if (!st || !card) return;
        const offset = card.getBoundingClientRect().left - track.getBoundingClientRect().left;
        const progress = Math.min(Math.max(offset / Math.max(distance(), 1), 0), 1);
        lenis.scrollTo(st.start + (st.end - st.start) * progress, { immediate: true });
      };
      track.addEventListener("focusin", onFocus);
      return () => {
        track.removeEventListener("focusin", onFocus);
        el.classList.remove("is-pinned");
      };
    });
  }
  return () => mm.revert();
};
