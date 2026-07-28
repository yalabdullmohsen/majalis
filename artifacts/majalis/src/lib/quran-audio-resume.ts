/**
 * Audio-to-Text Verse Sync & Auto-Resume — persistence + scroll helpers.
 * Stores exact audio timestamp + active verse for zero-latency resume.
 * Uses localStorage primary + IndexedDB mirror when available (offline-first).
 * Unload-safe: stages last known state and flushes on pagehide via unload-persist.
 */

import { savePosition, loadPosition } from "@/lib/quran-api";
import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";
import { registerUnloadPersist } from "@/lib/unload-persist";

export const AUDIO_RESUME_LS_KEY = "majalis-quran-audio-resume-v1";
const LS_KEY = AUDIO_RESUME_LS_KEY;
const IDB_NAME = "majalis-quran-audio-resume";
const IDB_STORE = "resume";
const IDB_KEY = "current";

export type QuranAudioResumeState = {
  surah: number;
  ayah: number;
  /** Seconds into the current ayah audio */
  currentTime: number;
  reciterId?: string;
  updatedAt: number;
};

/** In-memory pending snapshot — flushed sync on unload even if last write was truncated. */
let pendingResume: QuranAudioResumeState | null = null;
let unloadRegistered = false;

function isAudioResumeState(v: unknown): v is QuranAudioResumeState {
  if (!isPlainObject(v)) return false;
  const surah = Number(v.surah);
  const ayah = Number(v.ayah);
  return (
    Number.isFinite(surah) &&
    surah >= 1 &&
    surah <= 114 &&
    Number.isFinite(ayah) &&
    ayah >= 1
  );
}

function normalizeState(state: QuranAudioResumeState): QuranAudioResumeState {
  return {
    surah: state.surah,
    ayah: state.ayah,
    currentTime: Math.max(0, Number(state.currentTime) || 0),
    reciterId: typeof state.reciterId === "string" ? state.reciterId : undefined,
    updatedAt: Number(state.updatedAt) || Date.now(),
  };
}

function ensureUnloadRegistration(): void {
  if (unloadRegistered || typeof window === "undefined") return;
  unloadRegistered = true;
  registerUnloadPersist("quran-audio-resume", () => {
    const snap = pendingResume ?? loadAudioResumeState();
    if (!snap) return null;
    return { [LS_KEY]: JSON.stringify(normalizeState(snap)) };
  });
}

export function saveAudioResumeState(state: QuranAudioResumeState): void {
  try {
    const payload = normalizeState({ ...state, updatedAt: Date.now() });
    pendingResume = payload;
    ensureUnloadRegistration();
    writeLocalJson(LS_KEY, payload);
    // Keep legacy position in sync for existing Mushaf resume UX
    savePosition(payload.surah, payload.ayah);
    void idbPut(payload);
  } catch {
    /* silent */
  }
}

/** Stage resume without forcing IDB (for high-frequency timeupdate / unload).
 * Part 14: mutate pending in place — no per-tick object spread. */
export function stageAudioResumeState(state: QuranAudioResumeState): void {
  const t = Math.max(0, Number(state.currentTime) || 0);
  const updatedAt = Number(state.updatedAt) || Date.now();
  const reciterId = typeof state.reciterId === "string" ? state.reciterId : undefined;
  if (!pendingResume) {
    pendingResume = {
      surah: state.surah,
      ayah: state.ayah,
      currentTime: t,
      reciterId,
      updatedAt,
    };
  } else {
    pendingResume.surah = state.surah;
    pendingResume.ayah = state.ayah;
    pendingResume.currentTime = t;
    pendingResume.reciterId = reciterId;
    pendingResume.updatedAt = updatedAt;
  }
  ensureUnloadRegistration();
}

/** Flush pending resume sync to LocalStorage (pagehide / hook cleanup). */
export function flushAudioResumeState(): void {
  if (!pendingResume) return;
  try {
    writeLocalJson(LS_KEY, pendingResume);
    savePosition(pendingResume.surah, pendingResume.ayah);
  } catch {
    /* silent */
  }
}

export function loadAudioResumeState(): QuranAudioResumeState | null {
  const parsed = readLocalJson<QuranAudioResumeState | null>(LS_KEY, null, (v): v is QuranAudioResumeState =>
    isAudioResumeState(v),
  );
  if (parsed) {
    return {
      surah: Number(parsed.surah),
      ayah: Number(parsed.ayah),
      currentTime: Math.max(0, Number(parsed.currentTime) || 0),
      reciterId: typeof parsed.reciterId === "string" ? parsed.reciterId : undefined,
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  }
  // Fallback to legacy surah/ayah position
  const legacy = loadPosition();
  if (!legacy) return null;
  return {
    surah: legacy.surah,
    ayah: legacy.ayah,
    currentTime: 0,
    updatedAt: 0,
  };
}

export async function loadAudioResumeStateAsync(): Promise<QuranAudioResumeState | null> {
  try {
    const fromIdb = await idbGet();
    if (fromIdb && isAudioResumeState(fromIdb)) {
      return normalizeState(fromIdb);
    }
  } catch {
    /* ignore */
  }
  return loadAudioResumeState();
}

/**
 * Scroll the actively recited ayah element into view (centered).
 * Looks for `[data-ayah="<n>"]` within an optional container.
 */
export function scrollActiveAyahIntoView(
  ayah: number,
  opts?: { container?: HTMLElement | null; behavior?: ScrollBehavior },
): boolean {
  try {
    if (typeof document === "undefined" || !Number.isFinite(ayah)) return false;
    const root = opts?.container ?? document;
    const el =
      root.querySelector(`[data-ayah="${ayah}"]`) ||
      root.querySelector(`[data-ayah-number="${ayah}"]`) ||
      document.getElementById(`ayah-${ayah}`);
    if (!el || !(el instanceof HTMLElement)) return false;
    el.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: opts?.behavior ?? "smooth",
    });
    return true;
  } catch {
    return false;
  }
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(state: QuranAudioResumeState): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(state, IDB_KEY);
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

async function idbGet(): Promise<QuranAudioResumeState | null> {
  const db = await openDb();
  if (!db) return null;
  const result = await new Promise<QuranAudioResumeState | null>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        const v = req.result;
        resolve(isAudioResumeState(v) ? normalizeState(v) : null);
      };
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
  return result;
}
