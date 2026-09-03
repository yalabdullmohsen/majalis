/**
 * بوابة b060: لا تكرار نصي لنفس الذكر داخل نفس التصنيف (adh-361/363/364/366).
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b060-adhkar-dupes-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const seed = readFileSync(resolve(root, "src/lib/adhkar-seed.ts"), "utf8");
const ticker = readFileSync(resolve(root, "src/lib/daily-ticker-dhikr.ts"), "utf8");

for (const id of ["adh-361", "adh-363", "adh-364", "adh-366"]) {
  assert.equal(seed.includes(`id: "${id}"`), false, `أُزيل التكرار الزائد ${id}`);
}

assert.match(seed, /id: "adh-4"/);
assert.match(seed, /id: "adh-21"[\s\S]*?grade: "صحيح"/);
assert.match(seed, /id: "adh-65"[\s\S]*?رواه أبو داود والنسائي/);
assert.equal(ticker.includes("adh-361"), false, "التيكر لا يشير لنسخة ابن السني الزائدة");
assert.match(ticker, /"id": "adh-4"/);

console.log("content-audit-b060-adhkar-dupes-gate.test.ts: ok");
