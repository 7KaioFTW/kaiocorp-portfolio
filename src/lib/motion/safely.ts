/** Runs `fn`; on error reports it and returns undefined — one failing preset can't stop the others. */
export function safely<T>(fn: () => T, onError: (e: unknown) => void = (e) => console.error("[motion]", e)): T | undefined {
  try {
    return fn();
  } catch (e) {
    onError(e);
    return undefined;
  }
}
