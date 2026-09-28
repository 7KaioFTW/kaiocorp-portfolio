// Page-enter transition (CSS only, no GSAP): a gradient curtain wipes off while the new page rises.
// Triggered by MotionProvider on every client navigation — a [locale]/template.tsx would not
// remount between sibling routes (/maps → /maps/[id], /blog → /blog/[slug]).
export function playPageTransition(): void {
  const curtain = document.createElement("div");
  curtain.className = "motion-curtain";
  curtain.setAttribute("aria-hidden", "true");
  curtain.addEventListener("animationend", () => curtain.remove(), { once: true });
  document.body.append(curtain);

  const main = document.getElementById("main-content");
  if (!main) return;
  main.classList.remove("motion-page-enter");
  void main.offsetWidth; // restart the CSS animation if a navigation interrupts the previous one
  main.classList.add("motion-page-enter");
  const done = (e: AnimationEvent) => {
    if (e.target !== main) return;
    main.classList.remove("motion-page-enter");
    main.removeEventListener("animationend", done);
    window.dispatchEvent(new Event("motion:refresh")); // re-measure once the page stops moving
  };
  main.addEventListener("animationend", done);
}
