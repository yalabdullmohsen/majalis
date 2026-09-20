/**
 * بوابة PR-1 لدليل الدروس: عقود + أعلام + محوّل + قواعد خريطة/جدول.
 * Run: node --import tsx src/lib/__tests__/lessons-guide-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(here, "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");
const readRepo = (rel: string) => readFileSync(resolve(repoRoot, rel), "utf8");

assert.ok(existsSync(resolve(majalisRoot, "src/lib/lessons-guide/index.ts")));
assert.ok(existsSync(resolve(repoRoot, "docs/lessons-guide/MIGRATION_PROPOSAL.md")));
assert.ok(existsSync(resolve(repoRoot, "docs/lessons-guide/README.md")));

const flagsSrc = read("src/lib/lessons-guide/flags.ts");
const typesSrc = read("src/lib/lessons-guide/types.ts");
const geoSrc = read("src/lib/lessons-guide/geo.ts");
const mapSrc = read("src/lib/lessons-guide/mapFromLesson.ts");
const pkg = read("package.json");
const mainTsx = read("src/main.tsx");
const appTsx = read("src/App.tsx");
const migration = readRepo("docs/lessons-guide/MIGRATION_PROPOSAL.md");
const readme = readRepo("docs/lessons-guide/README.md");

assert.match(flagsSrc, /lessonsGuideEnabled:\s*false/);
assert.match(flagsSrc, /lessonsGuideMapEnabled:\s*false/);
assert.match(flagsSrc, /lessonsGuideNearbyEnabled:\s*false/);
assert.match(flagsSrc, /lessonsGuideOnboardingEnabled:\s*false/);

assert.match(typesSrc, /ScheduledLessonGuideItem/);
assert.match(typesSrc, /LESSONS_GUIDE_SCHEMA_VERSION\s*=\s*1/);
assert.match(typesSrc, /BLOCKED_DATA/);
assert.match(typesSrc, /mapEligible/);
assert.match(typesSrc, /timelineUpcomingEligible/);

assert.match(geoSrc, /parseExplicitCoordsFromMapsUrl/);
assert.doesNotMatch(geoSrc, /nominatim|google\.maps\.Geocoder|from\(["']@googlemaps/i);

assert.match(mapSrc, /toScheduledLessonGuideItem/);
assert.match(mapSrc, /filterMapPins/);
assert.match(mapSrc, /filterTimelineUpcoming/);
assert.doesNotMatch(mapSrc, /من المسجد النبوي|النبوي|كرسي الدرس/);

assert.match(migration, /لا يُنفَّذ|غير مطبَّق|موافقة المالك/);
assert.match(migration, /BLOCKED_DATA/);
assert.match(readme, /lessonsGuideEnabled/);
assert.match(readme, /BLOCKED_DATA|Feature Flag/);

assert.match(pkg, /test:lessons-guide-pr1/);
assert.doesNotMatch(mainTsx, /lessons-guide/);
assert.doesNotMatch(appTsx, /lessons-guide/);

const {
  resetLessonsGuideFlags,
  getLessonsGuideFlags,
  isLessonsGuideEnabled,
  setLessonsGuideFlagsForTests,
  parseExplicitCoordsFromMapsUrl,
  toScheduledLessonGuideItem,
  filterMapPins,
  filterTimelineUpcoming,
  assessLessonsGuideGeo,
} = await import("../lessons-guide/index.ts");

resetLessonsGuideFlags();
assert.equal(isLessonsGuideEnabled(), false);
assert.equal(getLessonsGuideFlags().lessonsGuideMapEnabled, false);

setLessonsGuideFlagsForTests({ lessonsGuideEnabled: true });
assert.equal(isLessonsGuideEnabled(), true);
resetLessonsGuideFlags();

const coords = parseExplicitCoordsFromMapsUrl(
  "https://maps.google.com/?q=29.283262219859182,47.873629180186754",
);
assert.ok(coords);
assert.ok(Math.abs(coords!.latitude - 29.283262219859182) < 1e-6);

assert.equal(
  parseExplicitCoordsFromMapsUrl(
    "https://www.google.com/maps/search/?api=1&query=%D9%85%D8%B3%D8%AC%D8%AF",
  ),
  null,
);

const base = {
  id: "lesson-test-1",
  title: "درس تجريبي للعقد",
  sheikhName: "شيخ من البيانات",
  governorate: "العاصمة",
  region: "القبلة",
  mosque: "مسجد محلي موثّق",
  day: "السبت",
  time: "بعد المغرب",
  category: "فقه",
  sortKey: 1,
  nextOccurrenceMs: Date.now() + 3600_000,
  activityType: "درس" as const,
  mapsUrl: "https://maps.google.com/?q=29.283262219859182,47.873629180186754",
  source: "seed" as const,
};

const item = toScheduledLessonGuideItem(base);
assert.equal(item.lessonId, "lesson-test-1");
assert.equal(item.mapEligible, true);
assert.equal(item.timelineUpcomingEligible, true);
assert.equal(item.publicationState, "public");
assert.ok(item.latitude && item.longitude);

const noGeo = toScheduledLessonGuideItem({
  ...base,
  id: "lesson-test-2",
  mapsUrl: undefined,
  mosque: "مسجد بلا إحداثيات",
});
assert.equal(noGeo.mapEligible, false);
assert.equal(noGeo.latitude, undefined);

const noSchedule = toScheduledLessonGuideItem({
  ...base,
  id: "lesson-test-3",
  day: "",
  time: "",
  nextOccurrenceMs: 0,
});
assert.equal(noSchedule.timelineUpcomingEligible, false);

assert.equal(filterMapPins([item, noGeo]).length, 1);
assert.ok(filterTimelineUpcoming([item, noSchedule]).some((x) => x.lessonId === "lesson-test-1"));

const report = assessLessonsGuideGeo([noGeo]);
assert.equal(report.capability, "BLOCKED_DATA");
assert.equal(report.hasDedicatedCoordinatesColumn, false);

const partial = assessLessonsGuideGeo([item]);
assert.equal(partial.capability, "partial_url_coords");

console.log("lessons-guide-pr1-gate.test.ts: ok");
