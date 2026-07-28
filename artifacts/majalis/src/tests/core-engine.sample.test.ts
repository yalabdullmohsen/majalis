/**
 * Sample scaffold test — Quran Engine core façades.
 * Run: npx tsx src/tests/core-engine.sample.test.ts
 *
 * Replace with Vitest suites under src/tests/unit as implementation lands.
 */
import { getDatabaseManager } from "../core/quran/DatabaseManager";
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
  console.log("═══ Quran Engine scaffold smoke ═══");

  const db = getDatabaseManager();
  const ctx = getQuranEngineContext();
  const audio = getAudioEngine();
  const tafseer = getTafseerService();

  check(db === getDatabaseManager(), "DatabaseManager singleton");
  check(ctx.db === db, "QuranEngineContext.db is DatabaseManager");
  check(audio === getAudioEngine(), "AudioEngine singleton");
  check(tafseer === getTafseerService(), "TafseerService singleton");
  check(typeof useQuranEngine === "function", "useQuranEngine hook exported");

  check((await db.initialize()) === false, "DatabaseManager.initialize scaffold returns false");
  check((await ctx.loadLastReadingProgress()) === null, "loadLastReadingProgress scaffold null");
  check(audio.getSnapshot().playerState === "idle", "AudioEngine idle snapshot");
  check((await tafseer.getAyahTafsir(1, 1)) === null, "TafseerService scaffold null");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
