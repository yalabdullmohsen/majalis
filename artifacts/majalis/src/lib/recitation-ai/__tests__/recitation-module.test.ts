import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReferenceWords } from "../quran-reference-words";
import { masteryPercentageFromReport } from "../../../components/recitation/SessionReport";
import { loadLocalSurah } from "./test-utils-load-surah";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const fatiha = loadLocalSurah(1);
const words = buildReferenceWords(1, fatiha.ayahs);
assert.ok(words.length >= 4, "الفاتحة تحتوي كلمات مرجعية");

const moduleSrc = readFileSync(resolve(root, "components/recitation/RecitationModule.tsx"), "utf8");
assert.match(moduleSrc, /RecitationSetup/);
assert.match(moduleSrc, /LiveRecitation/);
assert.match(moduleSrc, /SessionReport/);
assert.match(moduleSrc, /loadReferenceWordsForSetup/);
assert.doesNotMatch(moduleSrc, /CircularProgress/);

const reportSrc = readFileSync(resolve(root, "components/recitation/SessionReport.tsx"), "utf8");
assert.match(reportSrc, /CircularProgress/);
assert.match(reportSrc, /masteryPercentageFromReport/);
assert.doesNotMatch(reportSrc, /totalWords = 7/);
assert.doesNotMatch(reportSrc, /notesCount = 1/);

const liveSrc = readFileSync(resolve(root, "components/recitation/LiveRecitation.tsx"), "utf8");
assert.match(liveSrc, /useSpeechRecognition/);
assert.match(liveSrc, /matchRecitationAdvanced/);
assert.match(liveSrc, /notesCount/);

const setupSrc = readFileSync(resolve(root, "components/recitation/RecitationSetup.tsx"), "utf8");
assert.match(setupSrc, /rai-choice-grid/);
assert.match(setupSrc, /matchingStrict/);
assert.doesNotMatch(setupSrc, /MOCK_AYAH/);

const pageSrc = readFileSync(resolve(root, "pages/quran/RecitationTestPage.tsx"), "utf8");
assert.match(pageSrc, /RecitationModule/);
assert.match(pageSrc, /advanced/);

assert.equal(masteryPercentageFromReport({ totalWords: 10, correctWords: 8, incorrectWords: 2, notesCount: 2 }), 80);
assert.equal(masteryPercentageFromReport({ totalWords: 0, correctWords: 0, incorrectWords: 0, notesCount: 0 }), 0);

console.log("recitation-module.test.ts: ok");
