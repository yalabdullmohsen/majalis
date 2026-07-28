/**
 * Audio-to-Text Verse Sync & Auto-Resume — persistence + scroll helpers.
 * Stores exact audio timestamp + active verse for zero-latency resume.
 * Uses localStorage primary + IndexedDB mirror when available (offline-first).
 */

import { savePosition, loadPosition } from "@/lib/quran-api";

const LS_KEY = "majalis-quran-audio-resume-v1";
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

export function saveAudioResumeState(state: QuranAudioResumeState): void {
  try {
    const payload: QuranAudioResumeState = {
      surah: state.surah,
      ayah: state.ayah,
      currentTime: Math.max(0, Number(state.currentTime) || 0),
      reciterId: state.reciterId,
      updatedAt: Date.now(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    // Keep legacy position in sync for existing Mushaf resume UX
    savePosition(payload.surah, payload.ayah);
    void idbPut(payload);
  } catch {
    /* silent */
  }
}

export function loadAudioResumeState(): QuranAudioResumeState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<QuranAudioResumeState>;
      const surah = Number(parsed.surah);
      const ayah = Number(parsed.ayah);
      if (Number.isFinite(surah) && surah >= 1 && surah <= 114 && Number.isFinite(ayah) && ayah >= 1) {
        return {
          surah,
          ayah,
          currentTime: Math.max(0, Number(parsed.currentTime) || 0),
          reciterId: typeof parsed.reciterId === "string" ? parsed.reciterId : undefined,
          updatedAt: Number(parsed.updatedAt) || 0,
        };
      }
    }
  } catch {
    /* fall through */
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
    if (fromIdb) return fromIdb;
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
      root.querySelector(`[data-verse-key$=":${ayah}"]`) ||
      document.getElementById(`ayah-${ayah}`);
    if (!el || !(el instanceof HTMLElement)) return false;
    // Read geometry then scroll in the same frame only when needed —
    // avoid measuring unrelated nodes.
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
      req.onsuccess = () => resolve((req.result as QuranAudioResumeState) || null);
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
