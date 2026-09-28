import { gsap } from "gsap";
import { marqueeRate } from "../velocity";
import type { Cleanup, PresetRun } from "../types";

// The loop is a CSS animation (.motion-marquee-track); the engine only bends its speed and
// direction with the scroll velocity (easing toward the target so reversals glide through 0).
// Off-screen it is paused and the per-frame update is skipped.
export const marquee: PresetRun = (els, { lenis }) => {
  const cleanups: Cleanup[] = els.map((el) => {
    const anims = el.querySelector(".motion-marquee-track")?.getAnimations() ?? [];
    if (anims.length === 0) return () => undefined;
    let visible = false;
    let direction: 1 | -1 = 1;
    let current = 1;
    const update = () => {
      if (!visible) return;
      const next = marqueeRate(lenis.velocity, direction);
      direction = next.direction;
      const eased = current + (next.rate - current) * 0.1;
      if (Math.abs(eased - current) < 0.001) return;
      current = eased;
      anims.forEach((anim) => {
        anim.playbackRate = current;
      });
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      anims.forEach((anim) => (visible ? anim.play() : anim.pause()));
    });
    io.observe(el);
    gsap.ticker.add(update);
    return () => {
      io.disconnect();
      gsap.ticker.remove(update);
      anims.forEach((anim) => {
        anim.playbackRate = 1;
        anim.play();
      });
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};
