/**
 * Wave 18 — فراغات القرآن والدروس والفقه والإشعارات والبحث.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave18-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const pages: Array<[string, RegExp]> = [
  ["src/pages/quran/ui/QuranCirclesView.tsx", /EMPTY\.(searchShort|search)/],
  ["src/pages/quran/ui/SurahIndexView.tsx", /EMPTY\.(bookmarks|searchShort)/],
  ["src/pages/fiqh/ui/FiqhQawaidView.tsx", /EMPTY\.searchShort/],
  ["src/pages/quran/ui/QuranPeopleView.tsx", /EMPTY\.searchShort/],
  ["src/pages/quran/ui/QuranNumbersView.tsx", /EMPTY\.search/],
  ["src/pages/quran/MakkiMadaniPage.tsx", /EMPTY\.(searchShort|search)/],
  ["src/pages/quran/ui/QuranSearchView.tsx", /EMPTY\.searchShort/],
  ["src/pages/lessons/ui/LessonsView.tsx", /EMPTY\.search/],
  ["src/pages/fiqh/ui/RulingsView.tsx", /EMPTY\.(data|search)/],
  ["src/pages/account/ui/NotificationSettingsView.tsx", /EMPTY\.(searchShort|data)/],
  ["src/pages/account/ui/SearchView.tsx", /EMPTY\.search/],
  ["src/pages/hadith/ui/HadithView.tsx", /EMPTY\.(data|search)/],
  ["src/pages/worship/ui/AdhkarView.tsx", /STATUS\.loadError/],
];

for (const [rel, re] of pages) {
  const src = read(rel);
  assert.match(src, /from ["']@\/lib\/ui-copy["']/, `${rel} يستورد ui-copy`);
  assert.match(src, re, `${rel} يستخدم النصوص الموحّدة`);
}

console.log("content-quality-wave18-gate.test.ts: ok");
