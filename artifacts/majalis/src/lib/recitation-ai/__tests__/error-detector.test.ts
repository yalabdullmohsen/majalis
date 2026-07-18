/**
 * اختبارات postProcessAlignmentEvents — src/lib/recitation-ai/error-detector.ts
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/error-detector.test.ts
 */
import { postProcessAlignmentEvents } from "../error-detector";
import type { AlignmentEvent, ReferenceWord } from "../types";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

function ref(raw: string, wordIndex = 0): ReferenceWord {
  return { surah: 1, ayah: 1, wordIndex, globalIndex: wordIndex, raw, normalized: raw };
}

console.log("═══ detectOutOfOrder ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "correct", ref: ref("الحمد", 0), confidence: 95 },
    { kind: "error", errorType: "missing_word", ref: ref("لله", 1), heardWord: null, confidence: 70 },
    { kind: "error", errorType: "extra_word", ref: null, heardWord: "لله", confidence: 60 },
    { kind: "correct", ref: ref("رب", 2), confidence: 95 },
  ];
  const result = postProcessAlignmentEvents(events);
  assert(result.length === 3, `4 أحداث ← 3 بعد دمج missing+extra كـout_of_order (${result.length})`);
  assert(result.some((e) => e.kind === "error" && e.errorType === "out_of_order"), "out_of_order موجود في النتيجة");
  assert(!result.some((e) => e.kind === "error" && (e.errorType === "missing_word" || e.errorType === "extra_word")), "لا missing_word ولا extra_word منفصلين بعد الدمج");
}

console.log("═══ لا دمج إن كانت الكلمات مختلفة فعلاً ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "missing_word", ref: ref("لله", 1), heardWord: null, confidence: 70 },
    { kind: "error", errorType: "extra_word", ref: null, heardWord: "كلمة_غير_مرتبطة", confidence: 60 },
  ];
  const result = postProcessAlignmentEvents(events);
  assert(result.length === 2, "لا دمج لأن الكلمتين مختلفتان");
}

console.log("═══ detectWrongStart ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "extra_word", ref: null, heardWord: "كلام", confidence: 60 },
    { kind: "error", errorType: "extra_word", ref: null, heardWord: "غريب", confidence: 60 },
    { kind: "correct", ref: ref("الحمد", 0), confidence: 95 },
  ];
  const result = postProcessAlignmentEvents(events);
  assert(result[0].kind === "error" && result[0].errorType === "wrong_start", "أول عنصر أصبح wrong_start واحد");
  assert(result.length === 2, "خطآن مدموجان في واحد + الصحيح المتبقي = عنصران");
}

console.log("═══ لا wrong_start لخطأ واحد فقط في البداية ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "extra_word", ref: null, heardWord: "كلام", confidence: 60 },
    { kind: "correct", ref: ref("الحمد", 0), confidence: 95 },
  ];
  const result = postProcessAlignmentEvents(events);
  assert(!result.some((e) => e.kind === "error" && e.errorType === "wrong_start"), "خطأ واحد فقط ← لا يُصنَّف wrong_start (العتبة 2)");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
