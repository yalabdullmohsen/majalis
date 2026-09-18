/**
 * Wave 24 — رسائل الخصوصية والبحث العلمي والبلاغات.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave24-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/views/PrivacyCenterPage.tsx", /STATUS\.loadError/],
  ["src/views/ResearchDetailPage.tsx", /STATUS\.loadError/],
  ["src/pages/library/ui/ScholarlyResearchView.tsx", /EMPTY\.search/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.ok(!src.includes("تعذّر التصدير"), `${rel} بلا خطأ تصدير يدوي`);
  assert.ok(!src.includes("تعذّر حفظ البلاغ محليًا"), `${rel} بلا خطأ بلاغ يدوي`);
  assert.ok(!src.includes("لا توجد نتائج بحث للحفظ"), `${rel} بلا فراغ حفظ يدوي`);
  assert.ok(!src.includes("فشل الحفظ"), `${rel} بلا فشل حفظ يدوي`);
}

console.log("content-quality-wave24-gate.test.ts: ok");
