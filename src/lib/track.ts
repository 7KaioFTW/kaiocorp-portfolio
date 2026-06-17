// Lightweight conversion tracking. Pushes to GA4 (gtag) and/or a dataLayer
// if present; no-op otherwise. Configure your analytics in the layout <head>.

type TrackParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, params: TrackParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
    window.dataLayer?.push({ event, ...params });
  } catch {
    /* analytics not loaded — ignore */
  }
}
