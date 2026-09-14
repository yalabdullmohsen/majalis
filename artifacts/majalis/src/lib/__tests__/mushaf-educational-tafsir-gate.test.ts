/**
 * بوابة التفسير التعليمي — مصادر حقيقية، بلا ازدواجية، منع استجابة قديمة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-educational-tafsir-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const sheet = read("src/features/mushaf-madinah/MushafTafsirSheet.tsx");
const fetchMod = read("src/lib/quran-data/fetch-ayah-content.ts");
const editions = read("src/lib/quran-data/tafsir-editions.ts");
const css = read("src/features/mushaf-madinah/mushaf-madinah.css");

assert.match(sheet, /ar-tafsir-muyassar/);
assert.match(sheet, /ar-tafseer-al-saddi/);
assert.match(sheet, /ar-tafsir-ibn-kathir/);
assert.match(sheet, /fetchGenRef/);
assert.match(sheet, /activeEditionRef/);
assert.match(sheet, /saveMushafTafsirEdition/);
assert.match(sheet, /mushaf-tafsir-body/);
assert.match(sheet, /إعادة المحاولة/);
assert.match(sheet, /لم يتوفر تفسير لهذه الآية حاليًا/);
assert.doesNotMatch(sheet, /BRIEF_CHARS/);
assert.doesNotMatch(sheet, /DEPTH_PREF_KEY/);
assert.doesNotMatch(sheet, />\s*مختصر\s*</);
assert.doesNotMatch(sheet, />\s*مطول\s*</);

assert.match(fetchMod, /wantsMuyassar/);
assert.match(fetchMod, /لا نُرجع نص ميسّر تحت اسم سعدي\/ابن كثير/);
assert.match(editions, /ar-tafsir-muyassar/);
assert.match(editions, /ar-tafseer-al-saddi/);
assert.match(editions, /ar-tafsir-ibn-kathir/);

assert.match(css, /\.mm-tafsir__ed-btn\.is-active/);
assert.match(css, /\.mm-tafsir__body/);
assert.match(css, /\.mm-tafsir__retry/);

console.log("mushaf-educational-tafsir-gate.test.ts: ok");
