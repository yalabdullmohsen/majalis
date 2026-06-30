/**
 * Quran text API — backed exclusively by api.alquran.cloud (AlQuran Cloud).
 * Source: https://alquran.cloud/api — open, free, no API key required.
 * Edition used: quran-uthmani (Uthmanic script, Hafs ʿan ʿĀṣim)
 *
 * ⚠️ Never generate or modify Quran text manually.
 *    All content comes from the API only.
 */

const BASE = "https://api.alquran.cloud/v1";
const CACHE_PREFIX = "mj-quran-v3-";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SurahSummary = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
};

export type SurahDetail = SurahSummary & { ayahs: Ayah[] };

export type TafsirAyah = { numberInSurah: number; text: string };

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw) as { data: T; at: number };
    if (Date.now() - at > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const cached = readCache<SurahSummary[]>("surah-list");
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`AlQuran Cloud: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !Array.isArray(json.data)) throw new Error("AlQuran Cloud: unexpected response");
  const list: SurahSummary[] = json.data;
  writeCache("surah-list", list);
  return list;
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const key = `surah-${surahNumber}`;
  const cached = readCache<SurahDetail>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/quran-uthmani`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error("AlQuran Cloud: unexpected response");
  const detail: SurahDetail = json.data;
  writeCache(key, detail);
  return detail;
}

export async function fetchTafsirAyahs(
  surahNumber: number,
  edition: string,
): Promise<TafsirAyah[]> {
  const key = `tafsir-${edition}-${surahNumber}`;
  const cached = readCache<TafsirAyah[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/${edition}`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud tafsir: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data?.ayahs) return [];
  const result: TafsirAyah[] = json.data.ayahs.map((a: { numberInSurah: number; text: string }) => ({
    numberInSurah: a.numberInSurah,
    text: a.text,
  }));
  writeCache(key, result);
  return result;
}

export type SearchMatch = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
};

export async function searchQuran(query: string): Promise<SearchMatch[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE}/search/${encodeURIComponent(query.trim())}/all/ar`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) return [];
  const json = await res.json();
  if (json.code !== 200 || !json.data?.matches) return [];
  return (json.data.matches as Array<{
    surah: { number: number; name: string };
    numberInSurah: number;
    text: string;
  }>).map((m) => ({
    surahNumber: m.surah.number,
    surahName: m.surah.name,
    ayahNumber: m.numberInSurah,
    text: m.text,
  }));
}

export function clearQuranCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ─── Position persistence ──────────────────────────────────────────────────
const POS_KEY = "mj-quran-pos-v3";

export function savePosition(surah: number, ayah: number) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ surah, ayah, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadPosition(): { surah: number; ayah: number } | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
