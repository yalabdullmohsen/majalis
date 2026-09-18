/**
 * Wave 19 — توحيد «لم يُعثر» وأخطاء التحميل في صفحات التفاصيل.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave19-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/views/DiscoverIslamQuestionDetailPage.tsx", /EMPTY\.data/],
  ["src/views/DiscoverIslamDoubtDetailPage.tsx", /EMPTY\.data/],
  ["src/views/DiscoverIslamArticleDetailPage.tsx", /EMPTY\.data/],
  ["src/views/NewMuslimDayDetailPage.tsx", /EMPTY\.data/],
  ["src/views/ScientificAnnouncementDetailPage.tsx", /EMPTY\.data/],
  ["src/views/SinsAndRightsDetailPage.tsx", /EMPTY\.data/],
  ["src/views/AutoContentDetailPage.tsx", /EMPTY\.data/],
  ["src/pages/lessons/ui/AnnualCourseDetailView.tsx", /EMPTY\.data/],
  ["src/views/NewMuslimPathPage.tsx", /STATUS\.loadError/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.doesNotMatch(src, /Empty text="لم يُعثر/, `${rel} بلا Empty يدوي لـ لم يُعثر`);
  assert.doesNotMatch(src, /Empty text="هذا الموضوع غير متاح/, `${rel} بلا Empty يدوي للموضوع`);
  assert.doesNotMatch(src, /Empty text="المادة غير موجودة/, `${rel} بلا Empty يدوي للمادة`);
  assert.doesNotMatch(src, /Empty text="الدورة غير موجودة/, `${rel} بلا Empty يدوي للدورة`);
  assert.doesNotMatch(src, /Empty text="تعذّر تحميل أيام المسار/, `${rel} بلا Empty يدوي لمسار المسلم الجديد`);
}

console.log("content-quality-wave19-gate.test.ts: ok");
