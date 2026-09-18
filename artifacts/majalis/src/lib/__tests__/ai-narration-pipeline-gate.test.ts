/**
 * بوابة مسار السرد الواعي — أوضاع + بروفيلات + Prep قبل الجهاز.
 * node --import tsx src/lib/__tests__/ai-narration-pipeline-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  prepareArabicForNarration,
  prepareNarrationForPlayback,
  resolveNarrationProsody,
  lexiconWordCount,
} from "@/lib/ai-narration";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== Profiles resolve ===");
{
  const edu = resolveNarrationProsody({ mode: "educational", contentKind: "lesson" });
  assert.ok(edu.rate < 0.95, "تعليمي أبطأ");
  assert.ok(edu.breakScale > 1, "وقفات أوضح");
  const imm = resolveNarrationProsody({ mode: "immersive", contentKind: "prophet_story" });
  assert.equal(imm.mode, "immersive");
}

console.log("=== Arabic prep does not invent words ===");
{
  const src = "ابن تيمية  ،  والعقيدة.";
  const out = prepareArabicForNarration(src);
  assert.ok(out.includes("ابن تيمية"));
  assert.ok(out.includes("العقيدة"));
  assert.doesNotMatch(out, /https?:\/\//);
}

console.log("=== Prepare never exposes raw unprepared path in orchestrator ===");
{
  const orch = read("src/lib/ai-narration/ai-reader-orchestrator.ts");
  assert.match(orch, /speakDevicePrepared/);
  assert.match(orch, /speakArabicSegments/);
  assert.match(orch, /prepareArabicForNarration/);
  assert.match(orch, /resolveNarrationProsody/);
  assert.doesNotMatch(orch, /speakArabicText\(/);
}

console.log("=== Progressive speech helper exists ===");
{
  const speech = read("src/lib/speech-read-aloud.ts");
  assert.match(speech, /speakArabicSegments/);
  assert.match(speech, /gapMs/);
}

console.log("=== Lexicon expanded + prophet prepare works ===");
{
  assert.ok(lexiconWordCount() >= 50, "قاموس أوسع");
  const prepared = prepareNarrationForPlayback({
    contentId: "prophet:nuh",
    title: "نوح عليه السلام",
    body: "مقدمة تحريرية عن الدعوة والصبر.",
    mode: "immersive",
    contentKind: "prophet_story",
  });
  assert.ok(prepared.speakableText.length > 0);
  assert.ok(prepared.deviceSegmentTexts.length >= 1);
  assert.equal(prepared.prosody.mode, "immersive");
  assert.ok(prepared.ssml.includes("<break"));
}

console.log("=== Architecture doc present ===");
{
  const doc = read("src/lib/ai-narration/ARCHITECTURE_AI_NARRATION.md");
  assert.match(doc, /Current narration architecture/);
  assert.match(doc, /Weaknesses found/);
  assert.match(doc, /AI narration design/);
  assert.match(doc, /Fallback/);
  assert.match(doc, /ممنوع/);
}

console.log("ai-narration-pipeline-gate.test.ts: ok");
