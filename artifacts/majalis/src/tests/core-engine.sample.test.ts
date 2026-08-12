/**
 * Sample scaffold smoke — Quran Engine façades.
 * Run: npx tsx src/tests/core-engine.sample.test.ts
 */
import { getDatabaseManager, databaseManager } from "../core/quran/DatabaseManager";
import { getQuranEngineContext } from "../core/quran/QuranEngineContext";
import { getAudioEngine } from "../core/audio/AudioEngine";
import { getTafseerService } from "../core/tafseer/TafseerService";
import { useQuranEngine } from "../hooks/useQuranEngine";

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

async function main() {
  console.log("═══ Quran Engine façade smoke ═══");

  check(getDatabaseManager() === databaseManager, "databaseManager singleton");
  check(typeof getDatabaseManager().saveProgress === "function", "saveProgress");
  check(typeof getAudioEngine().playAyah === "function", "AudioEngine.playAyah");
  check(typeof getAudioEngine().setRepeatMode === "function", "AudioEngine.setRepeatMode");
  check(typeof getTafseerService().getAyahTafsir === "function", "TafseerService.getAyahTafsir");

  const ctx = getQuranEngineContext();
  check(ctx.db === databaseManager, "context.db");
  check(typeof ctx.toggleTajweed === "function", "toggleTajweed");
  check(typeof ctx.toggleActionBar === "function", "toggleActionBar");
  check(typeof useQuranEngine === "function", "useQuranEngine hook");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
