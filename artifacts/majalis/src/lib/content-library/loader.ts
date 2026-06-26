import type { AdhkarItem } from "@/lib/adhkar-seed";
import { ADHKAR_ITEMS } from "@/lib/adhkar-seed";
import type { DailyAyahEntry, DailyHadithEntry } from "@/lib/daily-content";
import { DAILY_AYAH_POOL, DAILY_HADITH_POOL, DAILY_FAIDA_POOL } from "@/lib/daily-content";
import { pickRotatedItem, pickDailyItem } from "./rotation";

type ImportedAdhkar = AdhkarItem & { categoryName?: string };

let adhkarCache: ImportedAdhkar[] | null = null;
let hadithDailyCache: DailyHadithEntry[] | null = null;
let ayahCache: DailyAyahEntry[] | null = null;
let wisdomCache: Array<{ id: string; text: string; author: string; category: string; source: string }> | null = null;

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadImportedAdhkar(): Promise<ImportedAdhkar[]> {
  if (adhkarCache) return adhkarCache;
  const data = await fetchJson<ImportedAdhkar[]>("/content/adhkar-full.json");
  if (data?.length) {
    adhkarCache = data.map((item) => ({
      ...item,
      keywords: item.keywords ?? [],
    }));
    return adhkarCache;
  }
  adhkarCache = ADHKAR_ITEMS;
  return adhkarCache;
}

export async function getMergedAdhkarItems(): Promise<AdhkarItem[]> {
  const imported = await loadImportedAdhkar();
  const seedIds = new Set(ADHKAR_ITEMS.map((i) => i.id));
  const merged = [...ADHKAR_ITEMS];
  for (const item of imported) {
    if (!seedIds.has(item.id)) merged.push(item);
  }
  return merged;
}

export async function loadHadithDailyPool(): Promise<DailyHadithEntry[]> {
  if (hadithDailyCache) return hadithDailyCache;
  const data = await fetchJson<Array<{
    id: string;
    text: string;
    narrator: string;
    source: string;
    grade?: string;
    meaning: string;
    url?: string;
  }>>("/content/hadith/daily-pool.json");

  if (data?.length) {
    hadithDailyCache = data.map((h) => ({
      id: h.id,
      text: h.text,
      narrator: h.narrator,
      source: h.source,
      grade: h.grade,
      meaning: h.meaning,
    }));
    return hadithDailyCache;
  }
  hadithDailyCache = DAILY_HADITH_POOL;
  return hadithDailyCache;
}

export async function loadAyahDailyPool(): Promise<DailyAyahEntry[]> {
  if (ayahCache) return ayahCache;
  const data = await fetchJson<DailyAyahEntry[]>("/content/daily-ayah-pool.json");
  if (data?.length) {
    ayahCache = data;
    return ayahCache;
  }
  ayahCache = DAILY_AYAH_POOL;
  return ayahCache;
}

export async function loadWisdomPool() {
  if (wisdomCache) return wisdomCache;
  const data = await fetchJson<Array<{ id: string; text: string; author: string; category: string; source: string }>>(
    "/content/daily-wisdom-pool.json",
  );
  wisdomCache = data?.length ? data : [];
  return wisdomCache;
}

export async function getDailyHadithRotated(date = new Date()) {
  const pool = await loadHadithDailyPool();
  if (typeof window === "undefined") return pickDailyItem(pool, date);
  return pickRotatedItem("hadith", pool, date);
}

export async function getDailyAyahRotated(date = new Date()) {
  const pool = await loadAyahDailyPool();
  if (typeof window === "undefined") return pickDailyItem(pool, date);
  return pickRotatedItem("ayah", pool, date);
}

export async function getDailyDhikrRotated(date = new Date()) {
  const pool = await loadImportedAdhkar();
  const dhikrPool = pool.filter((i) =>
    ["adh-morning", "adh-evening", "adh-sleep", "adh-istighfar"].includes(i.categoryId),
  );
  const items = (dhikrPool.length ? dhikrPool : pool).map((i) => ({ ...i }));
  if (typeof window === "undefined") return pickDailyItem(items, date);
  return pickRotatedItem("dhikr", items, date);
}

export async function getDailyWisdomRotated(date = new Date()) {
  const pool = await loadWisdomPool();
  if (!pool.length) {
    const fallback = DAILY_HADITH_POOL.map((h) => ({
      id: h.id,
      text: h.text,
      author: h.narrator,
      category: "حديث",
      source: h.source,
    }));
    return pickDailyItem(fallback, date);
  }
  if (typeof window === "undefined") return pickDailyItem(pool, date);
  return pickRotatedItem("wisdom", pool, date);
}

export async function getDailyFaidaRotated(date = new Date()) {
  const items = DAILY_FAIDA_POOL.map((f) => ({ ...f }));
  if (typeof window === "undefined") return pickDailyItem(items, date);
  return pickRotatedItem("faida", items, date);
}

export type HadithIndex = {
  collections: Array<{ key: string; label: string; count: number; file?: string; curated?: boolean }>;
  totalHadiths: number;
};

export async function loadHadithIndex(): Promise<HadithIndex | null> {
  return fetchJson<HadithIndex>("/content/hadith/index.json");
}

export async function loadHadithCollection(key: string) {
  return fetchJson<{ metadata: Record<string, unknown>; hadiths: Array<Record<string, unknown>> }>(
    `/content/hadith/${key}.json`,
  );
}
