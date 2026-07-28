/**
 * Passive event listener helpers — avoid scroll/touch jank from preventDefault waits.
 */

export type PassiveListenerOptions = boolean | AddEventListenerOptions;

export const PASSIVE_TRUE: AddEventListenerOptions = { passive: true };
export const PASSIVE_ONCE: AddEventListenerOptions = { passive: true, once: true };

/** Add listener with passive:true by default (safe for scroll/touch/wheel observation). */
export function addPassiveListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement,
  type: K,
  listener: (ev: WindowEventMap[K]) => void,
  opts?: AddEventListenerOptions,
): () => void {
  const options: AddEventListenerOptions = { passive: true, ...opts };
  target.addEventListener(type, listener as EventListener, options);
  return () => target.removeEventListener(type, listener as EventListener, options);
}

/**
 * rAF-coalesced scroll/touch handler — at most one update per frame.
 * Returns cleanup that removes the listener and cancels pending frames.
 */
export function bindRafListener(
  target: Window | Document | HTMLElement,
  type: "scroll" | "touchmove" | "resize" | "wheel",
  handler: () => void,
  opts?: { capture?: boolean },
): () => void {
  let ticking = false;
  let raf = 0;
  const onEvent = () => {
    if (ticking) return;
    ticking = true;
    raf = requestAnimationFrame(() => {
      ticking = false;
      raf = 0;
      try {
        handler();
      } catch {
        /* never throw into scroll path */
      }
    });
  };
  const options: AddEventListenerOptions = { passive: true, capture: opts?.capture };
  target.addEventListener(type, onEvent, options);
  return () => {
    target.removeEventListener(type, onEvent, options);
    if (raf) cancelAnimationFrame(raf);
  };
}
