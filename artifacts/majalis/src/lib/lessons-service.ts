/**
 * دالة موحدة لجلب الدروس:
 * 1. المصدر الأساسي: public.lessons في Supabase
 * 2. Fallback: LESSONS_SEED فقط عند فراغ الجدول أو عدم تهيئة Supabase
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

export type LessonsSource = "supabase" | "seed";

export type FetchLessonsResult = {
  lessons: KuwaitLessonRecord[];
  source: LessonsSource;
};

let cachedResult: FetchLessonsResult | null = null;
let cacheTs = 0;
const CACHE_MS = 60_000;

function rowsFromSeed(): LessonSeedRow[] {
  return LESSONS_SEED;
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
      const lessons = dedupeKuwaitLessons(data.map(mapLessonRow));
      cachedResult = { lessons: sortKuwaitLessons(lessons), source: "supabase" };
      cacheTs = now;
      return cachedResult;
    }
  } catch {
    /* fallback below */
  }

  const lessons = dedupeKuwaitLessons(rowsFromSeed().map(mapLessonRow));
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

  if (source === "supabase") {
    const seedRow = findSeedLessonById(id);
    if (seedRow) return { lesson: mapLessonRow(seedRow), source: "seed" };
  }

  return { lesson: null, source };
}

export function invalidateLessonsCache() {
  cachedResult = null;
  cacheTs = 0;
}

/** جلب الدروس النشطة — للصفحة الرئيسية والتقويم. */
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
