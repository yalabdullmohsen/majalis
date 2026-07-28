/**
 * Unit check — RN tafsirDatabase shape + merge helpers.
 * Run: npx tsx src/tests/quran-tafsir-database.test.ts
 */
import {
  __resetTafsirDatabaseForTests,
  getTafsirForAyah,
  getTafsirFromDatabase,
  mergeTafsirRowsIntoDatabase,
  tafsirByAyahFromDatabase,
  tafsirDatabase,
  verseTafsirId,
} from "../lib/quran-tafsir-database";

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

function main() {
  console.log("═══ quran-tafsir-database (RN sketch) ═══");
  __resetTafsirDatabaseForTests();

  check(verseTafsirId(2, 255) === "2:255", "verseTafsirId");
  check(Object.keys(tafsirDatabase).length === 0, "empty start");

  const n = mergeTafsirRowsIntoDatabase(1, [
    { numberInSurah: 1, text: "تفسير الآية الأولى" },
    { numberInSurah: 2, text: "تفسير الآية الثانية" },
    { numberInSurah: 3, text: "   " },
  ]);
  check(n === 2, "merged 2 rows");
  check(tafsirDatabase["1:1"] === "تفسير الآية الأولى", "db verse_id_1 shape");
  check(getTafsirFromDatabase("1:2") === "تفسير الآية الثانية", "get by id");
  check(getTafsirForAyah(1, 1) === "تفسير الآية الأولى", "get by surah/ayah");
  check(getTafsirForAyah(1, 3) === undefined, "skip blank");

  const byAyah = tafsirByAyahFromDatabase(1);
  check(byAyah[1] === "تفسير الآية الأولى" && byAyah[2] === "تفسير الآية الثانية", "byAyah map");

  __resetTafsirDatabaseForTests();
  check(Object.keys(tafsirDatabase).length === 0, "reset");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
