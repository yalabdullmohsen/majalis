/**
 * Page Lifecycle API — freeze / resume / discarded handlers.
 * Persists pointer state to IndexedDB on freeze; restores audio + flush queues on resume.
 * Logic-only — no UI.
 */

import { flushUnloadPersist, persistLocalSync } from "@/lib/unload-persist";
import { flushAudioResumeState, loadAudioResumeState, stageAudioResumeState } from "@/lib/quran-audio-resume";

const IDB_NAME = "majalis-lifecycle-v1";
const IDB_STORE = "pointers";
const IDB_KEY = "freeze-snap";
const LS_FALLBACK = "majalis-lifecycle-freeze-v1";

export type LifecyclePointerSnap = {
  scrollY: number;
  path: string;
  audio: ReturnType<typeof loadAudioResumeState>;
  frozenAt: number;
  wasDiscarded?: boolean;
};

type ResumeHandler = (snap: LifecyclePointerSnap | null) => void;

const resumeHandlers = new Set<ResumeHandler>();
let bound = false;
let lastSnap: LifecyclePointerSnap | null = null;
let frozen = false;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(snap: LifecyclePointerSnap): Promise<void> {
  const db = await openDb();
  if (!db) {
    persistLocalSync(LS_FALLBACK, snap);
    return;
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(snap, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
  try {
    db.close();
  } catch {
    /* ignore */
  }
}

async function idbGet(): Promise<LifecyclePointerSnap | null> {
  const db = await openDb();
  if (!db) {
    try {
      const raw = localStorage.getItem(LS_FALLBACK);
      return raw ? (JSON.parse(raw) as LifecyclePointerSnap) : null;
    } catch {
      return null;
    }
  }
  const snap = await new Promise<LifecyclePointerSnap | null>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as LifecyclePointerSnap) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  try {
    db.close();
  } catch {
    /* ignore */
  }
  return snap;
}

function captureSnap(): LifecyclePointerSnap {
  const snap: LifecyclePointerSnap = {
    scrollY: typeof window !== "undefined" ? window.scrollY || 0 : 0,
    path: typeof location !== "undefined" ? location.pathname + location.search : "",
    audio: loadAudioResumeState(),
    frozenAt: Date.now(),
    wasDiscarded:
      typeof document !== "undefined" &&
      // @ts-expect-error Page Lifecycle discarded flag
      !!(document as Document & { wasDiscarded?: boolean }).wasDiscarded,
  };
  lastSnap = snap;
  return snap;
}

async function onFreeze(): Promise<void> {
  frozen = true;
  const snap = captureSnap();
  flushUnloadPersist();
  flushAudioResumeState();
  await idbPut(snap);
}

function onResume(): void {
  if (!frozen) {
    // @ts-expect-error wasDiscarded
    if (!(document as Document & { wasDiscarded?: boolean }).wasDiscarded) return;
  }
  frozen = false;
  void (async () => {
    const snap = (await idbGet()) ?? lastSnap;
    if (snap?.audio) {
      stageAudioResumeState(snap.audio);
    }
    for (const h of resumeHandlers) {
      try {
        h(snap);
      } catch {
        /* ignore */
      }
    }
    if (
      snap &&
      typeof window !== "undefined" &&
      snap.path === location.pathname + location.search &&
      snap.scrollY > 40
    ) {
      try {
        window.scrollTo(0, snap.scrollY);
      } catch {
        /* ignore */
      }
    }
  })();
}

export function onLifecycleResume(handler: ResumeHandler): () => void {
  resumeHandlers.add(handler);
  ensurePageLifecycleBinding();
  return () => {
    resumeHandlers.delete(handler);
  };
}

export function getLastLifecycleSnap(): LifecyclePointerSnap | null {
  return lastSnap;
}

export function ensurePageLifecycleBinding(): void {
  if (bound || typeof window === "undefined" || typeof document === "undefined") return;
  bound = true;

  document.addEventListener("freeze", () => {
    void onFreeze();
  });
  document.addEventListener("resume", () => {
    onResume();
  });

  // discarded: tab may be killed — persist aggressively on pagehide too
  window.addEventListener("pagehide", () => {
    void onFreeze();
  });

  // If tab was discarded previously, restore ASAP on boot
  // @ts-expect-error wasDiscarded
  if ((document as Document & { wasDiscarded?: boolean }).wasDiscarded) {
    onResume();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void onFreeze();
    else if (document.visibilityState === "visible") {
      // Soft resume path for browsers without Page Lifecycle
      onResume();
    }
  });
}

export function resetPageLifecycleForTests(): void {
  resumeHandlers.clear();
  lastSnap = null;
  bound = false;
  frozen = false;
}
