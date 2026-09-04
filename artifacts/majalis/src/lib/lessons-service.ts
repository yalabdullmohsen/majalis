/**
 * دالة موحدة لجلب الدروس:
 * 1. المصدر الأساسي: public.lessons في Supabase
 * 2. دمج صفوف catalog/seed غير الموجودة في Supabase (بدون تكرار)
 * 3. Fallback كامل للـ seed عند فراغ الجدول
 */
import { fetchApprovedLessonsFromDb } from "@/lib/supabase";
import { loadLessonsSeed, findSeedLessonById, findSeedLessonByIdAsync } from "@/lib/lessons-seed";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { filterKuwaitOnlyForDisplay } from "@/lib/lesson-kuwait-scope";
import { sheikhNameKey } from "@/lib/sheikh-name";
import {
  dedupeKuwaitLessons,
  isLessonComplete,
  mapLessonRow,
  sortKuwaitLessons,
  splitKuwaitLessons,
} from "@/lib/kuwait-lessons";
import { rankLessonsBySearch, buildLessonSearchMeta } from "@/lib/lesson-search";
import { canonicalizeLessonPublicId } from "@/lib/lesson-id-aliases";

export type LessonsSource = "supabase" | "seed" | "merged";

export type FetchLessonsResult = {
  lessons: KuwaitLessonRecord[];
  source: LessonsSource;
};

let cachedResult: FetchLessonsResult | null = null;
let cacheTs = 0;
const CACHE_MS = 60_000;
const PERSIST_KEY = "majalis-lessons-unified-v1";
/** يمنع نداءين متزامنين لنفس الجلب (مثال: HomeUpcomingLessons وHomeUpcomingCourses
 * يُركَّبان معًا في نفس اللحظة) من إطلاق استعلامَي Supabase مستقلَّين قبل أن
 * يستقر أيّهما — يُشارَك نفس الوعد الجاري بدل تكراره. */
let inFlight: Promise<FetchLessonsResult> | null = null;

async function mergeDbWithSeed(dbRows: KuwaitLessonRecord[]): Promise<KuwaitLessonRecord[]> {
  const seed = await loadLessonsSeed();
  const seedRows = seed.map((row) => mapLessonRow({ ...row, source: "seed" }));
  return dedupeKuwaitLessons([...dbRows, ...seedRows]);
}

function readPersistedLessons(): FetchLessonsResult | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FetchLessonsResult & { savedAt?: number };
    if (!Array.isArray(parsed?.lessons) || parsed.lessons.length === 0) return null;
    return { lessons: parsed.lessons, source: parsed.source || "seed" };
  } catch {
    return null;
  }
}

function writePersistedLessons(result: FetchLessonsResult) {
  try {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ ...result, savedAt: Date.now() }),
    );
  } catch {
    /* quota */
  }
}

/** جلب جميع الدروس المعتمدة — المصدر الموحد للمنصة. */
export async function fetchLessons(options?: { bypassCache?: boolean }): Promise<FetchLessonsResult> {
  const now = Date.now();
  if (!options?.bypassCache && cachedResult && now - cacheTs < CACHE_MS) {
    return cachedResult;
  }

  if (!options?.bypassCache && !cachedResult) {
    const persisted = readPersistedLessons();
    if (persisted) {
      cachedResult = persisted;
      cacheTs = now;
      // تحديث خلفي
      void fetchLessons({ bypassCache: true }).catch(() => undefined);
      return persisted;
    }
  }

  if (!options?.bypassCache && inFlight) {
    return inFlight;
  }

  const run = async (): Promise<FetchLessonsResult> => {
    try {
      const { data } = await fetchApprovedLessonsFromDb();
      if (data.length > 0) {
        const dbMapped = dedupeKuwaitLessons(
          data.map((row) => mapLessonRow({ ...row, source: "supabase" })).filter(isLessonComplete),
        );
        const lessons = sortKuwaitLessons(await mergeDbWithSeed(dbMapped));
        const source: LessonsSource = lessons.length > dbMapped.length ? "merged" : "supabase";
        cachedResult = { lessons, source };
        cacheTs = Date.now();
        writePersistedLessons(cachedResult);
        return cachedResult;
      }
    } catch {
      /* fallback below */
    }

    const seed = await loadLessonsSeed();
    const lessons = dedupeKuwaitLessons(seed.map((row) => mapLessonRow({ ...row, source: "seed" })));
    cachedResult = { lessons: sortKuwaitLessons(lessons), source: "seed" };
    cacheTs = Date.now();
    writePersistedLessons(cachedResult);
    return cachedResult;
  };

  const promise = run();
  if (!options?.bypassCache) inFlight = promise;
  try {
    return await promise;
  } finally {
    if (inFlight === promise) inFlight = null;
  }
}

export async function fetchActiveLessons(): Promise<FetchLessonsResult & { active: KuwaitLessonRecord[] }> {
  const result = await fetchLessons();
  return { ...result, active: splitKuwaitLessons(filterKuwaitOnlyForDisplay(result.lessons)).active };
}

export async function fetchLessonsSplit(): Promise<
  FetchLessonsResult & { active: KuwaitLessonRecord[]; archived: KuwaitLessonRecord[] }
> {
  const result = await fetchLessons();
  const { active, archived } = splitKuwaitLessons(filterKuwaitOnlyForDisplay(result.lessons));
  return { ...result, active, archived };
}

export async function fetchLessonById(id: string): Promise<{
  lesson: KuwaitLessonRecord | null;
  source: LessonsSource;
}> {
  const canonical = canonicalizeLessonPublicId(id) || id;
  const { lessons, source } = await fetchLessons();
  const found = lessons.find((l) => l.id === id || l.id === canonical);
  if (found) return { lesson: found, source };

  const seedRow =
    findSeedLessonById(canonical) ||
    findSeedLessonById(id) ||
    (await findSeedLessonByIdAsync(canonical)) ||
    (await findSeedLessonByIdAsync(id));
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

/** بحث في الدروس الموحّدة — ترتيب حسب الصلة (نطاق الكويت فقط للعرض). */
export async function searchUnifiedLessons(query: string, limit = 24): Promise<KuwaitLessonRecord[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { lessons } = await getUnifiedLessons();
  return rankLessonsBySearch(filterKuwaitOnlyForDisplay(lessons), trimmed, limit);
}

/** دروس مشابهة دون جلب القائمة كاملة مرتين. */
export async function fetchRelatedLessons(
  lesson: KuwaitLessonRecord,
  limit = 3,
): Promise<KuwaitLessonRecord[]> {
  const { lessons } = await fetchLessons();
  return filterKuwaitOnlyForDisplay(lessons)
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
  return filterKuwaitOnlyForDisplay(lessons)
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
