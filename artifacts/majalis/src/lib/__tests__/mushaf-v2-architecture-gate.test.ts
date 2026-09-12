/**
 * بوابة معمارية لمصحف سُنّة v2 — طبقات + مصدر موثّق + ترحيل + عدم تعديل النص.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-v2-architecture-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const required = [
  "src/lib/mushaf-v2/provenance.ts",
  "src/lib/mushaf-v2/flags.ts",
  "src/lib/mushaf-v2/QuranDataSource.ts",
  "src/lib/mushaf-v2/MushafPageRepository.ts",
  "src/lib/mushaf-v2/MushafReaderController.ts",
  "src/lib/mushaf-v2/QuranSearchEngine.ts",
  "src/lib/mushaf-v2/QuranAudioController.ts",
  "src/lib/mushaf-v2/QuranBookmarksRepository.ts",
  "src/lib/mushaf-v2/migrate-user-data.ts",
  "src/lib/mushaf-v2/index.ts",
] as const;

for (const p of required) {
  assert.ok(existsSync(resolve(root, p)), `missing ${p}`);
}
assert.ok(existsSync(resolve(root, "src/lib/mushaf-v2/appearance-prefs.ts")));
assert.ok(existsSync(resolve(root, "src/lib/mushaf-v2/QuranSettingsRepository.ts")));
assert.ok(existsSync(resolve(root, "src/lib/mushaf-v2/QuranKhatmaRepository.ts")));
assert.ok(existsSync(resolve(root, "src/lib/quran-data/quran-data-fingerprint.ts")));
assert.ok(existsSync(resolve(root, "docs/quran-data-reviews/APPROVED.json")));

const provenance = read("src/lib/mushaf-v2/provenance.ts");
assert.match(provenance, /mushafId:\s*1/);
assert.match(provenance, /pageImagesInProduction:\s*false/);
assert.match(provenance, /quran-v2/);
assert.doesNotMatch(provenance, /\bAyat\b|\bayaat\b/i);

const flags = read("src/lib/mushaf-v2/flags.ts");
assert.match(flags, /settledLastPageSave:\s*true/);
assert.match(flags, /navigationLock:\s*true/);
assert.match(flags, /isMushafReaderV2Enabled/);
assert.match(flags, /QURAN_EXPERIENCE_NEXT/);
assert.match(flags, /settingsRepository:\s*true/);
assert.match(flags, /dataFingerprintGate:\s*true/);
assert.match(flags, /prefetchPlus2:\s*true/);
assert.match(flags, /khatmaWird:\s*false/);

const pageRepo = read("src/lib/mushaf-v2/MushafPageRepository.ts");
assert.match(pageRepo, /prefetchPlus2/);
assert.match(pageRepo, /radius/);

const settings = read("src/lib/mushaf-v2/QuranSettingsRepository.ts");
assert.match(settings, /QuranSettingsRepository/);
assert.match(settings, /textReadingMode/);
assert.doesNotMatch(settings, /FittedBox|scale-to-fit/i);

const indexSrc = read("src/lib/mushaf-v2/index.ts");
assert.match(indexSrc, /QuranSettingsRepository/);
assert.match(indexSrc, /QuranKhatmaRepository/);
assert.match(indexSrc, /QURAN_EXPERIENCE_NEXT/);

const controller = read("src/lib/mushaf-v2/MushafReaderController.ts");
assert.match(controller, /beginNavigation/);
assert.match(controller, /endNavigation/);
assert.match(controller, /savePagePosition/);
assert.match(controller, /180/);

const search = read("src/lib/mushaf-v2/QuranSearchEngine.ts");
assert.match(search, /normalizeArabic/);
assert.match(search, /searchVersesInCorpus/);
assert.match(search, /normalizeForSearch/);

const migrate = read("src/lib/mushaf-v2/migrate-user-data.ts");
assert.match(migrate, /MUSHAF_USER_DATA_MIGRATION_VERSION/);
assert.match(migrate, /getMyBookmarks/);
assert.match(migrate, /idempotent|آمن عند التكرار|لا يضاعف|current >=/);

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(reader, /@\/lib\/mushaf-v2/);
assert.match(reader, /MushafReaderController/);
assert.match(reader, /migrateMushafUserData/);
assert.match(reader, /QuranSettingsRepository/);
assert.doesNotMatch(reader, /VerifiedMushafReader/);

const page = read("src/pages/quran/MushafReaderPage.tsx");
assert.match(page, /NewMushafReader|MushafViewport/);
assert.match(page, /migrateMushafUserData/);

const searchSheet = read("src/features/mushaf-madinah/MushafSearchSheet.tsx");
assert.match(searchSheet, /QuranSearchEngine/);
assert.doesNotMatch(searchSheet, /searchVersesInCorpus/);

const sourcePath = resolve(root, "public/data/quran-v2/SOURCE.json");
assert.ok(existsSync(sourcePath), "SOURCE.json required");
const source = JSON.parse(read("public/data/quran-v2/SOURCE.json")) as Record<string, unknown>;
const mushafId = source.mushafId ?? source.mushaf ?? (source as { mushaf?: number }).mushaf;
assert.equal(Number(mushafId), 1);

const pagesDir = resolve(root, "public/data/quran-v2/pages");
const pages = readdirSync(pagesDir).filter((f) => /^page-\d+\.json$/.test(f));
assert.equal(pages.length, 604);

const anti = read("src/lib/__tests__/mushaf-anti-regression-guard.test.ts");
assert.match(anti, /mushaf-reader/);
assert.match(anti, /mushaf-v2/);

console.log("mushaf-v2-architecture-gate.test.ts: ok");
