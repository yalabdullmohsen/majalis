/**
 * Unit tests — AudioEngine core (no DOM Audio required for pure helpers).
 * Run: npx tsx tests/unit/audio-engine-core.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { ayahAtTime, findAyahTiming, __clearSurahSyncCacheForTests } from "../../src/core/audio/sync-loader";
import type { SurahSyncMap } from "../../src/core/audio/types";
import { getQuranEngineContext } from "../../src/core/quran/QuranEngineContext";
import { getAudioEngine, __resetAudioEngineForTests } from "../../src/core/audio/AudioEngine";
import { resetQuranEngineState } from "../../src/lib/quran-engine-store";

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

const root = resolve(import.meta.dirname, "../..");

console.log("═══ AudioEngine surface files ═══");
check(existsSync(resolve(root, "src/core/audio/AudioEngine.ts")), "AudioEngine.ts present");
check(existsSync(resolve(root, "src/core/audio/sync-loader.ts")), "sync-loader present");
check(existsSync(resolve(root, "src/core/audio/types.ts")), "types present");

const engineSrc = readFileSync(resolve(root, "src/core/audio/AudioEngine.ts"), "utf8");
check(engineSrc.includes("onAyahChange"), "emits onAyahChange");
check(engineSrc.includes('RepeatMode') || engineSrc.includes('"ayah"'), "repeat modes");
check(engineSrc.includes("setTeachMode") || engineSrc.includes("teachConfig"), "teacher/student mode");
check(engineSrc.includes("prefetchNextAyahs") || engineSrc.includes("prefetchAround"), "prefetch next verse");
check(engineSrc.includes("downloadSurahOffline"), "offline download");
check(engineSrc.includes("OfflineAssetsStore") || engineSrc.includes("registerSurahAudio"), "tracks OfflineAssetsStore");

const ctxSrc = readFileSync(resolve(root, "src/core/quran/QuranEngineContext.ts"), "utf8");
check(ctxSrc.includes("getAudioEngine") || ctxSrc.includes("audio = getAudioEngine"), "context owns AudioEngine");
check(ctxSrc.includes("seekAudioToAyah") || ctxSrc.includes("seekToAyah"), "context seek API");
check(ctxSrc.includes("playAyah"), "context playAyah");

const barSrc = readFileSync(resolve(root, "src/components/QuranActionBar.tsx"), "utf8");
check(barSrc.includes("togglePlayAyah") || barSrc.includes("audio."), "ActionBar uses AudioEngine APIs");
check(barSrc.includes("setRepeatMode"), "ActionBar repeat via engine");

console.log("═══ Sync helpers ═══");
{
  __clearSurahSyncCacheForTests();
  const map: SurahSyncMap = {
    surah: 1,
    reciterId: "alafasy",
    mode: "continuous",
    ayahs: [
      { ayah: 1, start: 0, end: 4 },
      { ayah: 2, start: 4, end: 9 },
      { ayah: 3, start: 9, end: 14 },
    ],
  };
  check(ayahAtTime(map, 0)?.ayah === 1, "ayahAtTime @0 → 1");
  check(ayahAtTime(map, 4)?.ayah === 2, "ayahAtTime @4 → 2");
  check(ayahAtTime(map, 13.5)?.ayah === 3, "ayahAtTime @13.5 → 3");
  check(findAyahTiming(map, 2)?.start === 4, "findAyahTiming ayah 2");
}

console.log("═══ Context ↔ AudioEngine singleton ═══");
{
  __resetAudioEngineForTests();
  resetQuranEngineState();
  const ctx = getQuranEngineContext();
  check(ctx.audio === getAudioEngine(), "context.audio is singleton");
  check(typeof ctx.playAyah === "function", "playAyah exists");
  check(typeof ctx.setRepeatMode === "function", "setRepeatMode exists");
  check(typeof ctx.downloadSurahAudio === "function", "downloadSurahAudio exists");
  ctx.setRepeatMode("ayah");
  check(getAudioEngine().getRepeatMode() === "ayah", "repeat mode ayah");
  ctx.setRepeatMode("none");
  check(getAudioEngine().getRepeatMode() === "none", "repeat mode none");
  resetQuranEngineState();
  __resetAudioEngineForTests();
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
