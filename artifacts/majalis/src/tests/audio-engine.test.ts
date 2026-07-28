/**
 * Unit boilerplate — AudioEngine API surface (no network / no Audio element required).
 * Run: npx tsx src/tests/audio-engine.test.ts
 */
import { AudioEngine, getAudioEngine } from "../core/audio/AudioEngine";

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
  console.log("═══ AudioEngine boilerplate ═══");
  AudioEngine.__resetInstanceForTests();

  const a = getAudioEngine();
  check(a === getAudioEngine(), "singleton");

  const snap0 = a.getSnapshot();
  check(snap0.playerState === "idle", "initial idle");
  check(snap0.repeatMode === "off", "repeat off");
  check(snap0.teachPhase === "idle", "teach idle");

  a.setReciter("husary");
  check(a.getSnapshot().reciterId === "husary", "setReciter");

  a.setRepeatMode("ayah");
  check(a.getSnapshot().repeatMode === "ayah", "repeat ayah");
  a.setRepeatMode("surah");
  check(a.getSnapshot().repeatMode === "surah", "repeat surah");
  a.setRepeatMode("off");

  a.setTeachMode(true);
  check(a.getSnapshot().teachPhase === "teacher", "teach mode on");
  a.setTeachMode(false);
  check(a.getSnapshot().teachPhase === "idle", "teach mode off");

  let ayahEvents = 0;
  const unsub = a.onAyahChange(() => {
    ayahEvents += 1;
  });
  // playAyah needs HTMLAudioElement — skip actual play in Node; just ensure API exists
  check(typeof a.playAyah === "function", "playAyah");
  check(typeof a.togglePlay === "function", "togglePlay");
  check(typeof a.seekToAyah === "function", "seekToAyah");
  check(typeof a.seek === "function", "seek");
  check(typeof a.pause === "function", "pause");
  unsub();
  check(ayahEvents === 0, "no ayah events without play");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
