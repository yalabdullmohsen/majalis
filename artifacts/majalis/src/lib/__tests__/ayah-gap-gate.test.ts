/**
 * بوابة الفجوة بين الآيات — double-buffer + هدف ≤120ms (قياس على الجهاز).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const engine = readFileSync(resolve(root, "src/core/audio/AudioEngine.ts"), "utf8");

assert.match(engine, /preloadNextAyah/);
assert.match(engine, /tryPlayFromPreload/);
assert.match(engine, /slotA/);

const qa = readFileSync(resolve(root, "docs/AUDIO_DEVICE_QA.md"), "utf8");
assert.match(qa, /120 ms|120ms/);
assert.match(qa, /60 ثانية|60 second/i);

console.log("ayah-gap-gate.test.ts: ok");
