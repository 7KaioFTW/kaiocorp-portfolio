"use client";

import { useEffect, useRef } from "react";
import { afterLoadIdle } from "@/lib/motion/idle";

// Decorative WebGL background. Loaded after `load` + idle; fades in on its first frame.
// The hero's CSS gradients stay underneath as the fallback (no WebGL / reduced motion).
export function HeroShader() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    const cancelIdle = afterLoadIdle(async () => {
      const { startShader } = await import("@/lib/motion/shader");
      if (!cancelled) stop = startShader(canvas);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      stop?.();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="motion-shader absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-1000"
    />
  );
}
