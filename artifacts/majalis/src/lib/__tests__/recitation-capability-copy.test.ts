/**
 * وصف اختبار التلاوة يجب أن يطابق القدرات الفعلية (مطابقة كلمات ≠ مخارج كاملة).
 * node --import tsx src/lib/__tests__/recitation-capability-copy.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const view = readFileSync(resolve(root, "src/pages/quran/ui/RecitationTestView.tsx"), "utf8");
const privacy = readFileSync(resolve(root, "src/views/PrivacyPage.tsx"), "utf8");

assert.match(view, /مطابقة الكلمات/, "الوصف يذكر مطابقة الكلمات");
assert.match(view, /إغفال|زيادة|ترتيب/, "يذكر أنواع أخطاء النص");
assert.match(view, /ليست تحليلاً لمخارج أو صفات كامل/, "لا يوهم بمخارج كاملة");
assert.doesNotMatch(
  view,
  /description:\s*"[^"]*تصحيح فوري[^"]*تجويد[^"]*مخارج/,
  "لا يخلط تصحيح فوري بادعاء مخارج",
);

assert.match(privacy, /مطابقة كلمات|حفظ\/مطابقة/);
assert.match(privacy, /وليست\s+تحليل مخارج أو صفات كامل/);

const engine = readFileSync(resolve(root, "src/lib/recitation-ai/error-detector.ts"), "utf8");
assert.match(engine, /omission|addition|substitution|order|إغفال|زيادة|استبدال|ترتيب/i);

console.log(
  JSON.stringify(
    {
      measures: ["word matching", "omission", "addition", "word order (when available)", "pronunciation confidence score", "optional tajweed timing notes"],
      doesNotClaim: ["full makharij analysis", "complete tajweed grading as primary mode"],
    },
    null,
    2,
  ),
);
console.log("recitation-capability-copy: OK");
