/**
 * بوابة P0 — Sunnah Mushaf Signature.
 * node --import tsx src/lib/__tests__/mushaf-signature-p0-baseline-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveSunnahMushafSignaturePreset,
  SUNNAH_MUSHAF_SIGNATURE_PRESET_ID,
  buildSignatureRenderCacheKey,
} from "@/features/mushaf-reader/sunnah-mushaf-signature-preset";
import { resolveSunnahMushafClassicPreset } from "@/features/mushaf-reader/sunnah-mushaf-classic-preset";
import { MUSHAF_PROVENANCE } from "@/lib/mushaf-v2/provenance";
import { findMushafPageForAyah } from "@/features/mushaf-madinah/mushaf-page-for-ayah";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== مصدر القرآن والرواية ===");
assert.equal(MUSHAF_PROVENANCE.mushafId, 1);
assert.match(MUSHAF_PROVENANCE.label, /hafs|QCF|V2/i);
assert.equal(MUSHAF_PROVENANCE.pageImagesInProduction, false);
assert.deepEqual([...MUSHAF_PROVENANCE.forbiddenMushafIds], [2]);

const source = JSON.parse(read("public/data/quran-v2/SOURCE.json")) as {
  mushafId: number;
  fingerprint: { ayahCount: number; wordCount: number };
};
assert.equal(source.mushafId, 1);
assert.equal(source.fingerprint.ayahCount, 6236);
assert.ok(source.fingerprint.wordCount > 80_000);

console.log("=== Page Mapping ===");
assert.equal(findMushafPageForAyah(2, 34), 6);
assert.equal(findMushafPageForAyah(7, 11), 151);
assert.equal(findMushafPageForAyah(15, 31), 263);
assert.equal(findMushafPageForAyah(38, 74), 457);

console.log("=== خط QPC V2 ===");
assert.ok(existsSync(resolve(root, "public/fonts/qpc-v2/p1.woff2")));
assert.ok(existsSync(resolve(root, "public/fonts/qpc-v2/p604.woff2")));
assert.match(MUSHAF_PROVENANCE.fontPathPattern, /qpc-v2/);

console.log("=== Signature Preset ===");
const sig = resolveSunnahMushafSignaturePreset();
assert.equal(sig.presetId, SUNNAH_MUSHAF_SIGNATURE_PRESET_ID);
assert.equal(sig.displayBrand, "سُنّة");
assert.equal(sig.riwayah, "hafs-an-asim");
assert.equal(sig.fontId, "qpc-v2");
assert.equal(sig.linesPerPage, 15);
assert.equal(sig.pageScale, 1);
assert.equal(sig.mushafId, 1);
assert.equal(sig.lineHeight, 1.85);
assert.match(buildSignatureRenderCacheKey(1), /sunnah-mushaf-signature/);

const classic = resolveSunnahMushafClassicPreset();
assert.equal(classic.fontId, "qpc-v2");
assert.equal(classic.rendererId, "new-mushaf-reader");

console.log("=== لا اسم قديم في القارئ الجديد ===");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.doesNotMatch(reader, /مجالس العلم|MajlisIlm|majlisilm\.brand/i);
assert.doesNotMatch(reader, /MushafExitControl/);
assert.match(reader, /MushafControlsLayer/);

const controls = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
assert.match(controls, /بحث في القرآن/);
assert.match(controls, /الخروج من المصحف/);

console.log("=== بلا Haptic في تقليب الصفحة ===");
assert.ok(existsSync(resolve(root, "src/features/mushaf-reader/MushafControlsLayer.tsx")));
const pager = read("src/features/mushaf-reader/useMushafPager.ts");
const goIdx = pager.indexOf("const go = useCallback");
assert.ok(goIdx >= 0);
const goBlock = pager.slice(goIdx, goIdx + 500);
assert.doesNotMatch(goBlock, /haptics\.(selection|impact|success)/);

console.log("=== Geometry ثابتة ===");
const layout = read("src/features/mushaf-reader/useStableMushafLayout.ts");
assert.match(layout, /LINE_HEIGHT = "1\.85"/);
assert.match(layout, /HEADER_H = 36/);
assert.match(layout, /FOOTER_H = 40/);
assert.match(layout, /data-mushaf-font-locked/);

console.log("=== بحث وخروج ===");
const searchEngine = read("src/lib/mushaf-v2/QuranSearchEngine.ts");
assert.match(searchEngine, /findMushafPageForAyah/);
assert.match(searchEngine, /normalizeForSearch|normalizeArabic|normalizeForQuery/);
assert.doesNotMatch(searchEngine, /fetch\(/);

assert.match(controls, /الخروج من المصحف/);
assert.match(controls, /nm-controls__exit/);
assert.match(reader, /chromeOpen && !actionsOpen && !gotoOpen/);

assert.match(reader, /setMushafAyahSearchHighlight/);
assert.match(reader, /migrateToSunnahMushafSignature/);
assert.match(reader, /searchOpen \|\| indexOpen/);

const returnCtx = read("src/features/mushaf-reader/mushaf-return-context.ts");
assert.match(returnCtx, /MushafReturnContext/);
assert.match(returnCtx, /sourceRoute/);

const banner = read("src/features/mushaf-reader/MushafSurahBanner.tsx");
assert.match(banner, /sunnah-v1|nm-surah-banner/);
assert.match(read("src/features/mushaf-reader/mushaf-reader.css"), /mushaf-surah-frame-bg/);
assert.match(read("src/features/mushaf-reader/mushaf-reader.css"), /is-search-hit/);

console.log("mushaf-signature-p0-baseline-gate.test.ts: ok");
