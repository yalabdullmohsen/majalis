/**
 * Wave 16 — فراغات رسم المعرفة والمساهمات.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave16-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const kg = read("src/views/KnowledgeGraphPage.tsx");
assert.match(kg, /from ["']@\/lib\/ui-copy["']/);
assert.match(kg, /EMPTY\.data/);
assert.match(kg, /EMPTY\.search/);
assert.doesNotMatch(kg, /لا توجد بيانات بعد/);
assert.doesNotMatch(kg, /لا توجد نتائج للوسم/);

const sub = read("src/views/MySubmissionsPage.tsx");
assert.match(sub, /EMPTY\.data/);
assert.doesNotMatch(sub, /لا توجد مساهمات مرتبطة/);

console.log("content-quality-wave16-gate.test.ts: ok");
