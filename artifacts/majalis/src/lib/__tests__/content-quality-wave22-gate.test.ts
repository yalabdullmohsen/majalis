/**
 * Wave 22 — أخطاء التحميل في الحفظ والمتشابهات ورسم المعرفة.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave22-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/pages/quran/ui/QuranMemorizationView.tsx", /STATUS\.(loadError|networkError)/],
  ["src/views/MutashabihatPage.tsx", /STATUS\.loadError/],
  ["src/views/KnowledgeGraphPage.tsx", /STATUS\.loadError/],
  ["src/pages/library/ui/ReadingPlansView.tsx", /خطط قراءة ومتابعة تقدّمك في الكتب/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.ok(!src.includes("تعذّر تحميل قائمة السور"), `${rel} بلا خطأ سور يدوي`);
  assert.ok(!src.includes("تعذّر تحميل أسئلة الاختبار"), `${rel} بلا خطأ اختبار يدوي`);
  assert.ok(!src.includes("تعذّر تحميل الآية"), `${rel} بلا خطأ آية يدوي`);
  assert.ok(!src.includes("تعذّر تحميل الرسم الآن"), `${rel} بلا خطأ رسم يدوي`);
}

console.log("content-quality-wave22-gate.test.ts: ok");
