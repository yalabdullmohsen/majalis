/**
 * Flutter QuranReaderPage immersive constants + enter/exit refcount.
 * Run: npx tsx src/tests/quran-immersive.test.ts
 */
import {
  IMMERSIVE_FONT_SIZE_PX,
  IMMERSIVE_INK,
  IMMERSIVE_LINE_HEIGHT_RATIO,
  IMMERSIVE_PAD_X_PX,
  IMMERSIVE_PAD_Y_PX,
  IMMERSIVE_LIST_PAD_Y_PX,
  IMMERSIVE_PAPER_BG,
<<<<<<< HEAD
  VERSE_ITEM_GAP_PX,
  VERSE_SELECTED_BG,
  VERSE_SELECTED_INK,
  VERSE_SELECTED_RADIUS_PX,
=======
  VERSE_SELECTED_BROWN,
>>>>>>> origin/cursor/quran-immersive-controller-1f54
  __resetImmersiveForTests,
  immersiveReaderCssVars,
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
  console.log("═══ Quran immersive (Flutter port) ═══");
  __resetImmersiveForTests();

  check(IMMERSIVE_PAPER_BG.toLowerCase() === "#f5f5dc", "paper #F5F5DC");
  check(IMMERSIVE_INK.includes("0.87"), "ink black87");
  check(IMMERSIVE_FONT_SIZE_PX === 28, "fontSize 28");
  check(IMMERSIVE_LINE_HEIGHT_RATIO === 2, "height 2.0");
  check(IMMERSIVE_PAD_X_PX === 30, "padX 30");
  check(IMMERSIVE_PAD_Y_PX === 20, "padY 20");
  check(IMMERSIVE_LIST_PAD_Y_PX === 50, "list padY 50");
  check(VERSE_SELECTED_BROWN.toUpperCase() === "#795548", "Colors.brown");

  check(VERSE_SELECTED_BG.includes("0.2"), "selected bg brown@0.2");
  check(VERSE_SELECTED_INK.toUpperCase() === "#3E2723", "selected ink brown900");
  check(VERSE_SELECTED_RADIUS_PX === 10, "radius 10");
  check(VERSE_ITEM_GAP_PX === 20, "item gap 20");

  const vars = immersiveReaderCssVars();
  check(vars["--quran-immersive-paper"] === IMMERSIVE_PAPER_BG, "css paper var");
  check(vars["--quran-immersive-lh"] === "56px", "css lh 28*2");

  check(constants.IMMERSIVE_PAPER_BG === IMMERSIVE_PAPER_BG, "constants re-export");
  check(constants.VERSE_SELECTED_INK === VERSE_SELECTED_INK, "constants selected ink");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
