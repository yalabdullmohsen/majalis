/**
 * Audio playback pipeline — no await session-before-play (iPad gesture) + CDN health.
 * Run: node --import tsx src/lib/__tests__/audio-playback-pipeline-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listAyahAudioUrls, getReciter } from "../quran-audio";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const engine = readFileSync(resolve(root, "src/core/audio/AudioEngine.ts"), "utf8");
const logMod = readFileSync(resolve(root, "src/lib/tilawa-playback-log.ts"), "utf8");

console.log("=== Gesture-safe session kick (no await before play) ===");
assert.match(engine, /kickPlaybackSession/);
assert.match(engine, /NEVER await before HTMLMediaElement\.play/);
const playAyahBlock = engine.slice(engine.indexOf("async playAyah"), engine.indexOf("async togglePlay"));
assert.match(playAyahBlock, /this\.kickPlaybackSession/);
assert.doesNotMatch(
  playAyahBlock,
  /await this\.activatePlaybackSession[\s\S]{0,400}waitUntilPlaying/,
);
assert.match(engine, /budgetMs = 18_000/);
assert.match(engine, /perUrlMs = 8_000/);
assert.match(engine, /BUFFERING_WATCH_MS = 20_000/);
assert.match(engine, /\/timeout\/i/);
assert.equal(engine.includes("await this.activatePlaybackSession"), false);

console.log("=== Tilawa log module + engine hook ===");
assert.match(logMod, /logTilawa/);
assert.match(logMod, /__MAJALIS_TILAWA_LOG__/);
assert.match(logMod, /url_try/);
assert.match(engine, /tilawa-playback-log/);

console.log("=== CDN URL probes (live) ===");
const samples: Array<{ surah: number; ayah: number; reciter: string }> = [
  { surah: 1, ayah: 1, reciter: "alafasy" },
  { surah: 1, ayah: 1, reciter: "husary" },
  { surah: 2, ayah: 1, reciter: "minshawi" },
  { surah: 2, ayah: 255, reciter: "alafasy" },
  { surah: 18, ayah: 1, reciter: "dosari" },
  { surah: 36, ayah: 1, reciter: "sudais" },
  { surah: 55, ayah: 1, reciter: "maher" },
  { surah: 67, ayah: 1, reciter: "ghamdi" },
  { surah: 112, ayah: 1, reciter: "abdulsamad" },
  { surah: 114, ayah: 1, reciter: "alafasy" },
];

const probed: string[] = [];
for (const s of samples) {
  const urls = listAyahAudioUrls(s.surah, s.ayah, s.reciter);
  assert.ok(urls.length >= 1, `urls for ${s.reciter} ${s.surah}:${s.ayah}`);
  probed.push(urls[0]!);
}

async function headOk(url: string): Promise<{ ok: boolean; status: number; ms: number }> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return { ok: res.ok, status: res.status, ms: Date.now() - t0 };
  } catch {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-1" },
        redirect: "follow",
      });
      return { ok: res.ok || res.status === 206, status: res.status, ms: Date.now() - t0 };
    } catch {
      return { ok: false, status: 0, ms: Date.now() - t0 };
    }
  }
}

let okCount = 0;
for (const url of probed) {
  const r = await headOk(url);
  console.log(`  ${r.status} ${r.ms}ms ${url}`);
  if (r.ok) okCount += 1;
}
assert.ok(okCount >= Math.ceil(probed.length * 0.8), `CDN health ${okCount}/${probed.length}`);

assert.ok(getReciter("alafasy").nameAr);
assert.ok(getReciter("husary").nameAr);

console.log("audio-playback-pipeline-gate.test.ts: ok");
