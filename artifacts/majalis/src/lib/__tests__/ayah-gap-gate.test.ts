/**
 * بوابة فجوة التلاوة بين الآيات — سُنّة.
 * تمنع رجوع مسار onEnded → loading → cold load كمسار افتراضي.
 * node --import tsx src/lib/__tests__/ayah-gap-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TECHNICAL_TRANSITION_GAP_BUDGET_MS,
  markAyahAudioEnded,
  markAyahAudioStarted,
  resetAyahTransitionMetricsForTests,
  summarizeAyahTransitions,
} from "@/lib/audio/ayah-transition-metrics";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const engine = readFileSync(resolve(root, "src/core/audio/AudioEngine.ts"), "utf8");

assert.match(engine, /preloadNextAyah/);
assert.match(engine, /tryPlayFromPreload/);
assert.match(engine, /slotA/);
assert.match(engine, /seamless/);
assert.match(engine, /transitioning/);
assert.match(engine, /primeNearEndIfNeeded/);
assert.match(engine, /warmUrl/);
assert.match(engine, /markAyahAudioEnded/);
assert.match(engine, /\{ seamless: true \}/);
assert.doesNotMatch(
  engine.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
  /void crossfadeAudio\(outgoing/,
  "ممنوع crossfade من صفر في مسار handoff",
);

const qa = readFileSync(resolve(root, "docs/AUDIO_DEVICE_QA.md"), "utf8");
assert.match(qa, /120\s*ms|120ms/i);

assert.equal(TECHNICAL_TRANSITION_GAP_BUDGET_MS, 120);

resetAyahTransitionMetricsForTests();
markAyahAudioEnded("1:1", 1000);
markAyahAudioStarted({
  ayahId: "1:2",
  cacheHit: true,
  path: "preload-hit",
  playerRecreation: false,
  at: 1040,
});
const summary = summarizeAyahTransitions();
assert.equal(summary.count, 1);
assert.equal(summary.p50, 40);
assert.ok(summary.p50 <= TECHNICAL_TRANSITION_GAP_BUDGET_MS);

console.log("ayah-gap-gate.test.ts: ok");
