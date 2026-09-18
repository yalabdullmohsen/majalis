/**
 * Wave 17 — توحيد فراغات العبادة والحديث والتفسير والفوائد.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave17-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/pages/worship/ui/AdhkarView.tsx", /EMPTY\.data/],
  ["src/pages/worship/ui/DuasView.tsx", /EMPTY\.search/],
  ["src/pages/quran/ui/TafsirView.tsx", /EMPTY\.search/],
  ["src/pages/account/ui/FawaidView.tsx", /EMPTY\.(search|data)/],
  ["src/pages/quran/ui/DuasQuranView.tsx", /EMPTY\.search/],
  ["src/pages/hadith/ui/HadithScienceView.tsx", /EMPTY\.search/],
  ["src/pages/account/ui/IslamicGlossaryView.tsx", /EMPTY\.search/],
  ["src/pages/lessons/TeacherDetailPage.tsx", /EMPTY\.data/],
  ["src/pages/library/ui/ReadingPlansView.tsx", /EMPTY\.data/],
  ["src/pages/hadith/ui/ArbaeenNawawiView.tsx", /EMPTY\.(searchShort|search)/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم EMPTY`);
  assert.doesNotMatch(src, /"\{EMPTY\./, `${rel} بلا سلسلة حرفية لـ EMPTY`);
}

console.log("content-quality-wave17-gate.test.ts: ok");
