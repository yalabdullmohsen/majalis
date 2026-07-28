/**
 * Data-access layer for `quran_knowledge_store`.
 * Flattened ayah_key → similar keys + theme ids for zero-latency page lookups
 * (avoids re-parsing large JSON graphs on every render).
 */
import { getQuranOfflineDb } from "@/lib/quran-offline/db";
import type { QuranKnowledgeRecord } from "@/lib/quran-offline/types";
import { touchKnowledgeAccess } from "@/lib/quran-offline/access-touch";

export function ayahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export async function getKnowledgeForAyah(
  surah: number,
  ayah: number,
): Promise<QuranKnowledgeRecord | null> {
  const db = getQuranOfflineDb();
  if (!db) return null;
  const key = ayahKey(surah, ayah);
  const row = (await db.quran_knowledge_store.get(key)) ?? null;
  if (row) touchKnowledgeAccess(key);
  return row;
}

export async function getSimilarAyahKeysCached(
  surah: number,
  ayah: number,
): Promise<string[]> {
  const row = await getKnowledgeForAyah(surah, ayah);
  return row?.similar_ayah_keys ?? [];
}

export async function getThemeIdsForAyah(surah: number, ayah: number): Promise<string[]> {
  const row = await getKnowledgeForAyah(surah, ayah);
  return row?.theme_ids ?? [];
}

/** Bulk put — used when warming from mutashabihat JSON + topics index. */
export async function putKnowledgeBatch(
  rows: Array<Omit<QuranKnowledgeRecord, "updated_at"> & { updated_at?: number }>,
): Promise<number> {
  const db = getQuranOfflineDb();
  if (!db || rows.length === 0) return 0;
  const ts = Date.now();
  const prepared: QuranKnowledgeRecord[] = rows.map((r) => ({
    ayah_key: r.ayah_key,
    similar_ayah_keys: r.similar_ayah_keys ?? [],
    theme_ids: r.theme_ids ?? [],
    updated_at: r.updated_at ?? ts,
    last_accessed_at: r.last_accessed_at ?? ts,
    access_count: r.access_count ?? 0,
  }));
  await db.quran_knowledge_store.bulkPut(prepared);
  return prepared.length;
}

/**
 * Merge similar + theme maps into knowledge rows (pure transform — testable offline).
 */
export function mergeKnowledgeMaps(
  similarByAyah: Record<string, string[]>,
  themesByAyah: Record<string, string[]>,
): Array<Omit<QuranKnowledgeRecord, "updated_at">> {
  const keys = new Set([...Object.keys(similarByAyah), ...Object.keys(themesByAyah)]);
  const out: Array<Omit<QuranKnowledgeRecord, "updated_at">> = [];
  for (const ayah_key of keys) {
    out.push({
      ayah_key,
      similar_ayah_keys: similarByAyah[ayah_key] ?? [],
      theme_ids: themesByAyah[ayah_key] ?? [],
    });
  }
  return out;
}

/**
 * Invert QURAN_TOPICS verses → ayah_key → theme_ids (pure).
 */
export function invertTopicsToAyahMap(
  topics: Array<{ id: string; verses: Array<{ surah: number; ayah: number }> }>,
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const topic of topics) {
    for (const v of topic.verses) {
      const key = ayahKey(v.surah, v.ayah);
      if (!map[key]) map[key] = [];
      if (!map[key].includes(topic.id)) map[key].push(topic.id);
    }
  }
  return map;
}

/**
 * Flatten mutashabihat index Record<"s:a", {surah,ayah}[]> → similar_ayah_keys.
 */
export function flattenMutashabihatToKeys(
  index: Record<string, Array<{ surah: number; ayah: number }>>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, matches] of Object.entries(index)) {
    out[key] = matches.map((m) => ayahKey(m.surah, m.ayah));
  }
  return out;
}

export async function countKnowledgeRows(): Promise<number> {
  const db = getQuranOfflineDb();
  if (!db) return 0;
  return db.quran_knowledge_store.count();
}
