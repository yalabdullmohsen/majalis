/**
 * Wave 21 — تلميع SEO المتبقي + فراغات الحديث/القرآن/القصص.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave21-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/views/AutoContentDetailPage.tsx", /غير متاحة في الفهرس العام/],
  ["src/views/SinsAndRightsDetailPage.tsx", /غير متاح في الفهرس العام/],
  ["src/pages/lessons/ui/AnnualCourseDetailView.tsx", /غير متاحة في الفهرس العام/],
  ["src/pages/hadith/ui/HadithByIdView.tsx", /EMPTY\.data/],
  ["src/pages/quran/ui/QuranTajweedView.tsx", /EMPTY\.data/],
  ["src/pages/quran/RevelationOrderPage.tsx", /STATUS\.networkError/],
  ["src/pages/quran/ui/SurahIndexView.tsx", /STATUS\.networkError/],
  ["src/views/IslamicStoriesPage.tsx", /STATUS\.loadError/],
  ["src/pages/fiqh/ui/RulingsView.tsx", /STATUS\.loadError/],
  ["src/pages/hadith/ui/HadithBooksView.tsx", /STATUS\.networkError/],
  ["src/pages/quran/ui/QuranSearchView.tsx", /STATUS\.loadError/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.doesNotMatch(src, /description:\s*"لم يُعثر/, `${rel} بلا وصف SEO يدوي لـ لم يُعثر`);
  assert.ok(!src.includes("الباب غير موجود."), `${rel} بلا باب تجويد يدوي`);
  assert.ok(!src.includes("لم يُعثر على الحديث في المصادر"), `${rel} بلا حديث يدوي`);
}

console.log("content-quality-wave21-gate.test.ts: ok");
