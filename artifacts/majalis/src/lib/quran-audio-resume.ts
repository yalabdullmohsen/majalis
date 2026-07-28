/**
 * Audio-to-Text Verse Sync & Auto-Resume — persistence + scroll helpers.
 * Coalesced LocalStorage writes + Dexie meta mirror (atomic) to avoid main-thread jank.
 */

import { savePosition, loadPosition } from "@/lib/quran-api";
import { OFFLINE_STORES, idbGetValue, idbPut } from "@/lib/offline-db";

const LS_KEY = "majalis-quran-audio-resume-v1";
const META_KEY = "quran-audio-resume-v1";

export type QuranAudioResumeState = {
  surah: number;
  ayah: number;
  /** Seconds into the current ayah audio */
  currentTime: number;
  reciterId?: string;
  updatedAt: number;
};

let pending: QuranAudioResumeState | null = null;
let flushTimer: number | null = null;
let idleHandle: number | null = null;

function normalize(state: QuranAudioResumeState): QuranAudioResumeState {
  return {
    surah: state.surah,
    ayah: state.ayah,
    currentTime: Math.max(0, Number(state.currentTime) || 0),
    reciterId: state.reciterId,
    updatedAt: Date.now(),
  };
}

function writeSync(payload: QuranAudioResumeState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    savePosition(payload.surah, payload.ayah);
  } catch {
    /* silent */
  }
  void idbPut(OFFLINE_STORES.meta, META_KEY, payload).catch(() => {});
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  const kick = () => {
    flushTimer = null;
    idleHandle = null;
    if (!pending) return;
    const next = pending;
    pending = null;
    writeSync(next);
  };

  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    idleHandle = window.requestIdleCallback(kick, { timeout: 800 });
  } else {
    flushTimer = window.setTimeout(kick, 120);
  }
}

/** Force pending resume write (pause / stop / pagehide). */
export function flushAudioResumeState(): void {
  if (typeof window !== "undefined") {
    if (idleHandle != null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleHandle);
      idleHandle = null;
    }
  }
  if (flushTimer != null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pending) {
    const next = pending;
    pending = null;
    writeSync(next);
  }
}

function bindFlushListeners(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __majalis_audio_resume_flush_bound__?: boolean };
  if (w.__majalis_audio_resume_flush_bound__) return;
  w.__majalis_audio_resume_flush_bound__ = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushAudioResumeState();
  });
  window.addEventListener("pagehide", () => flushAudioResumeState());
}

export function saveAudioResumeState(state: QuranAudioResumeState): void {
  pending = normalize(state);
  bindFlushListeners();
  scheduleFlush();
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
    const fromIdb = await idbGetValue<QuranAudioResumeState>(OFFLINE_STORES.meta, META_KEY);
    if (fromIdb && Number.isFinite(fromIdb.surah) && Number.isFinite(fromIdb.ayah)) {
      return fromIdb;
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
