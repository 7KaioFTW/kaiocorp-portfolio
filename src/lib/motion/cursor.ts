import { gsap } from "gsap";
import type { Cleanup } from "./types";

const LINKS = "a, button, [role='button'], input, textarea, select, label";

/** Dot + trailing ring. Mouse only; the native cursor stays visible (decorative, aria-hidden). */
export function initCursor(): Cleanup {
  if (!window.matchMedia("(pointer: fine)").matches) return () => undefined;
  const dot = document.createElement("div");
  dot.className = "motion-cursor motion-cursor-dot is-hidden";
  const ring = document.createElement("div");
  ring.className = "motion-cursor motion-cursor-ring is-hidden";
  const arrow = document.createElement("span");
  arrow.textContent = "↗";
  ring.append(arrow);
  dot.setAttribute("aria-hidden", "true");
  ring.setAttribute("aria-hidden", "true");
  document.body.append(dot, ring);

  const dx = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });

  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    dot.classList.remove("is-hidden");
    ring.classList.remove("is-hidden");
    dx(e.clientX);
    dy(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
  };
  const over = (e: PointerEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const view = Boolean(target?.closest("[data-cursor='view']"));
    ring.classList.toggle("is-view", view);
    ring.classList.toggle("is-link", !view && Boolean(target?.closest(LINKS)));
  };
  const hide = () => {
    dot.classList.add("is-hidden");
    ring.classList.add("is-hidden");
  };
  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", over);
  document.documentElement.addEventListener("pointerleave", hide);

  return () => {
    window.removeEventListener("pointermove", move);
    document.removeEventListener("pointerover", over);
    document.documentElement.removeEventListener("pointerleave", hide);
    dot.remove();
    ring.remove();
  };
}
