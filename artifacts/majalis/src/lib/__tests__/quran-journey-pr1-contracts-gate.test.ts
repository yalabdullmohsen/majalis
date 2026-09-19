/**
 * بوابة PR-1 لرحلة القرآن: عقود + أعلام + مستودع محلي.
 * Run: node --import tsx src/lib/__tests__/quran-journey-pr1-contracts-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const majalisRoot = resolve(here, "../../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

const flagsSrc = read("src/lib/quran-journey/flags.ts");
const typesSrc = read("src/lib/quran-journey/types.ts");
const validateSrc = read("src/lib/quran-journey/validate.ts");
const repoSrc = read("src/lib/quran-journey/local-repository.ts");
const indexSrc = read("src/lib/quran-journey/index.ts");
const pkg = read("package.json");
const mainTsx = read("src/main.tsx");
const appTsx = read("src/App.tsx");

assert.match(flagsSrc, /mushafMarkersV2:\s*false/);
assert.match(flagsSrc, /quranJourneys:\s*false/);
assert.match(flagsSrc, /memorizationTracker:\s*false/);
assert.match(flagsSrc, /quranReview:\s*false/);
assert.match(flagsSrc, /quranNotebook:\s*false/);
assert.match(flagsSrc, /quranProgressMap:\s*false/);
assert.match(flagsSrc, /quranActivity:\s*false/);

assert.match(typesSrc, /QuranMarker/);
assert.match(typesSrc, /QuranJourney/);
assert.match(typesSrc, /QuranMemorizationState/);
assert.match(typesSrc, /QuranReadingSession/);
assert.match(typesSrc, /QURAN_JOURNEY_SCHEMA_VERSION\s*=\s*1/);
assert.doesNotMatch(typesSrc, /ayahText|quranText|uthmani/);

assert.match(validateSrc, /isValidPage/);
assert.match(validateSrc, /isValidSurahAyah/);
assert.match(validateSrc, /stripQuranTextFields|ayahText/);
assert.match(validateSrc, /1–604|1-604|MUSHAF_PAGE/);

assert.match(repoSrc, /QuranJourneyLocalRepository/);
assert.match(repoSrc, /feature flag/);
assert.match(repoSrc, /QURAN_JOURNEY_MARKERS_MAX/);
assert.doesNotMatch(repoSrc, /from\s+["']@\/lib\/supabase/);
assert.doesNotMatch(repoSrc, /\.rpc\(|from\(["']quran_/);

assert.match(indexSrc, /getQuranJourneyFlags/);
assert.match(indexSrc, /QuranJourneyLocalRepository/);

assert.match(pkg, /test:quran-journey-pr1/);
assert.doesNotMatch(mainTsx, /quran-journey/);
assert.doesNotMatch(appTsx, /quran-journey/);

assert.ok(existsSync(resolve(majalisRoot, "src/lib/quran-journey/index.ts")));

/* سلوك تشغيلي */
const {
  resetQuranJourneyFlags,
  setQuranJourneyFlagsForTests,
  getQuranJourneyFlags,
  QuranJourneyLocalRepository,
  resetQuranJourneyStoreForTests,
  validateMarker,
  isValidSurahAyah,
  isValidPage,
} = await import("../quran-journey/index.ts");

resetQuranJourneyFlags();
resetQuranJourneyStoreForTests();
assert.equal(getQuranJourneyFlags().mushafMarkersV2, false);
assert.equal(QuranJourneyLocalRepository.listMarkers().length, 0);

const off = QuranJourneyLocalRepository.upsertMarker({
  surahNumber: 2,
  ayahNumber: 255,
  pageNumber: 42,
  markerType: "hifz",
});
assert.equal(off.ok, false);

assert.equal(isValidSurahAyah(2, 255), true);
assert.equal(isValidSurahAyah(2, 999), false);
assert.equal(isValidPage(604), true);
assert.equal(isValidPage(0), false);
assert.equal(isValidPage(605), false);

const badText = validateMarker(
  {
    id: "m1",
    surahNumber: 1,
    ayahNumber: 1,
    pageNumber: 1,
    markerType: "wird",
    colorToken: "marker-wird",
    title: "t",
    note: "n",
    ayahText: "بسم الله",
  },
  "local-test",
);
assert.equal(badText.ok, true);
if (badText.ok) {
  assert.equal("ayahText" in badText.value, false);
}

setQuranJourneyFlagsForTests({ mushafMarkersV2: true, quranJourneys: true });
resetQuranJourneyStoreForTests();

const a = QuranJourneyLocalRepository.upsertMarker({
  surahNumber: 1,
  ayahNumber: 1,
  pageNumber: 1,
  markerType: "wird",
  title: "بداية",
});
assert.equal(a.ok, true);

const dup = QuranJourneyLocalRepository.upsertMarker({
  surahNumber: 1,
  ayahNumber: 1,
  pageNumber: 1,
  markerType: "wird",
});
assert.equal(dup.ok, false);

const journey = QuranJourneyLocalRepository.upsertJourney({
  title: "ختمة تلاوة",
  journeyType: "tilawah",
  startReference: { surahNumber: 1, ayahNumber: 1, pageNumber: 1 },
  targetReference: { surahNumber: 114, ayahNumber: 6, pageNumber: 604 },
  currentReference: { surahNumber: 1, ayahNumber: 1, pageNumber: 1 },
});
assert.equal(journey.ok, true);

resetQuranJourneyFlags();
resetQuranJourneyStoreForTests();

console.log("quran-journey-pr1-contracts-gate.test.ts: ok");
