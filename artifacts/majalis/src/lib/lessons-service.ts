/**
 * دالة موحدة لجلب الدروس:
 * 1. المصدر الأساسي: public.lessons في Supabase
 * 2. دمج صفوف catalog/seed غير الموجودة في Supabase (بدون تكرار)
 * 3. Fallback كامل للـ seed عند فراغ الجدول
 */
import { ensureSupabaseReady, fetchApprovedLessonsFromDb } from "@/lib/supabase";
import { LESSONS_SEED, findSeedLessonById, type LessonSeedRow } from "@/lib/lessons-seed";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { sheikhNameKey } from "@/lib/sheikh-name";
import {
  dedupeKuwaitLessons,
  mapLessonRow,
  sortKuwaitLessons,
  splitKuwaitLessons,
} from "@/lib/kuwait-lessons";
import { rankLessonsBySearch, buildLessonSearchMeta } from "@/lib/lesson-search";
import { allowSeedFallback } from "@/lib/cms/production-config";

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
  if (!allowSeedFallback()) return dbRows;
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
    await ensureSupabaseReady();
    const { data } = await fetchApprovedLessonsFromDb();
    if (data.length > 0) {
      const dbMapped = dedupeKuwaitLessons(data.map((row) => mapLessonRow({ ...row, source: "supabase" })));
      const lessons = sortKuwaitLessons(mergeDbWithSeed(dbMapped));
      const source: LessonsSource =
        allowSeedFallback() && lessons.length > dbMapped.length ? "merged" : "supabase";
      cachedResult = { lessons, source };
      cacheTs = now;
      return cachedResult;
    }
    if (!allowSeedFallback()) {
      cachedResult = { lessons: [], source: "supabase" };
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

  const seedRow = allowSeedFallback() ? findSeedLessonById(id) : null;
  if (seedRow) return { lesson: mapLessonRow(seedRow), source: "seed" };

  return { lesson: null, source };
}

export function invalidateLessonsCache() {
  cachedResult = null;
  cacheTs = 0;
}

/** Alias موحّد — يجلب الدروس والدورات والمحاضرات من مصدر واحد. */
export const getUnifiedLessons = fetchLessons;

export async function getUnifiedActiveLessons() {
  const { active, source } = await fetchLessonsSplit();
  return { lessons: active, source };
}

export async function getUnifiedLessonsSplit() {
  return fetchLessonsSplit();
}

export async function getUnifiedLessonById(id: string) {
  const { lesson, source } = await fetchLessonById(id);
  return { lesson, source };
}

/** بحث في الدروس الموحّدة — ترتيب حسب الصلة. */
export async function searchUnifiedLessons(query: string, limit = 24): Promise<KuwaitLessonRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { lessons } = await getUnifiedLessons();
  return rankLessonsBySearch(lessons, trimmed, limit);
}

/** دروس مشابهة دون جلب القائمة كاملة مرتين. */
export async function fetchRelatedLessons(
  lesson: KuwaitLessonRecord,
  limit = 3,
): Promise<KuwaitLessonRecord[]> {
  const { lessons } = await fetchLessons();
  return lessons
    .filter(
      (candidate) =>
        candidate.id !== lesson.id &&
        (candidate.category === lesson.category ||
          sheikhNameKey(candidate.sheikhName) === sheikhNameKey(lesson.sheikhName) ||
          candidate.region === lesson.region),
    )
    .slice(0, limit);
}

/** دروس نفس الشيخ. */
export async function fetchSameSheikhLessons(
  lesson: KuwaitLessonRecord,
  limit = 4,
): Promise<KuwaitLessonRecord[]> {
  const key = sheikhNameKey(lesson.sheikhName);
  if (!key) return [];
  const { lessons } = await fetchLessons();
  return lessons
    .filter((candidate) => candidate.id !== lesson.id && sheikhNameKey(candidate.sheikhName) === key)
    .slice(0, limit);
}

/** دروس نفس السلسلة/الدورة. */
export async function fetchSeriesLessons(
  lesson: KuwaitLessonRecord,
  limit = 6,
): Promise<KuwaitLessonRecord[]> {
  if (!lesson.courseId && !lesson.linkedLessons?.length) return [];
  const { lessons } = await fetchLessons();
  return lessons
    .filter((candidate) => {
      if (candidate.id === lesson.id) return false;
      if (lesson.courseId && candidate.courseId === lesson.courseId) return true;
      if (lesson.linkedLessons?.length && candidate.linkedLessons?.length) {
        return candidate.title.split("—")[0]?.trim() === lesson.title.split("—")[0]?.trim();
      }
      return false;
    })
    .slice(0, limit);
}

/** تحويل سجل درس موحّد إلى شكل نتائج البحث. */
export function lessonRecordToSearchRow(lesson: KuwaitLessonRecord) {
  return {
    id: lesson.id,
    title: lesson.title,
    speaker_name: lesson.sheikhName.replace(/^الشيخ:\s*/u, ""),
    category: lesson.category,
    mosque: lesson.mosque,
    region: lesson.region,
    city: lesson.governorate,
    sheikhs: { name: lesson.sheikhName.replace(/^الشيخ:\s*/u, ""), photo_url: lesson.sheikhImage },
    keywords: lesson.keywords,
    searchMeta: buildLessonSearchMeta(lesson),
  };
}
