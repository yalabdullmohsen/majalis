/**
 * دالة موحدة لجلب الدروس:
 * 1. المصدر الأساسي: public.lessons في Supabase
 * 2. دمج صفوف catalog/seed غير الموجودة في Supabase (بدون تكرار)
 * 3. Fallback كامل للـ seed عند فراغ الجدول
 */
import { fetchApprovedLessonsFromDb } from "@/lib/supabase";
import { LESSONS_SEED, findSeedLessonById, type LessonSeedRow } from "@/lib/lessons-seed";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import {
  dedupeKuwaitLessons,
  mapLessonRow,
  sortKuwaitLessons,
  splitKuwaitLessons,
} from "@/lib/kuwait-lessons";

export type LessonsSource = "supabase" | "seed" | "merged";

export type FetchLessonsResult = {
  lessons: KuwaitLessonRecord[];
  source: LessonsSource;
};

let cachedResult: FetchLessonsResult | null = null;
let cacheTs = 0;
const CACHE_MS = 60_000;

function seedKey(row: LessonSeedRow): string {
  return String(row.external_key || row.id);
}

function mergeDbWithSeed(dbRows: KuwaitLessonRecord[]): KuwaitLessonRecord[] {
  const seen = new Set(dbRows.map((l) => l.id));
  const supplemental = LESSONS_SEED.filter((row) => !seen.has(seedKey(row))).map((row) =>
    mapLessonRow({ ...row, source: "seed" }),
  );
  return dedupeKuwaitLessons([...dbRows, ...supplemental]);
}

/** جلب جميع الدروس المعتمدة — المصدر الموحد للمنصة. */
export async function fetchLessons(options?: { bypassCache?: boolean }): Promise<FetchLessonsResult> {
  const now = Date.now();
  if (!options?.bypassCache && cachedResult && now - cacheTs < CACHE_MS) {
    return cachedResult;
  }

  try {
    const { data } = await fetchApprovedLessonsFromDb();
    if (data.length > 0) {
      const dbMapped = dedupeKuwaitLessons(data.map((row) => mapLessonRow({ ...row, source: "supabase" })));
      const lessons = sortKuwaitLessons(mergeDbWithSeed(dbMapped));
      const source: LessonsSource = lessons.length > dbMapped.length ? "merged" : "supabase";
      cachedResult = { lessons, source };
      cacheTs = now;
      return cachedResult;
    }
  } catch {
    /* fallback below */
  }

  const lessons = dedupeKuwaitLessons(LESSONS_SEED.map((row) => mapLessonRow({ ...row, source: "seed" })));
  cachedResult = { lessons: sortKuwaitLessons(lessons), source: "seed" };
  cacheTs = now;
  return cachedResult;
}

export async function fetchActiveLessons(): Promise<FetchLessonsResult & { active: KuwaitLessonRecord[] }> {
  const result = await fetchLessons();
  return { ...result, active: splitKuwaitLessons(result.lessons).active };
}

export async function fetchLessonsSplit(): Promise<
  FetchLessonsResult & { active: KuwaitLessonRecord[]; archived: KuwaitLessonRecord[] }
> {
  const result = await fetchLessons();
  const { active, archived } = splitKuwaitLessons(result.lessons);
  return { ...result, active, archived };
}

export async function fetchLessonById(id: string): Promise<{
  lesson: KuwaitLessonRecord | null;
  source: LessonsSource;
}> {
  const { lessons, source } = await fetchLessons();
  const found = lessons.find((l) => l.id === id);
  if (found) return { lesson: found, source };

  const seedRow = findSeedLessonById(id);
  if (seedRow) return { lesson: mapLessonRow(seedRow), source: "seed" };

  return { lesson: null, source };
}

export function invalidateLessonsCache() {
  cachedResult = null;
  cacheTs = 0;
}

export async function loadKuwaitLessons() {
  const { active } = await fetchLessonsSplit();
  return active;
}

export async function loadKuwaitLessonsArchive() {
  const { archived } = await fetchLessonsSplit();
  return archived;
}

export async function loadAllKuwaitLessonsSplit() {
  const { active, archived, source } = await fetchLessonsSplit();
  return { active, archived, source };
}

export async function getKuwaitLessonById(id: string) {
  const { lesson } = await fetchLessonById(id);
  return lesson;
}

/** Alias موحّد — يجلب الدروس والدورات والمحاضرات من مصدر واحد. */
export const getUnifiedLessons = fetchLessons;

export async function getUnifiedActiveLessons() {
  return fetchActiveLessons();
}

export async function getUnifiedLessonsSplit() {
  return fetchLessonsSplit();
}
