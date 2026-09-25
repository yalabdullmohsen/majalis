/**
 * بوابة شيت التفسير + إلغاء التحديد.
 * Run: node --import tsx src/lib/__tests__/mushaf-tafsir-selection-rebuild-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearAyahSelection,
  getMushafSelectionState,
  getSelectedVerseKey,
  isAyahSelected,
  selectAyah,
  __resetMushafSelectionForTests,
} from "../../features/mushaf-reader/mushaf-selection-controller";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const sheet = read("src/features/mushaf-madinah/MushafTafsirSheet.tsx");
const shell = read("src/features/mushaf-madinah/quran-sheet/QuranSheetShell.tsx");
const menu = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
const tokens = read("src/features/mushaf-madinah/mushaf-tafsir-sheet.css");
const controller = read("src/features/mushaf-reader/mushaf-selection-controller.ts");

assert.match(controller, /export function selectAyah/);
assert.match(controller, /export function clearAyahSelection/);
assert.match(controller, /export function isAyahSelected/);
assert.match(controller, /kind: "NONE"/);
assert.match(controller, /kind: "SELECTED"/);

__resetMushafSelectionForTests();
assert.equal(getMushafSelectionState().kind, "NONE");
selectAyah({ surahNumber: 2, ayahNumber: 30, pageNumber: 6 });
assert.equal(getSelectedVerseKey(), "2:30");
assert.equal(isAyahSelected({ surahNumber: 2, ayahNumber: 30, pageNumber: 6 }), true);
assert.equal(isAyahSelected({ surahNumber: 1, ayahNumber: 1, pageNumber: 1 }), false);
clearAyahSelection();
assert.equal(getMushafSelectionState().kind, "NONE");
assert.equal(getSelectedVerseKey(), null);

assert.match(reader, /clearAyahSelection/);
assert.match(reader, /selectAyah/);
assert.match(reader, /closeTafsir/);
assert.match(reader, /onClearSelection=\{clearSelection\}/);
/* إغلاق التفسير يمسح التحديد */
const closeIdx = reader.indexOf("const closeTafsir");
const closeBlock = reader.slice(closeIdx, closeIdx + 550);
assert.match(closeBlock, /clearAyahSelection\(\)/);
assert.match(closeBlock, /setSelectedVerseKey\(null\)/);
/* لا حجب مسح التحديد أثناء التشغيل */
assert.doesNotMatch(
  reader.slice(reader.indexOf("const clearSelection"), reader.indexOf("const clearSelection") + 350),
  /playerState === "playing"/,
);

assert.match(menu, /إلغاء التحديد/);
assert.match(menu, /nm-verse-clear-selection/);
assert.match(menu, /onClearSelection/);

assert.match(sheet, /تفسير الآية/);
assert.match(sheet, /سورة \$\{surahName\}، الآية \$\{parsed\.ayah\}/);
assert.match(sheet, /mm-tafsir__ayah-preview/);
assert.match(sheet, /mm-tafsir__skeleton/);
assert.match(sheet, /closeAriaLabel="إغلاق التفسير وإلغاء تحديد الآية"/);
assert.match(sheet, /fetchGenRef/);
assert.match(sheet, /ac\.abort/);
assert.doesNotMatch(sheet, /تحديث المصدر/);
assert.doesNotMatch(sheet, /2:30/);
assert.doesNotMatch(sheet, /duration|readingTime/i);

assert.match(shell, /Escape/);
assert.match(shell, /closeAriaLabel/);

assert.match(tokens, /--tafsir-body-size/);
assert.match(tokens, /--tafsir-ayah-size/);
assert.match(tokens, /--tafsir-reading-width/);
assert.match(tokens, /--tafsir-sheet-bg/);
assert.match(tokens, /Amiri Quran/);
assert.match(tokens, /IBM Plex Sans Arabic/);

console.log("mushaf-tafsir-selection-rebuild-gate.test.ts: ok");
