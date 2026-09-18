/**
 * Wave 23 — أخطاء البحث والجامعات والتواصل والإعدادات.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave23-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/pages/account/ui/SearchView.tsx", /STATUS\.loadError/],
  ["src/views/UniversitiesPage.tsx", /STATUS\.networkError/],
  ["src/views/DiscoverIslamContactPage.tsx", /STATUS\.networkError/],
  ["src/pages/account/ui/SettingsView.tsx", /STATUS\.loadError/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.ok(!src.includes("تعذّر إكمال البحث"), `${rel} بلا خطأ بحث يدوي`);
  assert.ok(!src.includes("تعذّر مزامنة دليل الجامعات الآن"), `${rel} بلا خطأ جامعات يدوي`);
  assert.ok(!src.includes("تعذّر إرسال الطلب، حاول مجددًا"), `${rel} بلا خطأ تواصل يدوي`);
  assert.ok(!src.includes("تعذّر تحديث النسخة. حاول مرة أخرى"), `${rel} بلا خطأ إعدادات يدوي`);
}

console.log("content-quality-wave23-gate.test.ts: ok");
