/**
 * دالة موحدة لجلب الدروس:
 * 1. المصدر الأساسي: public.lessons في Supabase
 * 2. دمج صفوف catalog/seed غير الموجودة في Supabase (بدون تكرار)
 * 3. Fallback كامل للـ seed عند فراغ الجدول
 */
import { fetchApprovedLessonsFromDb } from "@/lib/supabase";
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

/** @deprecated استخدم getUnifiedActiveLessons */
export async function loadKuwaitLessons() {
  const { lessons } = await getUnifiedActiveLessons();
  return lessons;
}

/** @deprecated استخدم getUnifiedLessonsSplit */
export async function loadAllKuwaitLessonsSplit() {
  const { active, archived, source } = await getUnifiedLessonsSplit();
  return { active, archived, source };
}

/** @deprecated استخدم getUnifiedLessonById */
export async function getKuwaitLessonById(id: string) {
  const { lesson } = await getUnifiedLessonById(id);
  return lesson;
}
