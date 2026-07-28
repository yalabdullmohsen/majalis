/**
 * Master polish — strict hook lifecycle cleanup registry.
 * Tracks timers, listeners, AbortControllers, object URLs, AudioContexts
 * for 100% teardown on unmount. Logic-only — no UI.
 */

export type LifecycleHandle = {
  addTimeout: (id: ReturnType<typeof setTimeout>) => void;
  addInterval: (id: ReturnType<typeof setInterval>) => void;
  addListener: (
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  addAbort: (c: AbortController) => void;
  addObjectUrl: (url: string) => void;
  addAudioContext: (ctx: AudioContext) => void;
  addDisposable: (fn: () => void) => void;
  dispose: () => void;
};

export function createLifecycleHandle(): LifecycleHandle {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const intervals = new Set<ReturnType<typeof setInterval>>();
  const listeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
  }> = [];
  const aborts: AbortController[] = [];
  const objectUrls: string[] = [];
  const audioCtxs: AudioContext[] = [];
  const disposables: Array<() => void> = [];
  let disposed = false;

  return {
    addTimeout(id) {
      if (!disposed) timeouts.add(id);
    },
    addInterval(id) {
      if (!disposed) intervals.add(id);
    },
    addListener(target, type, listener, options) {
      if (disposed) return;
      target.addEventListener(type, listener, options);
      listeners.push({ target, type, listener, options });
    },
    addAbort(c) {
      if (!disposed) aborts.push(c);
    },
    addObjectUrl(url) {
      if (!disposed) objectUrls.push(url);
    },
    addAudioContext(ctx) {
      if (!disposed) audioCtxs.push(ctx);
    },
    addDisposable(fn) {
      if (!disposed) disposables.push(fn);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const id of timeouts) clearTimeout(id);
      timeouts.clear();
      for (const id of intervals) clearInterval(id);
      intervals.clear();
      for (const l of listeners) {
        try {
          l.target.removeEventListener(l.type, l.listener, l.options);
        } catch {
          /* ignore */
        }
      }
      listeners.length = 0;
      for (const c of aborts) {
        try {
          c.abort();
        } catch {
          /* ignore */
        }
      }
      aborts.length = 0;
      for (const url of objectUrls) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      }
      objectUrls.length = 0;
      for (const ctx of audioCtxs) {
        try {
          void ctx.close();
        } catch {
          /* ignore */
        }
      }
      audioCtxs.length = 0;
      for (const fn of disposables) {
        try {
          fn();
        } catch {
          /* ignore */
        }
      }
      disposables.length = 0;
    },
  };
}
