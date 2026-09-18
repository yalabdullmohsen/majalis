/**
 * Gate: lesson detail loads primary before related/stats/bio (no full waterfall).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessonPrimary, enrichLessonDetail, loadLessonDetail } from "../../features/lessons/application/load-lesson-detail.ts";
import type {
  LessonCatalogPort,
  LessonEngagementPort,
  LessonsRepository,
  SheikhsLookupPort,
} from "../../features/lessons/domain/ports.ts";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const view = readFileSync(resolve(root, "src/pages/lessons/ui/LessonDetailView.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/features/lessons/application/load-lesson-detail.ts"), "utf8");

assert.match(view, /loadLessonPrimary/, "التفاصيل تستدعي primary أولًا");
assert.match(view, /enrichLessonDetail/, "التفاصيل تثري لاحقًا");
assert.match(view, /takeStashedLesson|peekCachedLessonById/, "قشرة فورية من الذاكرة/التخزين");
assert.match(app, /export async function loadLessonPrimary/);
assert.doesNotMatch(
  app.slice(app.indexOf("export async function loadLessonPrimary"), app.indexOf("export async function loadLessonDetail")),
  /sheikhs\.(list|findByName)\(/,
  "primary لا ينتظر قائمة/بحث المشايخ",
);
assert.match(app, /sheikhs\.findByName\(/, "السيرة عبر findByName موجَّه");
assert.doesNotMatch(
  app.slice(app.indexOf("export async function resolveSheikhBio"), app.indexOf("function emptyPrimary")),
  /sheikhs\.list\(/,
  "resolveSheikhBio لا يستدعي list() — منع تراجع overfetch",
);

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

function makeDeps() {
  let listCalls = 0;
  let findCalls = 0;
  let relatedCalls = 0;
  const catalog: LessonCatalogPort = {
    async getById() {
      await new Promise((r) => setTimeout(r, 5));
      return { lesson: baseLesson(), source: "seed" };
    },
    async fetchRelated() {
      relatedCalls += 1;
      await new Promise((r) => setTimeout(r, 40));
      return [baseLesson({ id: "kw-related" })];
    },
    async fetchSameSheikh() {
      await new Promise((r) => setTimeout(r, 40));
      return [];
    },
    async fetchSeries() {
      await new Promise((r) => setTimeout(r, 40));
      return [];
    },
  };
  const lessonsRepo: LessonsRepository = {
    async getById() {
      return { lesson: null, error: null, usingSeed: false };
    },
  };
  const engagement: LessonEngagementPort = {
    async fetchStats() {
      await new Promise((r) => setTimeout(r, 40));
      return { views: 1, saves: 0, shares: 0 };
    },
  };
  const sheikhs: SheikhsLookupPort = {
    async list() {
      listCalls += 1;
      await new Promise((r) => setTimeout(r, 50));
      return { data: [{ name: "أحمد", bio: "سيرة" }] };
    },
    async findByName(name) {
      findCalls += 1;
      await new Promise((r) => setTimeout(r, 5));
      if (name === "أحمد") return { name: "أحمد", bio: "سيرة" };
      return null;
    },
  };
  return {
    deps: { catalog, lessonsRepo, engagement, sheikhs },
    counters: {
      get listCalls() { return listCalls; },
      get findCalls() { return findCalls; },
      get relatedCalls() { return relatedCalls; },
    },
  };
}

{
  const { deps, counters } = makeDeps();
  const t0 = performance.now();
  const primary = await loadLessonPrimary(deps, "kw-1");
  const primaryMs = performance.now() - t0;
  assert.equal(primary.kuwaitLesson?.id, "kw-1");
  assert.equal(counters.listCalls, 0, "primary بلا sheikhs.list");
  assert.equal(counters.relatedCalls, 0, "primary بلا related");

  const t1 = performance.now();
  const extras = await enrichLessonDetail(primary.kuwaitLesson!, deps);
  const enrichMs = performance.now() - t1;
  assert.ok(extras.similar.length >= 1);
  assert.ok(primaryMs < enrichMs, `primary (${primaryMs.toFixed(1)}ms) أسرع من enrich (${enrichMs.toFixed(1)}ms)`);
  console.log(`lesson-detail-progressive: primary=${primaryMs.toFixed(1)}ms enrich=${enrichMs.toFixed(1)}ms`);
}

{
  const { deps, counters } = makeDeps();
  const full = await loadLessonDetail(deps, "kw-1");
  assert.equal(full.kuwaitLesson?.id, "kw-1");
  assert.equal(full.sheikhBio, "سيرة");
  assert.equal(counters.listCalls, 0, "التفاصيل الكاملة بلا sheikhs.list");
  assert.ok(counters.findCalls >= 1, "السيرة عبر findByName");
}

console.log("lesson-detail-progressive-gate: ok");
