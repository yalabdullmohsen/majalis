/**
 * Safe global event listeners — passive by default, tracked for teardown.
 * Prevents subtle leaks from orphaned window/document listeners.
 */

type ListenerTarget = Window | Document | HTMLElement;

type Entry = {
  target: ListenerTarget;
  type: string;
  handler: EventListenerOrEventListenerObject;
  options: AddEventListenerOptions | boolean;
};

const registry = new Set<Entry>();

function normalizeOptions(
  options?: boolean | AddEventListenerOptions,
  defaults?: { passive?: boolean },
): AddEventListenerOptions {
  if (typeof options === "boolean") {
    return { capture: options, passive: defaults?.passive ?? true };
  }
  return {
    passive: defaults?.passive ?? true,
    ...(options || {}),
  };
}

/**
 * Add a window listener (passive by default for scroll/touch/wheel).
 * Returns disposer that removes exactly this binding.
 */
export function addSafeWindowListener(
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const passiveDefault = /^(scroll|touchstart|touchmove|wheel|mousewheel)$/.test(type);
  const opts = normalizeOptions(options, { passive: passiveDefault });
  // keydown/online/offline/resize: passive true is fine (we don't preventDefault in wrappers)
  if (!("passive" in (opts as object))) opts.passive = true;
  window.addEventListener(type, handler, opts);
  const entry: Entry = { target: window, type, handler, options: opts };
  registry.add(entry);
  return () => {
    window.removeEventListener(type, handler, opts);
    registry.delete(entry);
  };
}

export function addSafeDocumentListener(
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): () => void {
  if (typeof document === "undefined") return () => undefined;
  const passiveDefault = /^(scroll|touchstart|touchmove|wheel|visibilitychange)$/.test(type);
  const opts = normalizeOptions(options, { passive: passiveDefault });
  document.addEventListener(type, handler, opts);
  const entry: Entry = { target: document, type, handler, options: opts };
  registry.add(entry);
  return () => {
    document.removeEventListener(type, handler, opts);
    registry.delete(entry);
  };
}

/** Tear down all listeners registered via this module (tests / emergency). */
export function removeAllSafeListeners(): void {
  for (const entry of [...registry]) {
    try {
      entry.target.removeEventListener(entry.type, entry.handler, entry.options);
    } catch {
      /* ignore */
    }
    registry.delete(entry);
  }
}

export function getSafeListenerCount(): number {
  return registry.size;
}

/**
 * React-friendly: bind on mount, unbind on unmount.
 * Call from useEffect body: `return bindSafeWindowEffect("resize", fn)`.
 */
export function bindSafeWindowEffect(
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): () => void {
  return addSafeWindowListener(type, handler, options);
}
