/**
 * Flutter verse ListView selection — Node-safe smoke (no CSS imports).
 * Run: npx tsx src/tests/quran-verse-list.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  VERSE_ITEM_GAP_PX,
  VERSE_SELECTED_BG,
  VERSE_SELECTED_INK,
  VERSE_SELECTED_RADIUS_PX,
} from "../lib/quran-immersive";
import * as constants from "../quran/constants";

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
  console.log("═══ Quran verse list (Flutter InkWell) ═══");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");

  check(
    existsSync(join(root, "components/quran/QuranVerseList.tsx")),
    "QuranVerseList.tsx",
  );
  check(
    existsSync(join(root, "components/quran/QuranReaderPage.tsx")),
    "QuranReaderPage.tsx",
  );

  check(VERSE_SELECTED_BG.startsWith("rgba(121, 85, 72"), "brown wash");
  check(VERSE_SELECTED_INK === "#3E2723", "brown[900]");
  check(VERSE_SELECTED_RADIUS_PX === 10, "radius 10");
  check(VERSE_ITEM_GAP_PX === 20, "gap 20");
  check(constants.VERSE_SELECTED_BG === VERSE_SELECTED_BG, "constants wash");

  const demoVerses = [
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "الرَّحْمَٰنِ الرَّحِيمِ",
    "مَالِكِ يَوْمِ الدِّينِ",
  ];
  check(demoVerses.length === 4, "demo Al-Fatiha sample length");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
