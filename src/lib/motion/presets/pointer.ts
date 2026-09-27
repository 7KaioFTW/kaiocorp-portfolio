import { gsap } from "gsap";
import { tiltAngles } from "../geometry";
import type { Cleanup, PresetRun } from "../types";

const finePointer = () => window.matchMedia("(pointer: fine)").matches;

// Shared pointer tracking: exposes --mx/--my (for the CSS glare/border) and normalised coords.
function trackPointer(el: HTMLElement, onMove: (px: number, py: number) => void, onLeave: () => void): Cleanup {
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    onMove(px, py);
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerleave", onLeave);
  return () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerleave", onLeave);
  };
}

/** Button pulled toward the pointer (strength 0.3), springs back on leave. */
export const magnetic: PresetRun = (els) => {
  if (!finePointer()) return;
  const cleanups = els.map((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
    return trackPointer(
      el,
      (px, py) => {
        const r = el.getBoundingClientRect();
        x((px - 0.5) * r.width * 0.3);
        y((py - 0.5) * r.height * 0.3);
      },
      () => {
        x(0);
        y(0);
      },
    );
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};

/** 3D tilt (max 8°) + glare + neon border (CSS .motion-tilt). */
export const tilt: PresetRun = (els) => {
  if (!finePointer()) return;
  const cleanups = els.map((el) => {
    el.classList.add("motion-tilt");
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3.out" });
    const off = trackPointer(
      el,
      (px, py) => {
        const a = tiltAngles(px, py);
        rx(a.rotationX);
        ry(a.rotationY);
      },
      () => {
        rx(0);
        ry(0);
      },
    );
    return () => {
      off();
      el.classList.remove("motion-tilt");
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};

/** Pointer spotlight only (wide rows where tilt would look wrong). */
export const glow: PresetRun = (els) => {
  if (!finePointer()) return;
  const cleanups = els.map((el) => {
    el.classList.add("motion-glow");
    const off = trackPointer(el, () => undefined, () => undefined);
    return () => {
      off();
      el.classList.remove("motion-glow");
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
};
