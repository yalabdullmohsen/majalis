/**
 * Content quality Wave 8 — lessons / series / scholars remaining gaps.
 * Run: node --import tsx src/lib/__tests__/content-quality-wave8-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeHarvestCard, type HarvestFeedCard } from "../harvest-feed";
import {
  cleanAnnualCourseSummary,
  cleanLessonPublicText,
  truncateAtWord,
} from "../content-display-polish";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== lesson public text strips phones/handles ===");
{
  const cleaned = cleanLessonPublicText(
    "حضوري — للتسجيل: @jouryaldahi (إنستقرام) أو 66240438 ثم الحضور",
  );
  assert.doesNotMatch(cleaned, /@jouryaldahi/);
  assert.doesNotMatch(cleaned, /66240438/);
  assert.match(cleaned, /حضوري/);
}

console.log("=== harvest drops ellipsis-truncated titles ===");
{
  const card: HarvestFeedCard = {
    id: "t",
    type: "درس",
    title_ar: "ندعوكم اليوم لحضور الدورة العلمية …",
    summary_ar: "ملخص كافٍ للعرض العام في بطاقة الحصاد.",
    sheikh: "ة مريم مندكار",
    place: "مسجد الياقوت",
    audience: "عام",
    starts_at: null,
    time_text: null,
    register_url: null,
    sources: [],
    image_url: null,
    published_at: "2026-01-01T00:00:00.000Z",
    confidence: 0.9,
  };
  assert.equal(sanitizeHarvestCard(card), null);
}

console.log("=== learn series redirect documented (entry budget) ===");
{
  const routes = read("src/AppRoutes.tsx");
  assert.match(routes, /path="\/learn\/series\/:slug"/);
  assert.match(routes, /Redirect to="\/lessons"/);
}

console.log("=== annual course summary strip ===");
{
  const s = cleanAnnualCourseSummary(
    "برنامج علمي للمقارنة. **عن الدورة:** برنامج علمي لمقارنة، عن الدورة: بقية مقطوعة.",
  );
  assert.doesNotMatch(s, /\*\*عن الدورة/);
  assert.doesNotMatch(s, /عن الدورة:/);
  assert.match(s, /برنامج علمي للمقارنة/);
}

console.log("=== SEO truncate at word ===");
{
  const t = truncateAtWord("كلمة أولى كلمة ثانية كلمة ثالثة طويلة جداً هنا", 20);
  assert.ok(t.endsWith("…"));
  assert.doesNotMatch(t, /كلم$/);
}

console.log("=== report button subject without raw id ===");
{
  const btn = read("src/components/ContentReportButton.tsx");
  assert.doesNotMatch(btn, /#\$\{contentId\}/);
  assert.match(btn, /معرّف المحتوى/);
}

console.log("=== scholar empty sections guarded ===");
{
  const page = read("src/pages/scholars/ScholarProfilePage.tsx");
  assert.match(page, /profile\.works\.length > 0/);
  assert.match(page, /truncateAtWord/);
}

console.log("=== public lesson data without contact handles ===");
{
  const chunk = read("public/data/lessons/chunk-000.json");
  assert.doesNotMatch(chunk, /66240438/);
  assert.doesNotMatch(chunk, /jouryaldahi/);
  const ads = read("src/lib/lesson-ads.ts");
  assert.doesNotMatch(ads, /66240438/);
  assert.doesNotMatch(ads, /jouryaldahi/);
}

console.log("content-quality-wave8-gate: ok");
