/**
 * بوابة: مسارات جلب الأحكام بدون شلال await + بلا select('*').
 * تشغيل: node --import tsx src/lib/__tests__/fetch-parallel-select-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const rulings = read("src/lib/rulings-service.ts");
assert.match(rulings, /RULING_DETAIL_COLUMNS/, "أعمدة صريحة للأحكام");
assert.match(
  rulings,
  /resolveRulingByIdentifier[\s\S]*Promise\.all\(/,
  "جلب id/key/slug بالتوازي",
);
assert.doesNotMatch(
  rulings,
  /resolveRulingByIdentifier[\s\S]{0,900}\.select\("\*"\)/,
  "resolveRuling بلا select(*)",
);

const lessonStats = read("src/lib/lesson-stats.ts");
assert.match(lessonStats, /select\("id",\s*\{\s*count:\s*"exact"/, "عدّ المشاهدات بلا *");
assert.match(lessonStats, /Promise\.all\(\[viewsPromise,\s*savesPromise\]\)/, "مشاهدات/حفظ متوازي");

const supabase = read("src/lib/supabase.ts");
assert.match(supabase, /LESSON_DETAIL_COLUMNS/, "تفصيل الدرس بأعمدة صريحة");
assert.match(supabase, /getLessonById[\s\S]*LESSON_DETAIL_COLUMNS/, "getLessonById بلا *");

const fawaid = read("src/pages/account/ui/FawaidView.tsx");
assert.match(fawaid, /FAWAID_PAGE_SIZE/, "ترقيم واجهة الفوائد");
assert.match(fawaid, /IntersectionObserver/, "تمرير لانهائي للفوائد");
assert.match(fawaid, /ensureFawaidLoaded/, "رسم فوري من بذرة الفوائد");
assert.match(fawaid, /sunnah\.fawaid\.list\.v1|FAWAID_SESSION_CACHE_KEY/, "كاش جلسة للفوائد");
assert.doesNotMatch(fawaid, /setLoading\(true\)/, "لا إعادة هيكل عند الدخول");
assert.doesNotMatch(fawaid, /Date\.now\(\)/, "خلط ثابت بلا Date.now على كل hydrate");

const getFawaid = supabase.match(/export async function getApprovedFawaid\(\) \{[\s\S]*?\nexport async function/);
assert.ok(getFawaid, "دالة getApprovedFawaid موجودة");
assert.match(getFawaid![0], /Promise\.all\(\[seedPromise,\s*resultPromise\]\)/, "بذرة وشبكة بالتوازي");
assert.doesNotMatch(getFawaid![0], /await loadSeedData\(/, "بلا انتظار seed-loader الكامل");
assert.match(getFawaid![0], /ensureFawaidLoaded/, "بذرة فوائد فقط");

const prefetch = read("src/lib/prefetch-route.ts");
assert.match(prefetch, /"\/fawaid"/, "تسخين مسار الفوائد");
assert.match(prefetch, /ensureFawaidLoaded/, "تسخين بذرة الفوائد مع الصفحة");

console.log("fetch-parallel-select-gate.test.ts: ok");
