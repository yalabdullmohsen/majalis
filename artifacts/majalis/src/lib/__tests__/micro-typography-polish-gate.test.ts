/**
 * بوابة صقل الطباعة المصغّر: تشكيل، أرقام، virtualization، بحث عامل، بلا كشيدة.
 * تشغيل: node --import tsx src/lib/__tests__/micro-typography-polish-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p: string) => readFileSync(resolve(appRoot, p), "utf8");

const mushaf = read("features/mushaf-madinah/mushaf-madinah.css");
assert.match(mushaf, /font-synthesis:\s*none/);
assert.match(mushaf, /hyphens:\s*none/);
assert.match(mushaf, /letter-spacing:\s*0/);
assert.match(mushaf, /\.mm-ayah-hit--end[\s\S]*?overflow:\s*visible/);

const fontsQ = read("styles/fonts-quran.css");
assert.match(fontsQ, /font-synthesis:\s*none/);
assert.match(fontsQ, /"liga" 1,\s*"calt" 1/);

const quran = read("styles/quran.css");
assert.match(quran, /\.qs-mushaf-body\s*\{[^}]*text-align:\s*start/s);
assert.doesNotMatch(quran, /\.qs-mushaf-body\s*\{[^}]*text-align:\s*justify/s);

const prefs = read("lib/user-preferences.ts");
assert.match(prefs, /dataset\.numerals/);

const settings = read("pages/account/ui/SettingsView.tsx");
assert.match(settings, /numeralSystem/);
assert.match(settings, /عربية مشرقية/);

const controls = read("features/mushaf-madinah/MushafControls.tsx");
assert.match(controls, /useNumerals/);
assert.match(controls, /fmt\(pageNumber\)/);

const verseList = read("components/quran/QuranVerseList.tsx");
assert.match(verseList, /VirtualList/);
assert.match(verseList, /memo\(function VerseRow/);
assert.match(verseList, /virtualizeAbove=\{36\}/);

const search = read("lib/quran-search-verses.ts");
assert.match(search, /quran-verse-search\.worker/);
assert.match(search, /requestIdleCallback/);
assert.match(search, /searchVersesViaWorker/);

assert.ok(existsSync(resolve(appRoot, "lib/quran-verse-search.worker.ts")));

const immersive = read("styles/quran-immersive-reader.css");
assert.match(immersive, /\.quran-verse-list__text[\s\S]*?font-synthesis:\s*none/);

console.log("micro-typography-polish-gate: OK");
