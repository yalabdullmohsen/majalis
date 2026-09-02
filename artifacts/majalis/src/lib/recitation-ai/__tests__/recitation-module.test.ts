import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReferenceWords } from "../quran-reference-words";
import { loadLocalSurah } from "./test-utils-load-surah";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const fatiha = loadLocalSurah(1);
const words = buildReferenceWords(1, fatiha.ayahs);
assert.ok(words.length >= 4, "الفاتحة تحتوي كلمات مرجعية");

const moduleSrc = readFileSync(resolve(root, "components/recitation/RecitationModule.tsx"), "utf8");
assert.match(moduleSrc, /RecitationSetup/);
assert.match(moduleSrc, /LiveRecitation/);
assert.match(moduleSrc, /CircularProgress/);
assert.match(moduleSrc, /loadReferenceWordsForSetup/);

const setupSrc = readFileSync(resolve(root, "components/recitation/RecitationSetup.tsx"), "utf8");
assert.match(setupSrc, /rai-choice-grid/);
assert.match(setupSrc, /matchingStrict/);
assert.doesNotMatch(setupSrc, /MOCK_AYAH/);

const pageSrc = readFileSync(resolve(root, "pages/quran/RecitationTestPage.tsx"), "utf8");
assert.match(pageSrc, /RecitationModule/);
assert.match(pageSrc, /advanced/);

console.log("recitation-module.test.ts: ok");
