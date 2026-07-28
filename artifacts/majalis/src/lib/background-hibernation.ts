/**
 * Background work hibernation — pause non-critical tasks while tab is hidden.
 * Complements power-saver + memory-pressure. Logic-only.
 */

import { addSafeDocumentListener } from "@/lib/safe-listeners";
import { runWhenIdle } from "@/lib/idle-defer";

export type HibernationState = {
  hidden: boolean;
  hibernating: boolean;
  since: number;
};

type Listener = (s: HibernationState) => void;

let state: HibernationState = {
  hidden: typeof document !== "undefined" ? document.visibilityState === "hidden" : false,
  hibernating: false,
  since: Date.now(),
};

const listeners = new Set<Listener>();
let bound = false;
const pausedControllers = new Set<AbortController>();

function emit(): void {
  for (const l of listeners) {
    try {
      l(state);
    } catch {
      /* ignore */
    }
  }
}

function setHidden(hidden: boolean): void {
  if (state.hidden === hidden) return;
  state = {
    hidden,
    hibernating: hidden,
    since: Date.now(),
  };
  emit();
  if (hidden) {
    for (const c of pausedControllers) {
      try {
        c.abort();
      } catch {
        /* ignore */
      }
    }
    pausedControllers.clear();
  }
}

export function ensureHibernationBinding(): void {
  if (bound || typeof document === "undefined") return;
  bound = true;
  addSafeDocumentListener("visibilitychange", () => {
    setHidden(document.visibilityState === "hidden");
  });
  setHidden(document.visibilityState === "hidden");
}

export function getHibernationState(): HibernationState {
  return state;
}

export function subscribeHibernation(listener: Listener): () => void {
  ensureHibernationBinding();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isTabHibernating(): boolean {
  return state.hibernating;
}

/**
 * Register an AbortController that should cancel when tab hibernates.
 * Returns the same controller; caller aborts on unmount too.
 */
export function trackPrefetchAbort(controller: AbortController): AbortController {
  ensureHibernationBinding();
  if (state.hibernating) {
    controller.abort();
    return controller;
  }
  pausedControllers.add(controller);
  const orig = controller.signal;
  const onAbort = () => {
    pausedControllers.delete(controller);
    orig.removeEventListener("abort", onAbort);
  };
  orig.addEventListener("abort", onAbort);
  return controller;
}

/**
 * Run task only when visible; if hidden, wait until resume (idle).
 */
export function runWhenVisibleIdle(
  task: () => void,
  opts?: { timeoutMs?: number },
): { cancel: () => void } {
  ensureHibernationBinding();
  let cancelled = false;
  let handle: { cancel: () => void } | null = null;
  let unsub: (() => void) | null = null;

  const trySchedule = () => {
    if (cancelled) return;
    if (isTabHibernating()) return;
    handle = runWhenIdle(
      () => {
        if (cancelled || isTabHibernating()) return;
        task();
      },
      { timeoutMs: opts?.timeoutMs ?? 3_000, requireVisible: true },
    );
  };

  unsub = subscribeHibernation((s) => {
    if (!s.hibernating) trySchedule();
  });
  trySchedule();

  return {
    cancel: () => {
      cancelled = true;
      handle?.cancel();
      unsub?.();
    },
  };
}
