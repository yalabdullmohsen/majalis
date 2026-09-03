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
import { getRecitationWsUrl, SLICE_MS as SharedSlice } from "../streaming-audio";
import { alignFittingWindow } from "../word-alignment";
import { normalizeQuranWord } from "../quran-normalize";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

assert.equal(SLICE_MS, SharedSlice);
assert.ok(SLICE_MS <= 300 && SLICE_MS >= 200, `SLICE_MS في النطاق 200–300 (حصل ${SLICE_MS})`);
assert.ok(WINDOW_SLICES >= 2 && WINDOW_SLICES <= 4, "نافذة شرائح معقولة");
assert.equal(getRecitationWsUrl(), null, "بلا VITE_RECITATION_WS_URL في الاختبار");

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

// تطبيع عربي حي: تشكيل + ألف/ياء
assert.equal(normalizeQuranWord("الْحَمْدُ"), "الحمد");
assert.equal(normalizeQuranWord("ٱلرَّحْمَٰنِ"), normalizeQuranWord("الرحمن"));

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
assert.match(serverSrc, /streaming-audio/);

const wsSrc = readFileSync(resolve(root, "lib/recitation-ai/providers/websocket-provider.ts"), "utf8");
assert.match(wsSrc, /WebSocketQuranASRProvider/);
assert.match(wsSrc, /EnergyVad/);
assert.match(wsSrc, /SLICE_MS/);
assert.match(wsSrc, /getRecitationWsUrl/);

const regSrc = readFileSync(resolve(root, "lib/recitation-ai/provider-registry.ts"), "utf8");
assert.match(regSrc, /WebSocketQuranASRProvider/);
assert.match(regSrc, /ServerQuranASRProvider/);
assert.match(regSrc, /احتياط: التعرّف الصوتي في المتصفح/);
// الخادم قبل Web Speech في المسار العادي (أول ظهور لـ server.isAvailable قبل webSpeechOk)
{
  const serverIdx = regSrc.indexOf("await server.isAvailable()");
  const webSpeechIdx = regSrc.indexOf("await webSpeech.isAvailable()");
  assert.ok(serverIdx > 0 && webSpeechIdx > serverIdx, "المزوّد الخادمي قبل Web Speech في registry");
}

const webSrc = readFileSync(resolve(root, "lib/recitation-ai/providers/web-speech-provider.ts"), "utf8");
assert.match(webSrc, /INTERIM_CONFIDENCE/);
assert.match(webSrc, /emittedInterimNorms/);

const warmSrc = readFileSync(resolve(root, "lib/recitation-ai/warm-connection.ts"), "utf8");
assert.match(warmSrc, /warmRecitationWsConnection/);

const viewSrc = readFileSync(resolve(root, "pages/quran/ui/RecitationTestView.tsx"), "utf8");
assert.match(viewSrc, /جاري المطابقة/);
assert.match(viewSrc, /onPipelineStatus/);
assert.match(viewSrc, /rai-word-/);
assert.match(viewSrc, /MicPermissionHelp/);
assert.match(viewSrc, /warmRecitationWsConnection/);
assert.match(viewSrc, /ابدأ التلاوة/);
assert.match(viewSrc, /activeWordRef/);
assert.match(viewSrc, /cursorWordRef/);

const mushafSrc = readFileSync(resolve(root, "components/quran/InteractiveMushafReveal.tsx"), "utf8");
assert.match(mushafSrc, /imr-word--cursor/);
assert.match(mushafSrc, /rai-word-/);
assert.match(mushafSrc, /cursorWordRef/);

const liveRecSrc = readFileSync(resolve(root, "components/recitation/LiveRecitation.tsx"), "utf8");
assert.match(liveRecSrc, /useSpeechRecognition/);
assert.match(liveRecSrc, /matchRecitationAdvanced/);
assert.match(liveRecSrc, /scrollIntoView/);
assert.match(liveRecSrc, /activeWordRef/);
assert.doesNotMatch(liveRecSrc, /MOCK_AYAH/);

const cssSrc = readFileSync(resolve(root, "styles/recitation-ai.css"), "utf8");
assert.match(cssSrc, /\.imr-word--revealed[\s\S]*--rai-emerald/);
assert.match(cssSrc, /\.imr-word--error[\s\S]*#dc2626/);
assert.match(cssSrc, /\.imr-word--cursor[\s\S]*scale\(1\.06\)/);

const hookSrc = readFileSync(resolve(root, "hooks/useSpeechRecognition.ts"), "utf8");
assert.match(hookSrc, /interimResults = true/);
assert.match(hookSrc, /isWebSpeechRecognitionSupported/);

console.log("streaming-latency.test.ts: ok");
