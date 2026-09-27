"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { afterLoadIdle } from "@/lib/motion/idle";
import { playPageTransition } from "@/lib/motion/transition";
import type { MotionEngine } from "@/lib/motion/engine";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Loads the motion engine after `load` + idle (never on the critical path), resets it and plays
// the page transition on every client navigation. Also renders the progress bar the engine drives.
export function MotionProvider() {
  const pathname = usePathname();
  const engine = useRef<MotionEngine | null>(null);
  const firstPath = useRef(true);
  const shownPath = useRef(pathname);

  // Before paint, so the new page is never visible uncovered. Comparing paths (not a "first run"
  // flag) keeps StrictMode's double effect from playing it on the initial load.
  useIsoLayoutEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) playPageTransition();
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.dataset.motion = "reduced";
      return;
    }
    let cancelled = false;
    const cancelIdle = afterLoadIdle(async () => {
      const { initMotion } = await import("@/lib/motion/engine");
      if (cancelled) return;
      engine.current = initMotion();
      await engine.current.scan({ animateInView: false });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    const current = engine.current;
    if (!current) return;
    current.resetPage();
    const id = requestAnimationFrame(() => void current.scan({ animateInView: true }));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <div
      data-motion-progress
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent"
    />
  );
}
