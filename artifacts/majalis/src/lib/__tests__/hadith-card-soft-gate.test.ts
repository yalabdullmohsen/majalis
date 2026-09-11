/**
 * بوابة: بطاقة الحديث على soft-card بلا ui-card.
 * node --import tsx src/lib/__tests__/hadith-card-soft-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(resolve(root, "src/components/hadith/HadithCard.tsx"), "utf8");

assert.doesNotMatch(src, /\bui-card\b/, "HadithCard بلا ui-card");
assert.doesNotMatch(src, /\bmj-card\b/, "HadithCard بلا mj-card");
assert.match(src, /soft-card/, "HadithCard يستخدم soft-card");
assert.match(src, /soft-card--on-light/, "HadithCard على سطح فاتح موحّد");
assert.match(src, /hadith-card/, "صنف الدومين hadith-card باقٍ للتخطيط");

console.log("hadith-card-soft-gate.test.ts: ok");
