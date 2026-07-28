/**
 * Unit check — RN reciter catalog + getAudioUrl.
 * Run: npx tsx src/tests/quran-reciters.test.ts
 */
import {
  DEFAULT_SELECTED_RECITER,
  getAudioUrl,
  getAudioUrlForAyah,
  getReciterCatalogEntry,
  reciters,
  resolveReciterId,
  verseFileStem,
} from "../lib/quran-reciters";

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
  console.log("═══ quran-reciters (RN sketch) ═══");

  check(Boolean(reciters.alafasy), "alafasy in catalog");
  check(Boolean(reciters.maher), "maher in catalog");
  check(Boolean(reciters.mishary), "mishary alias");
  check(reciters.mishary?.baseUrl === reciters.alafasy?.baseUrl, "mishary shares alafasy baseUrl");
  check(resolveReciterId("mishary") === "alafasy", "resolve mishary");
  check(resolveReciterId("muaiqly") === "maher", "resolve muaiqly");
  check(DEFAULT_SELECTED_RECITER === "alafasy", "default selected");

  const stem = verseFileStem(2, 255);
  check(stem === "002255", "verseFileStem 2:255");

  const url = getAudioUrl(stem, "mishary");
  check(
    url === "https://everyayah.com/data/Alafasy_64kbps/002255.mp3",
    "getAudioUrl mishary/002255",
  );

  const url2 = getAudioUrlForAyah(1, 1, "maher");
  check(
    url2 === "https://everyayah.com/data/Maher_AlMuaiqly_64kbps/001001.mp3",
    "getAudioUrlForAyah maher 1:1",
  );

  const entry = getReciterCatalogEntry("mishary");
  check(entry.name.includes("مشاري"), "catalog name for mishary");
  check(entry.baseUrl.endsWith("/"), "baseUrl trailing slash");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
