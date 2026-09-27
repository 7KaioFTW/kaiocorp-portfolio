/**
 * Run `cb` once the page has fully loaded and the main thread is idle, so motion code never
 * competes with LCP / hydration. Returns a cancel function.
 */
export function afterLoadIdle(cb: () => void, timeout = 1500): () => void {
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  const schedule = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => cb(), { timeout });
    } else {
      timerId = window.setTimeout(cb, 200);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}
