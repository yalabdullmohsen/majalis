/**
 * كمون التسميع — متتبع القياسات + أهداف + حالات الواجهة.
 * تشغيل: npx tsx src/lib/__tests__/recitation-mic-latency.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createMicLatencyTracker,
  MIC_LATENCY_TARGETS,
} from "../recitation-mic-latency";
import { recitationStatusLabel } from "../../hooks/useRecitationTest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

assert.equal(MIC_LATENCY_TARGETS.buttonToCaptureMs, 300);
assert.equal(MIC_LATENCY_TARGETS.sessionToFirstBufferMs, 150);
assert.equal(MIC_LATENCY_TARGETS.buttonToFirstPartialMs, 800);
assert.equal(MIC_LATENCY_TARGETS.noBufferTimeoutMs, 1000);

const tracker = createMicLatencyTracker();
tracker.markButton();
tracker.ingestNative({ event: "first_buffer", msFromButton: 420, msFromTap: 90, cold: true });
tracker.ingestNative({ event: "first_partial", msFromButton: 980, msFromTap: 650, cold: true });
tracker.ingestNative({ event: "first_buffer", msFromButton: 180, msFromTap: 40, cold: false });
tracker.ingestNative({ event: "first_partial", msFromButton: 520, msFromTap: 380, cold: false });

const summary = tracker.summarize();
assert.equal(summary.coldStartButtonToFirstBufferMs, 420);
assert.equal(summary.warmStartButtonToFirstBufferMs, 180);
assert.equal(summary.coldStartButtonToFirstPartialMs, 980);
assert.equal(summary.warmStartButtonToFirstPartialMs, 520);
assert.ok((summary.warmStartButtonToFirstBufferMs ?? 9999) < MIC_LATENCY_TARGETS.buttonToCaptureMs);
assert.ok((summary.lastTapToFirstBufferMs ?? 9999) < MIC_LATENCY_TARGETS.sessionToFirstBufferMs);

assert.equal(recitationStatusLabel("warming"), "جارٍ تهيئة الميكروفون…");
assert.equal(recitationStatusLabel("listening"), "استمع الآن");
assert.equal(recitationStatusLabel("no_audio"), "لم يصل صوت من الميكروفون");

const swift = readFileSync(
  resolve(appRoot, "ios/App/App/MajlisSpeechRecognitionPlugin.swift"),
  "utf8",
);
assert.match(swift, /func prepare\(/);
assert.match(swift, /func teardown\(/);
assert.match(swift, /NO_AUDIO_BUFFER/);
assert.match(swift, /shouldReportPartialResults/);
assert.match(swift, /bufferSize:\s*512/);
assert.match(swift, /keepWarm/);
assert.match(swift, /sessionGeneration/);
assert.ok(
  (swift.match(/recognitionTask\s*=/g) || []).length >= 1,
  "recognition task assigned",
);
assert.match(swift, /SESSION_SUPERSEDED/);

const jsBridge = readFileSync(resolve(appRoot, "src/lib/plugins/speech-recognition.ts"), "utf8");
assert.match(jsBridge, /prepare\(/);
assert.match(jsBridge, /teardown\(/);
assert.match(jsBridge, /stopQuranPlaybackForRecitation/);

const onDevice = readFileSync(
  resolve(appRoot, "src/lib/recitation-ai/providers/on-device-provider.ts"),
  "utf8",
);
assert.match(onDevice, /activeSessionId/);
assert.match(onDevice, /async prepare\(/);
assert.match(onDevice, /onAudioLevel/);
assert.ok(
  onDevice.includes("if (this.activeSessionId)"),
  "يمنع جلسة مزدوجة قبل البدء",
);

const hook = readFileSync(resolve(appRoot, "src/hooks/useRecitationTest.ts"), "utf8");
assert.match(hook, /startingRef/);
assert.match(hook, /"warming"/);
assert.match(hook, /"no_audio"/);
assert.match(hook, /plugin\.prepare/);

console.log("recitation-mic-latency.test.ts: ok");
