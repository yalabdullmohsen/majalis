/**
 * Part 23 — Service Worker lifecycle transition guard.
 * skipWaiting / clients.claim with zero client-side state loss:
 * flush reading progress + audio resume before any controller handover,
 * prefer soft claim over hard reload when possible. Logic-only — no UI.
 */

import { flushUnloadPersist } from "@/lib/unload-persist";

export type SwTransitionPhase =
  | "idle"
  | "flushing"
  | "skip-waiting"
  | "claiming"
  | "soft-ready"
  | "reloading";

type PhaseListener = (phase: SwTransitionPhase) => void;

let phase: SwTransitionPhase = "idle";
const listeners = new Set<PhaseListener>();
let installed = false;

function setPhase(next: SwTransitionPhase): void {
  phase = next;
  for (const fn of listeners) {
    try {
      fn(next);
    } catch {
      /* ignore */
    }
  }
}

export function getSwTransitionPhase(): SwTransitionPhase {
  return phase;
}

export function subscribeSwTransition(fn: PhaseListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Persist critical progress before SW controller swap / reload. */
export function flushClientStateForSwUpdate(): void {
  setPhase("flushing");
  try {
    flushUnloadPersist();
  } catch {
    /* ignore */
  }
  try {
    // Warm audio resume + khatmah mirrors if modules present
    void import("@/lib/quran-audio-resume").then((m) => {
      try {
        m.loadAudioResumeState?.();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
}

/**
 * Ask waiting SW to skipWaiting; waiting worker should already call skipWaiting
 * on install — this re-asserts via postMessage for older SWs.
 */
export async function activateWaitingServiceWorker(): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg?.waiting) return false;
    setPhase("skip-waiting");
    flushClientStateForSwUpdate();
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    reg.waiting.postMessage({ type: "MAJALIS_SKIP_WAITING" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Soft transition: flush state, optionally reload only when a controller
 * already existed (first install must not bounce the tab).
 */
export function handleControllerChangeSeamless(opts?: {
  hadController: boolean;
  forceReload?: boolean;
  reload?: () => void;
}): void {
  const hadController = opts?.hadController ?? true;
  if (!hadController) {
    setPhase("soft-ready");
    return;
  }
  flushClientStateForSwUpdate();
  setPhase("claiming");
  if (opts?.forceReload === false) {
    // Soft path: keep SPA alive — assets already claimed for next navigations
    setPhase("soft-ready");
    return;
  }
  setPhase("reloading");
  const reload =
    opts?.reload ??
    (() => {
      void import("@/lib/safe-reload").then((m) => m.safeLocationReload());
    });
  // Microtask — lets flush + React paint settle (INP-safe)
  queueMicrotask(() => reload());
}

/**
 * Install production SW lifecycle listeners once.
 * Replaces hard immediate reload with flush-first seamless handover.
 */
export function installSwLifecycleGuard(opts?: {
  /** When false, skip hard reload after claim (default true for prod parity). */
  reloadOnControllerChange?: boolean;
}): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (installed) return;
  installed = true;

  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    handleControllerChangeSeamless({
      hadController: true,
      forceReload: opts?.reloadOnControllerChange !== false,
    });
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string } | null;
    if (!data?.type) return;
    if (data.type === "MAJALIS_SW_ACTIVATED" || data.type === "SW_ACTIVATED") {
      flushClientStateForSwUpdate();
      setPhase("soft-ready");
    }
  });
}

export function resetSwLifecycleForTests(): void {
  phase = "idle";
  listeners.clear();
  installed = false;
}
