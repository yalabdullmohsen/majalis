/**
 * Wave 20 — توحيد فراغات/أخطاء صفحات التفاصيل العامة.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave20-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/views/CitationPublicPage.tsx", /EMPTY\.data/],
  ["src/views/TarikhIslamiDetailPage.tsx", /EMPTY\.data/],
  ["src/views/UniversityDetailPage.tsx", /EMPTY\.data/],
  ["src/views/learning/LearningPathDetailPage.tsx", /EMPTY\.data/],
  ["src/pages/competitions/ui/CompetitionDetailView.tsx", /EMPTY\.data/],
  ["src/pages/fiqh/ui/RulingDetailView.tsx", /STATUS\.loadError/],
  ["src/views/CalendarPage.tsx", /STATUS\.loadError/],
  ["src/views/MiraclesPage.tsx", /EMPTY\.data/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.doesNotMatch(src, /description:\s*"لم يُعثر/, `${rel} بلا وصف SEO يدوي لـ لم يُعثر`);
  assert.doesNotMatch(src, /subtitle="لم يُعثر/, `${rel} بلا subtitle يدوي لـ لم يُعثر`);
  assert.ok(!src.includes('role="status">لم يُعثر'), `${rel} بلا نص مسابقة يدوي`);
  assert.doesNotMatch(src, /ErrorState text="تعذّر/, `${rel} بلا ErrorState يدوي`);
  assert.ok(!src.includes("المسار غير موجود."), `${rel} بلا مسار يدوي`);
}

console.log("content-quality-wave20-gate.test.ts: ok");
