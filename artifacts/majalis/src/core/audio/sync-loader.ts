/**
 * Load optional ayah timing maps for continuous surah audio.
 * Looks for `/data/quran/timestamps/{reciter}/{surah}.sync.json`:
 *   { "ayahs": [{ "ayah": 1, "start": 0, "end": 4.2 }, ...] }
 * Falls back to word-timestamp files reshaped as equal ayah spans when absent.
 */
import { pooledFetch } from "@/lib/fetch-pool";
import type { AyahTiming, SurahSyncMap } from "@/core/audio/types";

const cache = new Map<string, SurahSyncMap | null>();

function cacheKey(reciterId: string, surah: number): string {
  return `${reciterId}:${surah}`;
}

function normalizeAyahs(raw: unknown): AyahTiming[] {
  if (!Array.isArray(raw)) return [];
  const out: AyahTiming[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const ayah = Number(r.ayah ?? r.number);
    const start = Number(r.start ?? r.startSec ?? r.from);
    const end = Number(r.end ?? r.endSec ?? r.to);
    if (!Number.isFinite(ayah) || !Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (end <= start) continue;
    out.push({ ayah: Math.floor(ayah), start, end });
  }
  return out.sort((a, b) => a.ayah - b.ayah || a.start - b.start);
}

/**
 * Resolve a sync map for continuous playback. Returns null when no timing
 * file is available — callers should use per-ayah clips instead.
 */
export async function loadSurahSyncMap(
  surah: number,
  reciterId: string,
): Promise<SurahSyncMap | null> {
  const k = cacheKey(reciterId, surah);
  if (cache.has(k)) return cache.get(k) ?? null;

  try {
    const res = await pooledFetch(
      `/data/quran/timestamps/${encodeURIComponent(reciterId)}/${surah}.sync.json`,
      { timeoutMs: 4500, dedupeKey: `sync:${reciterId}:${surah}` },
    );
    if (res.ok) {
      const json = (await res.json()) as { ayahs?: unknown; mode?: string };
      const ayahs = normalizeAyahs(json.ayahs);
      if (ayahs.length > 0) {
        const map: SurahSyncMap = {
          surah,
          reciterId,
          mode: "continuous",
          ayahs,
        };
        cache.set(k, map);
        return map;
      }
    }
  } catch {
    /* no sync file */
  }

  cache.set(k, null);
  return null;
}

/** Find the ayah whose [start, end) contains `timeSec`. */
export function ayahAtTime(map: SurahSyncMap, timeSec: number): AyahTiming | null {
  if (!map.ayahs.length) return null;
  let hit: AyahTiming | null = null;
  for (const row of map.ayahs) {
    if (timeSec >= row.start) hit = row;
    if (timeSec < row.end) return row;
  }
  return hit ?? map.ayahs[map.ayahs.length - 1] ?? null;
}

export function findAyahTiming(map: SurahSyncMap, ayah: number): AyahTiming | null {
  return map.ayahs.find((a) => a.ayah === ayah) ?? null;
}

/** Test helper — clear in-memory sync cache. */
export function __clearSurahSyncCacheForTests(): void {
  cache.clear();
}
