/**
 * Unit tests for lessons Clean Architecture use case `loadLessonDetail`.
 */
import assert from "node:assert/strict";
import { loadLessonDetail } from "../load-lesson-detail.ts";
import type {
  LessonCatalogPort,
  LessonEngagementPort,
  LessonsRepository,
  SheikhsLookupPort,
} from "../../domain/ports.ts";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function baseLesson(overrides: Partial<KuwaitLessonRecord> = {}): KuwaitLessonRecord {
  return {
    id: "kw-1",
    title: "درس التوحيد",
    sheikhName: "أحمد",
    category: "عقيدة",
    region: "العاصمة",
    governorate: "العاصمة",
    mosque: "مسجد",
    day: "الأحد",
    time: "20:00",
    keywords: [],
    sortKey: 1,
    nextOccurrenceMs: Date.now(),
    activityType: "درس",
    ...overrides,
  };
}

function makeDeps(opts?: {
  catalogLesson?: KuwaitLessonRecord | null;
  dbLesson?: LessonsRepository extends { getById: (id: string) => Promise<infer R> } ? R["lesson"] : never;
}) {
  const catalogLesson = opts && "catalogLesson" in opts ? opts.catalogLesson : baseLesson();
  const catalog: LessonCatalogPort = {
    async getById() {
      return { lesson: catalogLesson ?? null, source: "seed" };
    },
    async fetchRelated() {
      return [baseLesson({ id: "kw-related", title: "درس مرتبط" })];
    },
    async fetchSameSheikh() {
      return [baseLesson({ id: "kw-same", title: "نفس الشيخ" })];
    },
    async fetchSeries() {
      return [baseLesson({ id: "kw-series", title: "نفس السلسلة" })];
    },
  };

  const lessonsRepo: LessonsRepository = {
    async getById() {
      return {
        lesson: opts?.dbLesson ?? null,
        error: null,
        usingSeed: false,
      };
    },
  };

  const engagement: LessonEngagementPort = {
    async fetchStats() {
      return { views: 10, saves: 2, shares: 1 };
    },
  };

  const sheikhs: SheikhsLookupPort = {
    async list() {
      return { data: [{ name: "أحمد", bio: "سيرة الشيخ" }] };
    },
  };

  return { catalog, lessonsRepo, engagement, sheikhs };
}

{
  const result = await loadLessonDetail(makeDeps(), undefined, baseLesson({ id: "initial" }));
  assert.equal(result.kuwaitLesson?.id, "initial");
  assert.equal(result.dbLesson, null);
  assert.equal(result.similar.length, 1);
  assert.equal(result.stats.views, 10);
  assert.equal(result.sheikhBio, "سيرة الشيخ");
}

{
  const result = await loadLessonDetail(makeDeps({ catalogLesson: baseLesson({ id: "from-catalog" }) }), "from-catalog");
  assert.equal(result.kuwaitLesson?.id, "from-catalog");
  assert.equal(result.sameSheikh[0]?.id, "kw-same");
  assert.equal(result.seriesLessons[0]?.id, "kw-series");
}

{
  const result = await loadLessonDetail(
    makeDeps({
      catalogLesson: null,
      dbLesson: {
        id: "db-1",
        title: "درس من القاعدة",
        speaker_name: "أحمد",
      },
    }),
    "db-1",
  );
  assert.equal(result.kuwaitLesson, null);
  assert.equal(result.dbLesson?.id, "db-1");
  assert.equal(result.similar.length, 1);
  assert.equal(result.sheikhBio, "سيرة الشيخ");
}

{
  const result = await loadLessonDetail(makeDeps({ catalogLesson: null, dbLesson: null }), "missing");
  assert.equal(result.kuwaitLesson, null);
  assert.equal(result.dbLesson, null);
  assert.equal(result.similar.length, 0);
}

{
  const result = await loadLessonDetail(makeDeps(), undefined, null);
  assert.equal(result.kuwaitLesson, null);
  assert.equal(result.dbLesson, null);
}

console.log("load-lesson-detail: ok");
