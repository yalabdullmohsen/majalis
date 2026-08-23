/**
 * بوابة شيت الآية + نطاق التلاوة: ٣ حالات، بلا backdrop-filter، تبويبات، لمس ٤٤px.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-ayah-sheet-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { QURAN_DATA_FEATURES } from "../../lib/quran-data/flags";
import {
  resolveRecitationLoop,
  uniqueVerseKeysFromRows,
} from "../../features/mushaf-madinah/mushaf-page-for-ayah";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const viewport = read("src/features/mushaf-madinah/VerifiedMushafReader.tsx");
const dock = read("src/features/mushaf-madinah/MushafAudioDock.tsx");
const flags = read("src/lib/quran-data/flags.ts");

assert.match(actions, /collapsed/);
assert.match(actions, /half/);
assert.match(actions, /full/);
assert.match(actions, /data-sheet-height/);
assert.match(css, /height:\s*140px/);
assert.match(css, /50dvh/);
assert.match(css, /90dvh/);
assert.doesNotMatch(css, /backdrop-filter:\s*blur\(/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.28\)/);
assert.doesNotMatch(actions, /المزيد/);
assert.doesNotMatch(actions, /previewLines|slice\(0,\s*2\)/);
assert.match(actions, /role="tablist"/);
assert.match(actions, /تفسير/);
assert.match(actions, /تلاوة/);
assert.match(actions, /تجويد/);
assert.doesNotMatch(actions, />\s*معاني\s*</, "لا تبويب معاني ناقص");
assert.match(actions, /useState<SheetTab>\("tilawa"\)/, "التبويب الافتراضي تلاوة");
assert.match(actions, /ابدأ التلاوة|إيقاف مؤقت/);
assert.match(actions, /ayah-action-sheet__play-hero/);
assert.match(actions, /لا توجد أحكام تجويد متاحة لهذه الآية حاليًا/);
assert.match(actions, /QURAN_DATA_FEATURES/);
assert.match(css, /font-size:\s*22px/);
assert.match(css, /min-width:\s*44px/);
assert.match(css, /min-height:\s*44px/);
assert.match(actions, /Escape/);
assert.match(css, /\.mm-ayah-bar\s*\{[^}]*justify-items:\s*start/);
assert.match(css, /border-radius:\s*0\s+16px\s+16px\s+0/);
assert.match(actions, /dy > 72/);
assert.match(actions, /mm-ayah-bar__dismiss/);
assert.match(actions, /focusables/);
assert.match(viewport, /mushaf-ayah-hit.*focus|focus\(\)/);
assert.match(viewport, /useMediaSession/);
assert.match(viewport, /onPlayRange|playRange/);
assert.match(viewport, /setPlaybackRate/);
assert.match(viewport, /setLoopConfig/);
assert.match(actions, /0\.75/);
assert.match(actions, /1\.25/);
assert.match(actions, /لا نهائي/);
assert.match(actions, /مقطع/);
assert.match(actions, /type="range"/);
assert.match(dock, /مشغّل التلاوة/);
assert.match(flags, /ayahMeaningsTab:\s*false/);
assert.match(flags, /ayahTajweedTab:\s*false/);
assert.equal(QURAN_DATA_FEATURES.ayahMeaningsTab, false);
assert.equal(QURAN_DATA_FEATURES.ayahTajweedTab, false);

const keys = uniqueVerseKeysFromRows([
  { kind: "line", words: [{ verseKey: "2:5" }, { verseKey: "2:5" }, { verseKey: "2:6" }] },
  { kind: "surah-header" },
]);
assert.deepEqual(keys, ["2:5", "2:6"]);

assert.deepEqual(
  resolveRecitationLoop("ayah", { surah: 2, ayah: 5 }, ["2:5", "2:6", "2:7"], 286),
  { surah: 2, startAyah: 5, endAyah: 5 },
);
assert.deepEqual(
  resolveRecitationLoop("passage", { surah: 2, ayah: 5 }, ["2:5", "2:6", "2:7"], 286),
  { surah: 2, startAyah: 5, endAyah: 7 },
);
assert.deepEqual(
  resolveRecitationLoop("page", { surah: 2, ayah: 6 }, ["2:5", "2:6", "2:7"], 286),
  { surah: 2, startAyah: 5, endAyah: 7 },
);
assert.deepEqual(
  resolveRecitationLoop("surah", { surah: 1, ayah: 3 }, ["1:1", "1:2"], 7),
  { surah: 1, startAyah: 1, endAyah: 7 },
);

console.log("mushaf-ayah-sheet-gate.test.ts: ok");
