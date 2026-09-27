import { gsap } from "gsap";
import type Lenis from "lenis";
import type { Cleanup } from "./types";

/** Drives the fixed top bar rendered by MotionProvider ([data-motion-progress]). */
export function initProgressBar(lenis: Lenis): Cleanup {
  const bar = document.querySelector<HTMLElement>("[data-motion-progress]");
  if (!bar) return () => undefined;
  const setScale = gsap.quickSetter(bar, "scaleX");
  const update = (l: Lenis) => setScale(Number.isFinite(l.progress) ? l.progress : 0);
  const off = lenis.on("scroll", update);
  update(lenis);
  return () => {
    off();
    gsap.set(bar, { clearProps: "transform" });
  };
}
