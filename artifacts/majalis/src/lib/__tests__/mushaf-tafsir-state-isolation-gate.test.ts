/**
 * بوابة عزل حالة التفسير عن التقليب/الصوت/التحديد.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-tafsir-state-isolation-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bumpTafsirGeneration,
  createTafsirOpenIntent,
  isValidTafsirOpenIntent,
} from "../../features/mushaf-reader/tafsir-open-intent";
import {
  SUNNAH_MUSHAF_CACHE_VERSION,
  SUNNAH_MUSHAF_CLASSIC_PRESET_ID,
  buildMushafRenderCacheKey,
  resolveSunnahMushafClassicPreset,
} from "../../features/mushaf-reader/sunnah-mushaf-classic-preset";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const verseLayer = read("src/features/mushaf-reader/MushafVerseLayer.tsx");
const tafsirSheet = read("src/features/mushaf-madinah/MushafTafsirSheet.tsx");
const cache = read("src/features/mushaf-reader/mushaf-page-render-cache.ts");
const intentMod = read("src/features/mushaf-reader/tafsir-open-intent.ts");
const presetMod = read("src/features/mushaf-reader/sunnah-mushaf-classic-preset.ts");

assert.match(reader, /\btafsirVerseKey\b/);
assert.match(reader, /\bselectedVerseKey\b/);
assert.match(reader, /\bplayingVerseKey\b/);
assert.match(reader, /createTafsirOpenIntent/);
assert.match(reader, /bumpTafsirGeneration/);

const lp = reader.indexOf("const onLongPressVerse");
const openIdx = reader.indexOf("const openTafsir", lp);
assert.ok(lp >= 0 && openIdx > lp, "onLongPressVerse / openTafsir blocks");
const lpBlock = reader.slice(lp, openIdx);
assert.doesNotMatch(lpBlock, /setTafsirOpen\(\s*true\s*\)/);
assert.match(lpBlock, /setActionsOpen\(\s*true\s*\)/);

const ayah = reader.indexOf("onAyahChange");
assert.ok(ayah >= 0, "onAyahChange present");
const ayahBlock = reader.slice(ayah, ayah + 420);
assert.doesNotMatch(ayahBlock, /setSelectedVerseKey\(/);
assert.match(ayahBlock, /setPlayingVerseKey\(/);

assert.match(reader, /tafsirOpen\s*&&\s*tafsirVerseKey/);
assert.match(reader, /verseKey=\{tafsirVerseKey\}/);
assert.doesNotMatch(reader, /tafsirOpen\s*&&\s*selectedVerseKey/);

assert.match(verseLayer, /TAP_SLOP_X_PX\s*=\s*10/);
assert.match(verseLayer, /mushafPageIsPanning/);
assert.match(verseLayer, /data-mushaf-panning/);
assert.match(reader, /pagerSettled\s*\?\s*onLongPressVerse/);

assert.match(intentMod, /explicitUserIntent:\s*true/);
assert.equal(
  createTafsirOpenIntent({
    source: "userTappedTafsirAction",
    verseKey: "bad",
    pageNumber: 1,
  }),
  null,
);
const good = createTafsirOpenIntent({
  source: "userTappedTafsirAction",
  verseKey: "25:37",
  pageNumber: 365,
});
assert.ok(isValidTafsirOpenIntent(good));
assert.equal(good?.ayahId, 37);
const g1 = bumpTafsirGeneration();
const g2 = bumpTafsirGeneration();
assert.ok(g2 > g1);

assert.match(tafsirSheet, /سورة \$\{surahName\}، الآية \$\{parsed\.ayah\}/);
assert.match(tafsirSheet, /fetchGenRef/);
assert.match(tafsirSheet, /technicalRef/);

const preset = resolveSunnahMushafClassicPreset();
assert.equal(preset.presetId, SUNNAH_MUSHAF_CLASSIC_PRESET_ID);
assert.equal(preset.cacheVersion, SUNNAH_MUSHAF_CACHE_VERSION);
assert.match(buildMushafRenderCacheKey(365), new RegExp(SUNNAH_MUSHAF_CLASSIC_PRESET_ID));
assert.match(buildMushafRenderCacheKey(600), new RegExp(SUNNAH_MUSHAF_CACHE_VERSION));
assert.match(cache, /buildMushafRenderCacheKey/);
assert.match(cache, /presetCacheKey/);
assert.match(presetMod, /smc-/);
assert.match(cache, /cacheVersion/);

assert.match(reader, /onPanVisualStart/);
assert.match(reader, /tafsirOpenRef\.current/);

console.log("mushaf-tafsir-state-isolation-gate.test.ts: ok");
