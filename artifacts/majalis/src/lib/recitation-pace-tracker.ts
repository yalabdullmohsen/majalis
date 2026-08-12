/**
 * Smart Recitation Pace & Reflection Pause — measures dwell time per page/ayah
 * to encourage Tadabbur. Optional pause payload after finishing a Quran page.
 */

import { fetchTafsirAyahs } from "@/lib/quran-api";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type RecitationTargetKind = "page" | "ayah";

export type RecitationPaceSample = {
  kind: RecitationTargetKind;
  /** page number (1–604) or ayah key "surah:ayah" */
  targetId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
};

export type RecitationPaceStats = {
  samples: RecitationPaceSample[];
  /** Rolling average ms per page */
  avgPageMs: number;
  /** Rolling average ms per ayah */
  avgAyahMs: number;
  /** Suggested minimum dwell ms for tadabbur (based on history) */
  suggestedPagePauseMs: number;
  updatedAt: string;
};

export type ReflectionPauseState = {
  active: boolean;
  page: number | null;
  /** Key verse on the page to reflect on */
  focusSurah: number | null;
  focusAyah: number | null;
  summary: string;
  tafsirSnippet: string | null;
  createdAt: number;
};

const LS_KEY = "majalis-recitation-pace-v1";
const IDB_KEY = "recitation-pace-stats";
const MAX_SAMPLES = 200;
const MIN_DWELL_MS = 2_000;
const DEFAULT_PAGE_PAUSE_MS = 8_000;

function emptyStats(): RecitationPaceStats {
  return {
    samples: [],
    avgPageMs: 0,
    avgAyahMs: 0,
    suggestedPagePauseMs: DEFAULT_PAGE_PAUSE_MS,
    updatedAt: new Date().toISOString(),
  };
}

function recompute(samples: RecitationPaceSample[]): RecitationPaceStats {
  const pages = samples.filter((s) => s.kind === "page");
  const ayahs = samples.filter((s) => s.kind === "ayah");
  const avg = (arr: RecitationPaceSample[]) =>
    arr.length ? arr.reduce((n, s) => n + s.durationMs, 0) / arr.length : 0;
  const avgPageMs = avg(pages);
  const avgAyahMs = avg(ayahs);
  const suggestedPagePauseMs = Math.round(
    Math.min(60_000, Math.max(DEFAULT_PAGE_PAUSE_MS, avgPageMs * 0.15 || DEFAULT_PAGE_PAUSE_MS)),
  );
  return {
    samples,
    avgPageMs,
    avgAyahMs,
    suggestedPagePauseMs,
    updatedAt: new Date().toISOString(),
  };
}

export function loadRecitationPaceStats(): RecitationPaceStats {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as RecitationPaceStats;
    return recompute(Array.isArray(parsed.samples) ? parsed.samples : []);
  } catch {
    return emptyStats();
  }
}

export function saveRecitationPaceStats(stats: RecitationPaceStats): RecitationPaceStats {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(stats));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, stats).catch(() => undefined);
  return stats;
}

export async function loadRecitationPaceStatsAsync(): Promise<RecitationPaceStats> {
  try {
    const fromIdb = await idbGetValue<RecitationPaceStats>(OFFLINE_STORES.meta, IDB_KEY);
    if (fromIdb?.samples) return recompute(fromIdb.samples);
  } catch {
    /* fall through */
  }
  return loadRecitationPaceStats();
}

/** Active session timers (in-memory). */
const activeTimers = new Map<string, number>();

function timerKey(kind: RecitationTargetKind, targetId: string): string {
  return `${kind}:${targetId}`;
}

export function startRecitationTimer(kind: RecitationTargetKind, targetId: string): void {
  activeTimers.set(timerKey(kind, targetId), Date.now());
}

export function stopRecitationTimer(
  kind: RecitationTargetKind,
  targetId: string,
): RecitationPaceSample | null {
  const key = timerKey(kind, targetId);
  const startedAt = activeTimers.get(key);
  activeTimers.delete(key);
  if (!startedAt) return null;
  const endedAt = Date.now();
  const durationMs = endedAt - startedAt;
  if (durationMs < MIN_DWELL_MS) return null;

  const sample: RecitationPaceSample = { kind, targetId, startedAt, endedAt, durationMs };
  const prev = loadRecitationPaceStats();
  const samples = [...prev.samples, sample].slice(-MAX_SAMPLES);
  saveRecitationPaceStats(recompute(samples));
  return sample;
}

/** True when dwell time is below a tadabbur-friendly threshold (reading too fast). */
export function isReadingTooFast(
  kind: RecitationTargetKind,
  durationMs: number,
  stats: RecitationPaceStats = loadRecitationPaceStats(),
): boolean {
  const baseline =
    kind === "page"
      ? Math.max(stats.avgPageMs, DEFAULT_PAGE_PAUSE_MS * 3)
      : Math.max(stats.avgAyahMs, 4_000);
  return durationMs > 0 && durationMs < baseline * 0.35;
}

export function createIdleReflectionPause(): ReflectionPauseState {
  return {
    active: false,
    page: null,
    focusSurah: null,
    focusAyah: null,
    summary: "",
    tafsirSnippet: null,
    createdAt: 0,
  };
}

/**
 * Build a reflection pause after completing a page.
 * Uses provided focus ayah + optional short summary; fetches tafsir when online.
 */
export async function buildReflectionPause(opts: {
  page: number;
  focusSurah: number;
  focusAyah: number;
  /** Short meaning / reflection seed (from daily content or caller) */
  summary?: string;
  tafsirEdition?: string;
  enabled?: boolean;
}): Promise<ReflectionPauseState> {
  if (opts.enabled === false) return createIdleReflectionPause();

  let tafsirSnippet: string | null = null;
  try {
    const edition = opts.tafsirEdition || "ar.muyassar";
    const ayahs = await fetchTafsirAyahs(opts.focusSurah, edition);
    const hit = ayahs.find((a) => a.numberInSurah === opts.focusAyah);
    if (hit?.text) {
      tafsirSnippet = hit.text.length > 420 ? `${hit.text.slice(0, 420)}…` : hit.text;
    }
  } catch {
    tafsirSnippet = null;
  }

  return {
    active: true,
    page: opts.page,
    focusSurah: opts.focusSurah,
    focusAyah: opts.focusAyah,
    summary:
      opts.summary?.trim() ||
      `تدبّر صفحة ${opts.page} — آية ${opts.focusSurah}:${opts.focusAyah}. توقّف لحظة قبل الانتقال.`,
    tafsirSnippet,
    createdAt: Date.now(),
  };
}

export function dismissReflectionPause(): ReflectionPauseState {
  return createIdleReflectionPause();
}
