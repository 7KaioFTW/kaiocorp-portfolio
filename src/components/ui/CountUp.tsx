"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/utils";

interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  trigger?: boolean;
  raw?: boolean;
}

export function CountUp({ end, duration = 2500, decimals = 1, suffix = "", trigger = true, raw = false }: CountUpProps) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !trigger || started.current) return;
    started.current = true;
    let t0: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue((1 - Math.pow(1 - p, 3)) * end);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mounted, trigger, end, duration]);

  const display = raw ? value.toFixed(decimals) : formatNumber(Math.round(value));
  return <span suppressHydrationWarning>{display}{suffix}</span>;
}
