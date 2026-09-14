/**
 * بوابة P0: تثبيت خط أساس سلامة المصحف قبل مرحلة الزخارف الأصلية.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const source = JSON.parse(read("public/data/quran-v2/SOURCE.json")) as {
  mushafId: number;
  forbiddenMushafIds: number[];
  fingerprint: {
    ayahCount: number;
    wordCount: number;
    codesSha: string;
    textsSha: string;
    verseOrderSha: string;
  };
};

assert.equal(source.mushafId, 1, "المصحف المعتمد mushafId=1 فقط");
assert.ok(source.forbiddenMushafIds.includes(2), "mushaf=2 ممنوع");
assert.equal(source.fingerprint.ayahCount, 6236);
assert.equal(source.fingerprint.wordCount, 83665);
assert.equal(
  source.fingerprint.codesSha,
  "b21f6bdad370b8a6feea12236c844f809b3bdf9c191d312ac216543ed3c3ab7d",
);
assert.equal(
  source.fingerprint.textsSha,
  "d7d6cae756ecb5fafe2885e9ab0f7193e9771864216b93ceb364b80a39a6ae26",
);
assert.equal(
  source.fingerprint.verseOrderSha,
  "c7fb16ced00ce9d1cacd0d1405d9ad2958219e1f7bbe89c1ae37899d84fb1264",
);

const pages = readdirSync(resolve(root, "public/data/quran-v2/pages")).filter((f) =>
  /^page-\d+\.json$/.test(f),
);
const fonts = readdirSync(resolve(root, "public/fonts/qpc-v2")).filter((f) =>
  /^p\d+\.woff2$/.test(f),
);
assert.equal(pages.length, 604, `604 صفحة بيانات (وُجد ${pages.length})`);
assert.equal(fonts.length, 604, `604 خط صفحة (وُجد ${fonts.length})`);

const preset = read("src/features/mushaf-reader/sunnah-mushaf-signature-preset.ts");
assert.match(preset, /pageMappingVersion:\s*"madinah-604-v1"/);
assert.match(preset, /lineMappingVersion:\s*"qpc-layout-v2"/);
assert.match(preset, /SIGNATURE_FONT_SIZE_MAX_PX\s*=\s*24/);
assert.match(preset, /sms-2026-09-14-max-safe-layout-24/);

const readerPage = read("src/pages/quran/MushafReaderPage.tsx");
assert.match(readerPage, /NewMushafReader/);
assert.doesNotMatch(readerPage, /VerifiedMushafReader/);

assert.ok(existsSync(resolve(root, "docs/mushaf/SUNNAH_AUTHENTIC_MUSHAF_P0_AUDIT.md")));
assert.ok(existsSync(resolve(root, "docs/mushaf/SUNNAH_MUSHAF_ASSET_REGISTRY.md")));

const registry = read("docs/mushaf/SUNNAH_MUSHAF_ASSET_REGISTRY.md");
assert.match(registry, /createdForSunnah/);
assert.match(registry, /madinah-page-pdf-images/);
assert.match(registry, /rejected/);

const audit = read("docs/mushaf/SUNNAH_AUTHENTIC_MUSHAF_P0_AUDIT.md");
assert.match(audit, /STOP/);
assert.match(audit, /لم يُستخرج أي أصل من الصور المرجعية/);

console.log("mushaf-authentic-p0-baseline-gate.test.ts: ok");
