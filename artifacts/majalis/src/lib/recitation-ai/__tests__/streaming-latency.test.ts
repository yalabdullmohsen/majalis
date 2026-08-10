/**
 * بوابة بث التسميع منخفض الكمون.
 * تشغيل: node --import tsx src/lib/recitation-ai/__tests__/streaming-latency.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EnergyVad } from "../vad";
import { softEqualNormalized, levenshteinAtMost } from "../soft-match";
import { dedupeOverlappingWords, SLICE_MS, WINDOW_SLICES } from "../providers/server-provider";
import { alignFittingWindow } from "../word-alignment";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.ok(SLICE_MS <= 500 && SLICE_MS >= 200, `SLICE_MS في النطاق 200–500 (حصل ${SLICE_MS})`);
assert.ok(WINDOW_SLICES >= 2 && WINDOW_SLICES <= 4, "نافذة شرائح معقولة");

const vad = new EnergyVad({ speechThreshold: 0.02, startFrames: 2, endFrames: 3 });
assert.equal(vad.tick(0).speaking, false);
assert.equal(vad.tick(0.05).speechStarted, false); // إطار واحد لا يكفي
const t2 = vad.tick(0.05);
assert.equal(t2.speechStarted, true);
assert.equal(t2.speaking, true);
vad.tick(0);
vad.tick(0);
const end = vad.tick(0);
assert.equal(end.speechEnded, true);

assert.equal(softEqualNormalized("الحمد", "الحمد"), true);
assert.equal(softEqualNormalized("العالمين", "العالمين"), true);
assert.equal(softEqualNormalized("اب", "اب"), true);
assert.equal(softEqualNormalized("اب", "ام"), false); // قصيرة — بلا تسامح
assert.ok(levenshteinAtMost("الصراط", "الصراط", 1) === 0);
assert.ok(softEqualNormalized("الصراط", "الصراظ") || levenshteinAtMost("الصراط", "الصراظ", 1) === 1);

const { fresh, nextNormsTail } = dedupeOverlappingWords(["الحمد", "لله"], ["الحمد", "لله", "رب"]);
assert.deepEqual(fresh.map((w) => w), ["رب"]);
assert.ok(nextNormsTail.includes("رب"));

const softOps = alignFittingWindow(["الحمد"], ["الحمد", "لله"]);
assert.ok(softOps.some((o) => o.type === "match"));

const serverSrc = readFileSync(resolve(root, "lib/recitation-ai/providers/server-provider.ts"), "utf8");
assert.match(serverSrc, /EnergyVad/);
assert.match(serverSrc, /MAX_IN_FLIGHT/);
assert.match(serverSrc, /speechEnded/);
assert.match(serverSrc, /onPipelineStatus/);

const webSrc = readFileSync(resolve(root, "lib/recitation-ai/providers/web-speech-provider.ts"), "utf8");
assert.match(webSrc, /INTERIM_CONFIDENCE/);
assert.match(webSrc, /emittedInterimNorms/);

const viewSrc = readFileSync(resolve(root, "pages/quran/ui/RecitationTestView.tsx"), "utf8");
assert.match(viewSrc, /جاري المطابقة/);
assert.match(viewSrc, /onPipelineStatus/);

console.log("streaming-latency.test.ts: ok");
