/**
 * بوابة: CSS غير الحرج يُحمَّل بعد load لا فور تقييم main.
 * تشغيل: node --import tsx src/lib/__tests__/css-decompose-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");

assert.match(main, /function loadNonCriticalCss/, "دالة CSS غير الحرج");
assert.match(main, /scheduleNonCriticalCss/, "جدولة بعد idle");
assert.match(main, /addEventListener\("load", scheduleNonCriticalCss/, "بعد حدث load");
assert.match(main, /import\("\.\/styles\/design-system\.css"\)/, "design-system ما زال يُحمَّل (مؤجّل)");
assert.doesNotMatch(
  main,
  /^void import\("\.\/styles\/design-system\.css"\)/m,
  "لا void import فوري لـ design-system",
);

console.log("css-decompose-gate.test.ts: ok");
