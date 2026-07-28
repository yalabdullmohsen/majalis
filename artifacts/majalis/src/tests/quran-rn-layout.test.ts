/**
 * Smoke — RN-shaped `@/quran` façade barrels resolve (Node-safe subset).
 * UI barrels (`components` / `screens`) pull CSS — covered by `vite build`.
 * Run: npx tsx src/tests/quran-rn-layout.test.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as quran from "../quran";
import * as assets from "../quran/assets";
import * as hooks from "../quran/hooks";
import * as context from "../quran/context";
import * as services from "../quran/services";
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
  console.log("═══ quran RN layout façade ═══");
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "quran");

  for (const dir of ["assets", "components", "screens", "hooks", "context", "services", "constants"]) {
    check(existsSync(join(root, dir, "index.ts")), `folder ${dir}/index.ts`);
  }
  check(existsSync(join(root, "README.md")), "README.md");

  check(Boolean(quran.assets && quran.hooks && quran.context), "root namespaces A");
  check(Boolean(quran.services && quran.constants), "root namespaces B");
  check(quran.RN_UI_PATHS.components.includes("components"), "RN_UI_PATHS.components");
  check(quran.RN_UI_PATHS.screens.includes("screens"), "RN_UI_PATHS.screens");

  check(typeof assets.getAyahAudioUrl === "function", "assets.getAyahAudioUrl");
  check(Array.isArray(assets.RECITERS) && assets.RECITERS.length > 0, "assets.RECITERS");

  check(typeof hooks.useQuranEngine === "function", "hooks.useQuranEngine");
  check(typeof hooks.useQuranAudioToggle === "function", "hooks.useQuranAudioToggle");
  check(typeof hooks.useQuranAudio === "function", "hooks.useQuranAudio");
  check(typeof hooks.useImmersiveSystemUi === "function", "hooks.useImmersiveSystemUi");
  check(typeof hooks.useQuranController === "function", "hooks.useQuranController");
  check(typeof hooks.useAppController === "function", "hooks.useAppController");
  check(typeof hooks.useAudioTrackingCursor === "function", "hooks.useAudioTrackingCursor");
  check(typeof hooks.useQuranAppController === "function", "hooks.useQuranAppController");
  check(typeof hooks.useAyahPlayer === "function", "hooks.useAyahPlayer");
  check(typeof hooks.useColorScheme === "function", "hooks.useColorScheme");
  check(
    Array.isArray(constants.VALID_PLAYBACK_RATES) &&
      (constants.VALID_PLAYBACK_RATES as readonly number[]).includes(0.5),
    "constants.VALID_PLAYBACK_RATES",
  );
  check(constants.IMMERSIVE_PAPER_BG === "#F5F5DC", "constants.IMMERSIVE_PAPER_BG");
  check(constants.VERSE_SELECTED_BROWN === "#795548", "constants.VERSE_SELECTED_BROWN");
  check(constants.IMMERSIVE_LIST_PAD_Y_PX === 50, "constants.IMMERSIVE_LIST_PAD_Y_PX");
  check(constants.QURAN_APP_FONT_DEFAULT === 28, "constants.QURAN_APP_FONT_DEFAULT");
  check(constants.VERSE_PLAYING_BG.includes("0.3"), "constants.VERSE_PLAYING_BG");

  check(typeof context.QuranEngineProvider === "function", "context.QuranEngineProvider");
  check(typeof context.getQuranEngineContext === "function", "context.getQuranEngineContext");
  check(typeof context.useThemePreference === "function", "context.useThemePreference");

  check(typeof services.getAudioEngine === "function", "services.getAudioEngine");
  check(typeof services.getTafseerService === "function", "services.getTafseerService");
  check(typeof services.fetchSurahDetail === "function", "services.fetchSurahDetail");
  check(typeof services.loadPlaybackRate === "function", "services.loadPlaybackRate");
  check(typeof services.createQuranController === "function", "services.createQuranController");
  check(typeof services.createAppController === "function", "services.createAppController");
  check(typeof services.createQuranAppController === "function", "services.createQuranAppController");

  check(Array.isArray(constants.surahList) && constants.surahList.length === 114, "constants.surahList 114");
  check(constants.QURAN_FONT_DEFAULT_PX === 20, "constants.font default 20");
  check(
    (constants.PLAYBACK_RATE_PRESETS as readonly number[]).includes(1.5),
    "speed presets",
  );

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
