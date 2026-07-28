/**
 * Audio-to-Text Verse Sync & Auto-Resume — persistence + scroll helpers.
 * Coalesces rapid writes off the main thread (idle) to prevent scroll jank.
 */

import { savePosition, loadPosition } from "@/lib/quran-api";
import { createWriteCoalescer, deferIdleWork } from "@/utils/defer-storage";
import { idbPut as enginePut, idbGetValue, OFFLINE_STORES } from "@/lib/offline-db";

const LS_KEY = "majalis-quran-audio-resume-v1";
const IDB_META_KEY = "quran-audio-resume-v1";
/** Legacy raw IDB (migrated lazily into Dexie meta). */
const LEGACY_IDB_NAME = "majalis-quran-audio-resume";
const LEGACY_IDB_STORE = "resume";
const LEGACY_IDB_KEY = "current";

export type QuranAudioResumeState = {
  surah: number;
  ayah: number;
  /** Seconds into the current ayah audio */
  currentTime: number;
  reciterId?: string;
  updatedAt: number;
};

function normalizeState(state: QuranAudioResumeState): QuranAudioResumeState {
  return {
    surah: state.surah,
    ayah: state.ayah,
    currentTime: Math.max(0, Number(state.currentTime) || 0),
    reciterId: state.reciterId,
    updatedAt: Date.now(),
  };
}

function writeResumePayload(payload: QuranAudioResumeState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
  try {
    savePosition(payload.surah, payload.ayah);
  } catch {
    /* ignore */
  }
  deferIdleWork(() => {
    void enginePut(OFFLINE_STORES.meta, IDB_META_KEY, payload).catch(() => undefined);
  });
}

const resumeWriter = createWriteCoalescer<QuranAudioResumeState>({
  write: writeResumePayload,
  maxWaitMs: 2_500,
  idleTimeoutMs: 1_000,
});

let visibilityBound = false;
function ensureFlushOnHide(): void {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") resumeWriter.flush();
  });
  window.addEventListener("pagehide", () => resumeWriter.flush());
}

/** Coalesced save — safe to call on every ayah tick / pause. */
export function saveAudioResumeState(state: QuranAudioResumeState): void {
  try {
    ensureFlushOnHide();
    resumeWriter.enqueue(normalizeState(state));
  } catch {
    /* silent */
  }
}

/** Immediate flush (pause / unmount / navigation). */
export function flushAudioResumeState(state?: QuranAudioResumeState): void {
  try {
    if (state) resumeWriter.enqueue(normalizeState(state));
    resumeWriter.flush();
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
    const fromMeta = await idbGetValue<QuranAudioResumeState>(OFFLINE_STORES.meta, IDB_META_KEY);
    if (fromMeta?.surah) return fromMeta;
  } catch {
    /* ignore */
  }
  try {
    const legacy = await legacyIdbGet();
    if (legacy) {
      void enginePut(OFFLINE_STORES.meta, IDB_META_KEY, legacy).catch(() => undefined);
      return legacy;
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

function openLegacyDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const req = indexedDB.open(LEGACY_IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(LEGACY_IDB_STORE)) {
          db.createObjectStore(LEGACY_IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function legacyIdbGet(): Promise<QuranAudioResumeState | null> {
  const db = await openLegacyDb();
  if (!db) return null;
  const result = await new Promise<QuranAudioResumeState | null>((resolve) => {
    try {
      const tx = db.transaction(LEGACY_IDB_STORE, "readonly");
      const req = tx.objectStore(LEGACY_IDB_STORE).get(LEGACY_IDB_KEY);
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
