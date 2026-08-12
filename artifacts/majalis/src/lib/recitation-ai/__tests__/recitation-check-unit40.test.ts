/**
 * بوابة الوحدة ٤٠ — تصحيح التلاوة / التسميع.
 * تشغيل: node --import tsx src/lib/recitation-ai/__tests__/recitation-check-unit40.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyAlertPolicy } from "../session-event-policy";
import {
  buildTasmeeSessionReport,
  extractStopPositions,
  TASMEE_LAST_REPORT_KEY,
} from "../hifz-session-bridge";
import { TASMEE_PLAYBACK_RESUME_KEY } from "../playback-handoff";
import type { AlignmentEvent, ReferenceWord } from "../types";
import { MIC_LATENCY_TARGETS } from "../../recitation-mic-latency";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../..");

function ref(raw: string, ayah = 1, wordIndex = 0): ReferenceWord {
  return {
    surah: 1,
    ayah,
    wordIndex,
    globalIndex: wordIndex,
    raw,
    normalized: raw,
    page: 1,
  };
}

assert.ok(MIC_LATENCY_TARGETS.buttonToCaptureMs <= 300, "هدف كمون التمييز ≤300ms");

{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "wrong_word", ref: ref("الحمد"), heardWord: "الهمد", confidence: 80 },
  ];
  const d = applyAlertPolicy(events, "gentle");
  assert.equal(d.events[0]?.kind, "needs_repeat");
  assert.equal(d.showCorrection, true);
  assert.equal(d.softPause, true);
  assert.equal(d.holdSession, false);
  assert.match(d.softPrompt ?? "", /تلقين|به دوء|هدوء|أعد/i);
}

{
  const words = [ref("بسم", 1, 0), ref("الله", 1, 1), ref("الرحمن", 1, 2)];
  const events: AlignmentEvent[] = [
    { kind: "correct", ref: words[0]!, confidence: 95 },
    { kind: "error", errorType: "wrong_word", ref: words[1]!, heardWord: "الل", confidence: 70 },
    { kind: "needs_repeat", ref: words[2]!, heardWord: "الرحم", confidence: 65 },
  ];
  const stops = extractStopPositions(events);
  assert.equal(stops.length, 2);
  const report = buildTasmeeSessionReport(words, events);
  assert.equal(report.ayahCount, 1);
  assert.equal(report.correctWords, 1);
  assert.equal(report.totalWords, 3);
  assert.equal(report.masteryPct, 33);
  assert.ok(report.stopPositions.length >= 2);
}

{
  const view = readFileSync(resolve(root, "src/pages/quran/ui/RecitationTestView.tsx"), "utf8");
  assert.match(view, /playTalqinForCorrection|تلقين/);
  assert.match(view, /applyTasmeeReportToHifz/);
  assert.match(view, /pausePlaybackForTasmee/);
  assert.match(view, /resumePlaybackAfterTasmee/);
  assert.match(view, /revokeRecitationAiConsent/);
  assert.match(view, /softHold/);
  assert.match(view, /provider\.endSession/);
}

{
  const handoff = readFileSync(resolve(root, "src/lib/recitation-ai/playback-handoff.ts"), "utf8");
  assert.match(handoff, /TASMEE_PLAYBACK_RESUME_KEY/);
  assert.match(handoff, /playTalqinAyah/);
  assert.match(handoff, /engine\.stop/);
  assert.match(handoff, /playAyah/);
}

{
  const plist = readFileSync(resolve(root, "ios/App/App/Info.plist"), "utf8");
  assert.match(plist, /NSMicrophoneUsageDescription/);
  assert.match(plist, /تلاوة|تسميع|ميكروفون/);
  assert.match(plist, /NSSpeechRecognitionUsageDescription/);
}

{
  assert.equal(TASMEE_LAST_REPORT_KEY, "mj-tasmee-last-report-v1");
  assert.equal(TASMEE_PLAYBACK_RESUME_KEY, "mj-tasmee-playback-resume-v1");
}

assert.ok(existsSync(resolve(root, "src/lib/recitation-ai/hifz-session-bridge.ts")));
assert.ok(existsSync(resolve(root, "src/lib/recitation-ai/playback-handoff.ts")));

console.log("recitation-check-unit40.test.ts: ok");
