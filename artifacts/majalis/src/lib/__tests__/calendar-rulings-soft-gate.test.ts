/**
 * بوابة: التقويم + بطاقات الأحكام على soft-card بلا ui-card.
 * node --import tsx src/lib/__tests__/calendar-rulings-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const files = [
  "src/views/CalendarPage.tsx",
  "src/components/ui-common.tsx",
  "src/components/rulings/RulingDetailSections.tsx",
] as const;

for (const rel of files) {
  const src = readFileSync(resolve(root, rel), "utf8");
  if (rel.endsWith("ui-common.tsx")) {
    // فقط بطاقة الحكم داخل الملف
    const start = src.indexOf("export function RulingCard");
    assert.ok(start >= 0, "RulingCard موجود");
    const chunk = src.slice(start, start + 800);
    assert.doesNotMatch(chunk, /\bui-card\b/, "RulingCard بلا ui-card");
    assert.match(chunk, /soft-card/, "RulingCard يستخدم soft-card");
    assert.match(chunk, /soft-card--on-light/, "RulingCard على سطح فاتح");
    continue;
  }
  assert.doesNotMatch(src, /\bui-card\b/, `${rel} بلا ui-card`);
  assert.doesNotMatch(src, /\bui-card-btn\b/, `${rel} بلا ui-card-btn`);
  assert.match(src, /soft-card/, `${rel} يستخدم soft-card`);
  assert.match(src, /soft-card--on-light/, `${rel} على سطح فاتح موحّد`);
}

console.log("calendar-rulings-soft-gate.test.ts: ok");
