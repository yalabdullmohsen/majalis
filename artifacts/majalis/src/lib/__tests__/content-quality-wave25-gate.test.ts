/**
 * Wave 25 — إعجاز وإشعارات وورد يومي وخصوصية التصدير.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave25-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/views/MiraclesPage.tsx", /EMPTY\.data/],
  ["src/pages/account/ui/NotificationSettingsView.tsx", /STATUS\.loadError/],
  ["src/pages/worship/ui/DailyWirdView.tsx", /STATUS\.loadError/],
  ["src/views/PrivacyCenterPage.tsx", /STATUS\.loadError/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النص الموحّد`);
  assert.ok(!src.includes("الموضوع غير موجود أو غير معتمد للعرض"), `${rel} بلا خطأ إعجاز يدوي`);
  assert.ok(!src.includes("هذا الموضوع قيد المراجعة وغير ظاهر للعامة"), `${rel} بلا مراجعة إعجاز يدوية`);
  assert.ok(!src.includes("فشل الإرسال"), `${rel} بلا فشل إرسال يدوي`);
  assert.ok(!src.includes("تعذّرت جدولة التذكير"), `${rel} بلا جدولة ورد يدوية`);
  assert.ok(!src.includes("فشل التصدير"), `${rel} بلا فشل تصدير يدوي`);
}

console.log("content-quality-wave25-gate.test.ts: ok");
