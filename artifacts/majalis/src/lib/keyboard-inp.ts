/**
 * Part 23 — Critical Web Vitals INP keyboard input pipeline safety.
 * preventDefault synchronously (browser requirement), defer heavy state
 * work via scheduler.yield / queueMicrotask so key response stays <30ms.
 * Logic-only — no UI.
 */

import { yieldToMain } from "@/lib/yield-to-main";

export type KeyboardInpHandler = (event: KeyboardEvent) => void | Promise<void>;

export type KeyboardInpOptions = {
  /** Keys that should call preventDefault when matched (e.g. ArrowLeft, " "). */
  preventKeys?: string[];
  /** Ignore when focus is in editable fields (default true). */
  ignoreEditable?: boolean;
  /** Optional gate — return false to skip. */
  when?: (event: KeyboardEvent) => boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Wrap a key handler: sync preventDefault for listed keys, then defer work.
 * Target: Interaction to Next Paint sync budget &lt; 16ms (tests assert &lt;30ms ceiling).
 */
export function createKeyboardInpHandler(
  handler: KeyboardInpHandler,
  opts?: KeyboardInpOptions,
): (event: KeyboardEvent) => void {
  const preventKeys = new Set(opts?.preventKeys ?? []);
  const ignoreEditable = opts?.ignoreEditable !== false;

  return (event: KeyboardEvent) => {
    if (ignoreEditable && isEditableTarget(event.target)) return;
    if (opts?.when && !opts.when(event)) return;

    const key = event.key;
    const shouldPrevent =
      preventKeys.has(key) ||
      (key === " " && preventKeys.has("Space")) ||
      (key === "Spacebar" && preventKeys.has(" "));

    if (shouldPrevent) {
      // Must be synchronous for INP + scroll suppression
      event.preventDefault();
    }

    // Defer state updates off the input handler critical path
    const run = () => {
      void Promise.resolve(handler(event)).catch(() => undefined);
    };

    const sched = (globalThis as { scheduler?: { postTask?: (fn: () => void, o?: { priority?: string }) => void } })
      .scheduler;
    if (sched?.postTask) {
      sched.postTask(run, { priority: "user-blocking" });
    } else {
      queueMicrotask(() => {
        void yieldToMain().then(run);
      });
    }
  };
}

/**
 * Bind window keydown with INP-safe wrapper. Returns unsubscribe.
 */
export function bindKeyboardInp(
  handler: KeyboardInpHandler,
  opts?: KeyboardInpOptions & { event?: "keydown" | "keyup" },
): () => void {
  if (typeof window === "undefined") return () => undefined;
  const wrapped = createKeyboardInpHandler(handler, opts);
  const type = opts?.event ?? "keydown";
  window.addEventListener(type, wrapped);
  return () => window.removeEventListener(type, wrapped);
}

/** Measure sync handler budget — returns elapsed ms (tests / diagnostics). */
export function measureSyncKeyBudget(fn: () => void): number {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  fn();
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return t1 - t0;
}
