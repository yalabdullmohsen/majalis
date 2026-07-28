/**
 * Tab hibernation / un-hibernation resiliency (iOS Safari & Android Chrome).
 * Detects freeze/pageshow/visibility wake and restores reading + audio snapshots.
 * Logic-only — no UI.
 */

import { flushUnloadPersist } from "@/lib/unload-persist";
import { loadAudioResumeState } from "@/lib/quran-audio-resume";
import { getAllReadingProgress } from "@/lib/reading-progress";
import { scheduleIdle } from "@/lib/feature-detect";

export type HibernateSnapshot = {
  audio: ReturnType<typeof loadAudioResumeState>;
  reading: ReturnType<typeof getAllReadingProgress>;
  scrollY: number;
  path: string;
  capturedAt: number;
};

export type HibernateRestoreHandler = (snap: HibernateSnapshot) => void;

const restoreHandlers = new Set<HibernateRestoreHandler>();
let lastSnap: HibernateSnapshot | null = null;
let bound = false;
let hibernated = false;

function capture(): HibernateSnapshot {
  const snap: HibernateSnapshot = {
    audio: loadAudioResumeState(),
    reading: getAllReadingProgress(),
    scrollY: typeof window !== "undefined" ? window.scrollY || 0 : 0,
    path: typeof location !== "undefined" ? location.pathname + location.search : "",
    capturedAt: Date.now(),
  };
  lastSnap = snap;
  return snap;
}

function restoreQuietly(): void {
  const snap = lastSnap ?? capture();
  for (const h of restoreHandlers) {
    try {
      h(snap);
    } catch {
      /* ignore */
    }
  }
  // Restore scroll only if same path and offset is meaningful
  if (typeof window === "undefined") return;
  const path = location.pathname + location.search;
  if (snap.path === path && snap.scrollY > 40) {
    const y = snap.scrollY;
    scheduleIdle(() => {
      try {
        window.scrollTo(0, y);
      } catch {
        /* ignore */
      }
    }, 500);
  }
}

function onHidden(): void {
  hibernated = true;
  capture();
  flushUnloadPersist();
}

function onVisible(): void {
  if (!hibernated) return;
  hibernated = false;
  // Defer restore past paint so OS wake settle doesn't thrash layout
  scheduleIdle(() => restoreQuietly(), 800);
}

/**
 * Register a quiet restore hook (audio seek, etc.). Idempotent subscribe.
 */
export function onHibernateRestore(handler: HibernateRestoreHandler): () => void {
  restoreHandlers.add(handler);
  ensureHibernateBinding();
  return () => {
    restoreHandlers.delete(handler);
  };
}

export function getLastHibernateSnapshot(): HibernateSnapshot | null {
  return lastSnap;
}

export function isTabHibernated(): boolean {
  return hibernated;
}

export function ensureHibernateBinding(): void {
  if (bound || typeof window === "undefined") return;
  bound = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") onHidden();
    else onVisible();
  });

  // Page Lifecycle API — freeze ≈ OS hibernation; resume ≈ wake
  const onFreeze = () => {
    hibernated = true;
    capture();
    flushUnloadPersist();
  };
  const onResume = () => {
    hibernated = false;
    scheduleIdle(() => restoreQuietly(), 400);
  };
  document.addEventListener("freeze", onFreeze);
  document.addEventListener("resume", onResume);

  // iOS Safari often uses pageshow with persisted=true after bfcache/hibernate
  window.addEventListener("pageshow", (ev) => {
    const pe = ev as PageTransitionEvent;
    if (pe.persisted || hibernated) {
      hibernated = false;
      scheduleIdle(() => restoreQuietly(), 400);
    }
  });

  window.addEventListener("pagehide", () => {
    onHidden();
  });
}

/** Force capture (tests / manual). */
export function captureHibernateSnapshot(): HibernateSnapshot {
  return capture();
}

export function resetHibernateForTests(): void {
  restoreHandlers.clear();
  lastSnap = null;
  hibernated = false;
  bound = false;
}
