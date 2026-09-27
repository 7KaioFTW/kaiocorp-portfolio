import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { shouldAnimate } from "../geometry";
import type { PresetRun } from "../types";

// Fade + rise. Batched so items entering together (grids) cascade automatically.
// Opacity only (not visibility) so hidden items stay focusable — focusing scrolls them in.
export const reveal: PresetRun = (els, { animateInView }) => {
  const vh = window.innerHeight;
  const targets = els.filter((el) => shouldAnimate(el.getBoundingClientRect(), vh, animateInView));
  if (targets.length === 0) return;
  gsap.set(targets, { opacity: 0, y: 32 });
  ScrollTrigger.batch(targets, {
    start: "top 90%",
    once: true,
    onEnter: (batch) => {
      // An instant jump (End key, scrollbar drag, restored position) crosses many triggers at once:
      // items already scrolled past appear instantly, only the visible ones get the staggered entrance
      // (otherwise the last on-screen items would wait ~0.08 s × every item above them).
      const passed = batch.filter((el) => el.getBoundingClientRect().bottom <= 0);
      const visible = batch.filter((el) => el.getBoundingClientRect().bottom > 0);
      if (passed.length) gsap.set(passed, { opacity: 1, y: 0, overwrite: true });
      if (visible.length)
        gsap.to(visible, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.08, overwrite: true });
    },
  });
  // Keyboard: browsers that scroll a focused element only to the viewport edge (Firefox) can leave
  // it below the trigger line — reveal on focus so the focused item is never invisible.
  const offs = targets.map((el) => {
    const onFocus = () => gsap.to(el, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", overwrite: true });
    el.addEventListener("focusin", onFocus, { once: true });
    return () => el.removeEventListener("focusin", onFocus);
  });
  return () => offs.forEach((off) => off());
};
