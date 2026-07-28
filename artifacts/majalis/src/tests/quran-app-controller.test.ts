/**
 * Flutter QuranAppController — Node unit smoke.
 * Run: npx tsx src/tests/quran-app-controller.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createQuranAppController,
  QURAN_APP_FONT_DEFAULT,
  QURAN_APP_FONT_MAX,
  QURAN_APP_FONT_MIN,
  QURAN_APP_LIGHT_BG,
  QURAN_APP_DARK_BG,
  SAMPLE_FATIHA_VERSES,
  VERSE_PLAYING_BG,
  VERSE_SELECTED_SOFT_BG,
} from "../lib/quran-app-controller";
import * as services from "../quran/services";
import * as hooks from "../quran/hooks";
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
  console.log("═══ QuranAppController ═══");
  const c = createQuranAppController();
  check(c.fontSize === QURAN_APP_FONT_DEFAULT, "default font 28");
  check(c.backgroundColor === QURAN_APP_LIGHT_BG, "cream paper");
  check(!c.isDarkMode, "light default");

  let ticks = 0;
  const unsub = c.subscribe(() => {
    ticks += 1;
  });

  c.updateFontSize(34);
  check(c.fontSize === 34, "updateFontSize 34");
  c.updateFontSize(100);
  check(c.fontSize === QURAN_APP_FONT_MAX, "clamp max 42");
  c.updateFontSize(10);
  check(c.fontSize === QURAN_APP_FONT_MIN, "clamp min 20");

  c.toggleTheme(true);
  check(c.isDarkMode && c.backgroundColor === QURAN_APP_DARK_BG, "dark theme");
  c.toggleTheme(false);
  check(!c.isDarkMode && c.backgroundColor === QURAN_APP_LIGHT_BG, "light theme");

  c.selectVerse(3);
  check(c.selectedVerseIndex === 3, "selectVerse");

  c.toggleAudio(3);
  check(c.isPlayingAudio && c.currentPlayingVerse === 3, "toggleAudio play");
  c.toggleAudio(3);
  check(!c.isPlayingAudio && c.currentPlayingVerse === 3, "toggleAudio pause keeps index");
  c.toggleAudio(1);
  check(c.isPlayingAudio && c.currentPlayingVerse === 1, "toggleAudio other verse");

  check(ticks >= 8, "notifyListeners fired");
  unsub();

  check(SAMPLE_FATIHA_VERSES.length === 7, "fatiha sample 7");
  check(VERSE_PLAYING_BG.includes("0.3"), "amber@0.3");
  check(VERSE_SELECTED_SOFT_BG.includes("0.15"), "brown@0.15");
  check(typeof services.createQuranAppController === "function", "services export");
  check(typeof hooks.useQuranAppController === "function", "hooks export");
  check(constants.QURAN_APP_FONT_DEFAULT === 28, "constants font");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  check(
    existsSync(join(root, "components/quran/ImmersiveQuranApp.tsx")),
    "ImmersiveQuranApp.tsx",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
