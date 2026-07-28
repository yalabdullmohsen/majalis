/**
 * Safe URL / hash param parsing — clamps bounds, never throws.
 */

import { getSurahMeta } from "@/lib/quran-api";

export function parsePositiveInt(
  raw: string | null | undefined,
  opts?: { min?: number; max?: number; fallback?: number },
): number {
  const min = opts?.min ?? 1;
  const max = opts?.max ?? Number.MAX_SAFE_INTEGER;
  const fallback = opts?.fallback ?? min;
  if (raw == null || raw === "") return fallback;
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return fallback;
  const floored = Math.floor(n);
  if (floored < min || floored > max) {
    return Math.max(min, Math.min(max, floored));
  }
  return floored;
}

export function clampSurah(surah: number): number {
  if (!Number.isFinite(surah)) return 1;
  return Math.max(1, Math.min(114, Math.floor(surah)));
}

/** Clamp ayah to the surah's actual ayah count (Hafs). */
export function clampAyah(surah: number, ayah: number): number {
  const s = clampSurah(surah);
  const max = getSurahMeta(s).ayahs || 1;
  if (!Number.isFinite(ayah) || ayah < 1) return 1;
  return Math.max(1, Math.min(max, Math.floor(ayah)));
}

export function safeDecodeURIComponent(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Parse search string without throwing on malformed input. */
export function safeSearchParams(search: string): URLSearchParams {
  try {
    const q = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(q);
  } catch {
    return new URLSearchParams();
  }
}
