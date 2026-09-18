/**
 * Wave 13 — توحيد رسائل الفراغ العامة عبر EMPTY في ui-copy.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave13-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const uiCopy = read("src/lib/ui-copy.ts");
assert.match(uiCopy, /EMPTY\s*=/, "مصدر نصوص الفراغ");
assert.doesNotMatch(uiCopy, /قريبًا/, "ui-copy بلا «قريبًا»");
assert.doesNotMatch(uiCopy, /continueWhereLeft/, "ACTION بلا مفاتيح ميتة");

const pages: Array<[string, RegExp]> = [
  ["src/views/VaultPage.tsx", /EMPTY\.(searchShort|bookmarks|downloads|citations|continueEmpty)/],
  ["src/views/KnowledgeSectionPage.tsx", /EMPTY\.(search|data)/],
  ["src/views/SeerahPage.tsx", /EMPTY\.search/],
  ["src/views/AsmaaHusnaPage.tsx", /EMPTY\.search/],
  ["src/views/AkhlaqPage.tsx", /EMPTY\.search/],
  ["src/views/IslamicSectsPage.tsx", /EMPTY\.searchShort/],
  ["src/views/TarikhIslamiPage.tsx", /EMPTY\.search/],
  ["src/views/TopicsIndexPage.tsx", /EMPTY\.search/],
  ["src/views/UniversitiesPage.tsx", /EMPTY\.search/],
  ["src/views/IslamicLandmarksPage.tsx", /EMPTY\.search/],
  ["src/views/OccasionsPage.tsx", /EMPTY\.data/],
  ["src/views/QaPage.tsx", /EMPTY\.(search|data)/],
  ["src/views/IslamicStoriesPage.tsx", /EMPTY\.(data|search|generic)/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم EMPTY الموحّد`);
  assert.doesNotMatch(src, /لا نتائج للبحث\./, `${rel} بلا عبارة بحث مكرّرة يدويًا`);
}

console.log("content-quality-wave13-gate.test.ts: ok");
