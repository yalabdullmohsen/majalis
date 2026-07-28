/**
 * Adaptive Offline Pre-Fetching Utility.
 * Monitors reading position and quietly prefetches adjacent surahs,
 * related tafsir, and upcoming azkar into IndexedDB.
 */

import { isOnline, idbPut, OFFLINE_STORES } from "@/lib/offline-db";
import {
  cacheQuranSurah,
  cacheAdhkarPack,
  getCachedQuranSurah,
  getCachedAdhkarPack,
} from "@/lib/offline-content-store";
import { fetchSurahDetail, fetchTafsirAyahs, getSurahMeta } from "@/lib/quran-api";
import { getAllAdhkarItems } from "@/lib/adhkar-seed";

export type PrefetchPosition = {
  surah: number;
  ayah?: number;
  page?: number;
};

export type PrefetchStatus = {
  lastPosition: PrefetchPosition | null;
  queued: string[];
  completed: string[];
  lastRunAt: string | null;
  running: boolean;
};

const LS_STATUS = "majalis-adaptive-prefetch-v1";
const DEFAULT_TAFSIR = "ar.muyassar";

let inflight: Promise<void> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function loadStatus(): PrefetchStatus {
  try {
    const raw = localStorage.getItem(LS_STATUS);
    if (!raw) {
      return { lastPosition: null, queued: [], completed: [], lastRunAt: null, running: false };
    }
    return {
      lastPosition: null,
      queued: [],
      completed: [],
      lastRunAt: null,
      running: false,
      ...(JSON.parse(raw) as Partial<PrefetchStatus>),
      running: false,
    };
  } catch {
    return { lastPosition: null, queued: [], completed: [], lastRunAt: null, running: false };
  }
}

function saveStatus(status: PrefetchStatus): PrefetchStatus {
  try {
    localStorage.setItem(LS_STATUS, JSON.stringify({ ...status, running: false }));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, "adaptive-prefetch-status", status).catch(() => undefined);
  return status;
}

function clampSurah(n: number): number {
  return Math.min(114, Math.max(1, Math.floor(n)));
}

function neighborSurahs(surah: number): number[] {
  const set = new Set<number>();
  set.add(clampSurah(surah));
  set.add(clampSurah(surah - 1));
  set.add(clampSurah(surah + 1));
  // Common short companions near end
  if (surah >= 110) {
    set.add(112);
    set.add(113);
    set.add(114);
  }
  return [...set];
}

async function prefetchSurah(n: number): Promise<string> {
  const tag = `surah:${n}`;
  const cached = await getCachedQuranSurah(n);
  if (cached?.ayahs?.length) return `${tag}:cached`;
  if (!isOnline()) return `${tag}:offline-skip`;
  const detail = await fetchSurahDetail(n);
  await cacheQuranSurah(detail);
  return `${tag}:fetched`;
}

async function prefetchTafsir(surah: number, edition = DEFAULT_TAFSIR): Promise<string> {
  const tag = `tafsir:${edition}:${surah}`;
  if (!isOnline()) return `${tag}:offline-skip`;
  try {
    const ayahs = await fetchTafsirAyahs(surah, edition);
    if (ayahs.length) {
      await idbPut(OFFLINE_STORES.quran, `tafsir-${edition}-${surah}`, ayahs);
    }
    return `${tag}:ok`;
  } catch {
    return `${tag}:error`;
  }
}

async function prefetchUpcomingAdhkar(): Promise<string> {
  const tag = "adhkar:pack";
  const cached = await getCachedAdhkarPack();
  if (cached?.length) return `${tag}:cached`;
  try {
    const items = getAllAdhkarItems();
    await cacheAdhkarPack(items);
    return `${tag}:fetched`;
  } catch {
    return `${tag}:error`;
  }
}

/**
 * Run adaptive prefetch for the current reading position.
 * Coalesces concurrent runs; silent on failure.
 */
export async function runAdaptivePrefetch(
  position: PrefetchPosition,
  opts?: { tafsirEdition?: string; includeAdhkar?: boolean },
): Promise<PrefetchStatus> {
  const status = loadStatus();
  status.lastPosition = position;
  status.running = true;

  if (inflight) {
    await inflight.catch(() => undefined);
  }

  inflight = (async () => {
    const completed: string[] = [];
    const queued: string[] = [];
    try {
      const surahs = neighborSurahs(position.surah);
      for (const n of surahs) {
        queued.push(`surah:${n}`);
        queued.push(`tafsir:${n}`);
      }
      if (opts?.includeAdhkar !== false) queued.push("adhkar:pack");
      status.queued = queued;
      saveStatus(status);

      for (const n of surahs) {
        try {
          completed.push(await prefetchSurah(n));
        } catch {
          completed.push(`surah:${n}:error`);
        }
        try {
          completed.push(await prefetchTafsir(n, opts?.tafsirEdition || DEFAULT_TAFSIR));
        } catch {
          completed.push(`tafsir:${n}:error`);
        }
      }

      if (opts?.includeAdhkar !== false) {
        completed.push(await prefetchUpcomingAdhkar());
      }

      // Warm next surah meta (cheap)
      try {
        getSurahMeta(clampSurah(position.surah + 1));
      } catch {
        /* ignore */
      }
    } finally {
      status.completed = completed.slice(-40);
      status.lastRunAt = new Date().toISOString();
      status.running = false;
      saveStatus(status);
      inflight = null;
    }
  })();

  await inflight;
  return loadStatus();
}

/**
 * Debounced position watcher — call on every surah/page change.
 * Quiet background prefetch after short idle.
 */
export function scheduleAdaptivePrefetch(
  position: PrefetchPosition,
  delayMs = 900,
): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void runAdaptivePrefetch(position).catch(() => undefined);
  }, delayMs);
}

export function getPrefetchStatus(): PrefetchStatus {
  return loadStatus();
}

export function cancelScheduledPrefetch(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
