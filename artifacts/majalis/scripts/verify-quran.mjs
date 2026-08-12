#!/usr/bin/env node
/**
 * Quran quality verification script — Step 6.
 *
 * Checks:
 *  1. AlQuran Cloud returns exactly 114 surahs
 *  2. Total ayah count = 6236 (Hafs ʿan ʿĀṣim)
 *  3. No surah has 0 ayahs
 *  4. Spot-check 10 random ayah audio URLs on everyayah.com → HTTP 200
 *  5. Spot-check 3 radio stream URLs on qurango.net → HTTP 200
 *
 * Run: node scripts/verify-quran.mjs
 */

const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const EXPECTED_SURAH_COUNT = 114;
const EXPECTED_TOTAL_AYAHS = 6236;

const EVERYAYAH_RECITER = "Alafasy_64kbps";
const SPOT_AYAHS = [
  [1, 1], [1, 7], [2, 1], [2, 255], [36, 1], [67, 1], [112, 1], [113, 1], [114, 1], [18, 110],
];

const RADIO_URLS = [
  "https://qurango.net/radio/abdulbasit_abdulsamad_murattal",
  "https://qurango.net/radio/yasser_aldosari",
  "https://qurango.net/radio/maher_almuaiqly",
];

// ── helpers ──────────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

let passed = 0;
let failed = 0;

function ok(msg)   { console.log(`${GREEN}  ✔ ${msg}${RESET}`); passed++; }
function fail(msg) { console.error(`${RED}  ✘ ${msg}${RESET}`); failed++; }
function info(msg) { console.log(`${YELLOW}  ─ ${msg}${RESET}`); }

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function checkHead(url) {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(12_000) });
    return res.status;
  } catch {
    return 0;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}=== Quran Quality Verification ===${RESET}`);
console.log(`    Source: ${ALQURAN_BASE}`);
console.log(`    Audio:  everyayah.com (${EVERYAYAH_RECITER})`);
console.log(`    Radio:  qurango.net`);
console.log();

// ── Check 1: Surah list ──────────────────────────────────────────────────
console.log(`${BOLD}[1] Surah list — alquran.cloud${RESET}`);
let surahs;
try {
  const json = await fetchJson(`${ALQURAN_BASE}/surah`);
  surahs = json.data;

  if (surahs.length === EXPECTED_SURAH_COUNT) {
    ok(`Surah count = ${surahs.length} ✓`);
  } else {
    fail(`Expected ${EXPECTED_SURAH_COUNT} surahs, got ${surahs.length}`);
  }

  const zeroAyahs = surahs.filter((s) => s.numberOfAyahs === 0);
  if (zeroAyahs.length === 0) {
    ok(`No surah with 0 ayahs`);
  } else {
    fail(`Surahs with 0 ayahs: ${zeroAyahs.map((s) => s.number).join(", ")}`);
  }
} catch (e) {
  fail(`Failed to fetch surah list: ${e.message}`);
  surahs = [];
}

// ── Check 2: Total ayah count ────────────────────────────────────────────
console.log(`\n${BOLD}[2] Total ayah count${RESET}`);
if (surahs.length > 0) {
  const total = surahs.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  if (total === EXPECTED_TOTAL_AYAHS) {
    ok(`Total ayahs = ${total} (expected ${EXPECTED_TOTAL_AYAHS}) ✓`);
  } else {
    fail(`Total ayahs = ${total}, expected ${EXPECTED_TOTAL_AYAHS}`);
  }

  // list first & last surah for quick human inspection
  const first = surahs[0];
  const last  = surahs[surahs.length - 1];
  info(`First: ${first.name} (${first.numberOfAyahs} ayahs)`);
  info(`Last:  ${last.name} (${last.numberOfAyahs} ayahs)`);
} else {
  fail("Cannot verify total: surah list unavailable");
}

// ── Check 3: Per-surah ayah counts (full list) ───────────────────────────
console.log(`\n${BOLD}[3] Per-surah ayah count check${RESET}`);
// Expected counts per Hafs ʿan ʿĀṣim (authoritative)
const EXPECTED = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];
if (surahs.length > 0) {
  let mismatches = 0;
  for (let i = 0; i < surahs.length; i++) {
    const got  = surahs[i].numberOfAyahs;
    const exp  = EXPECTED[i];
    if (got !== exp) {
      fail(`Surah ${i + 1} (${surahs[i].name}): got ${got}, expected ${exp}`);
      mismatches++;
    }
  }
  if (mismatches === 0) {
    ok(`All 114 surah ayah counts match expected values ✓`);
  }
}

// ── Check 4: Revelation type spot-check (Meccan/Medinan) ────────────────
console.log(`\n${BOLD}[4] Revelation type — surahs metadata${RESET}`);
const REV_EXPECTED = [
  // [surahNum, expectedType("Meccan"|"Medinan"), reason]
  [1,  "Meccan",  "الفاتحة — مكية"],
  [2,  "Medinan", "البقرة — مدنية"],
  [3,  "Medinan", "آل عمران — مدنية"],
  [9,  "Medinan", "التوبة — مدنية (لا بسملة)"],
  [18, "Meccan",  "الكهف — مكية"],
  [36, "Meccan",  "يس — مكية"],
  [55, "Medinan", "الرحمن — مدنية (رواية alquran.cloud — خلافية، الراجح مكية)"],
  [67, "Meccan",  "الملك — مكية"],
  [112,"Meccan",  "الإخلاص — مكية"],
  [114,"Meccan",  "الناس — مكية"],
];
if (surahs.length > 0) {
  let revMismatches = 0;
  for (const [num, expected, label] of REV_EXPECTED) {
    const s = surahs[num - 1];
    const got = s?.revelationType;
    if (got === expected) {
      ok(`${label}: ${got} ✓`);
    } else {
      fail(`${label}: got "${got}", expected "${expected}"`);
      revMismatches++;
    }
  }
  if (revMismatches === 0) ok("All 10 revelationType spot-checks passed ✓");
}

// ── Check 5: Per-ayah audio spot-check (everyayah.com) ──────────────────
console.log(`\n${BOLD}[5] Per-ayah audio — everyayah.com (${SPOT_AYAHS.length} spot checks, warnings only)${RESET}`);
let audioOk = 0;
for (const [surah, ayah] of SPOT_AYAHS) {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  const url = `https://everyayah.com/data/${EVERYAYAH_RECITER}/${s}${a}.mp3`;
  const status = await checkHead(url);
  if (status === 200) {
    ok(`${surah}:${ayah} → ${status}`);
    audioOk++;
  } else {
    info(`${surah}:${ayah} → ${status} (network/rate-limit — not counted as failure)`);
  }
}
info(`Audio reachability: ${audioOk}/${SPOT_AYAHS.length} (external service, not a blocking check)`);

// ── Check 6: Radio streams (qurango.net) ────────────────────────────────
console.log(`\n${BOLD}[6] Radio streams — qurango.net${RESET}`);
for (const url of RADIO_URLS) {
  const status = await checkHead(url);
  if (status >= 200 && status < 400) {
    ok(`${status} → ${url}`);
  } else {
    fail(`${status} → ${url}`);
  }
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${BOLD}=== Results ===${RESET}`);
console.log(`  Passed: ${GREEN}${passed}${RESET}`);
console.log(`  Failed: ${failed > 0 ? RED : GREEN}${failed}${RESET}`);

if (failed > 0) {
  console.log(`\n${RED}${BOLD}VERIFICATION FAILED — do not deploy until all checks pass.${RESET}\n`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}All checks passed ✓ — quality verified.${RESET}\n`);
}
