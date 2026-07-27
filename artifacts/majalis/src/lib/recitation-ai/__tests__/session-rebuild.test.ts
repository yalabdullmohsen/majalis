/**
 * اختبارات سياسة أحداث الجلسة + إزالة تكرار النوافذ المتداخلة.
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/session-rebuild.test.ts
 */
import { applyAlertPolicy, shouldHoldReferenceCursor } from "../session-event-policy";
import { dedupeOverlappingWords } from "../providers/server-provider";
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

console.log("═══ applyAlertPolicy — gentle يحوّل wrong_word إلى needs_repeat ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "wrong_word", ref: ref("الحمد"), heardWord: "الهمد", confidence: 80 },
  ];
  const d = applyAlertPolicy(events, "gentle");
  assert(d.events[0].kind === "needs_repeat", "gentle → needs_repeat");
  assert(d.holdSession === false, "gentle لا يوقف الجلسة");
  assert(!!d.softPrompt, "رسالة هادئة موجودة");
}

console.log("═══ applyAlertPolicy — teacher يوقف عند خطأ مؤكَّد ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "wrong_word", ref: ref("الحمد"), heardWord: "الهمد", confidence: 90 },
  ];
  const d = applyAlertPolicy(events, "teacher");
  assert(d.holdSession === true, "teacher → holdSession");
  assert(d.showCorrection === true, "teacher → بطاقة تصحيح");
}

console.log("═══ shouldHoldReferenceCursor ═══");
{
  assert(shouldHoldReferenceCursor({ kind: "unclear", ref: ref("لله"), heardWord: "ل", confidence: 40 }), "unclear يعلّق");
  assert(shouldHoldReferenceCursor({ kind: "needs_repeat", ref: ref("لله"), heardWord: "له", confidence: 70 }), "needs_repeat يعلّق");
  assert(!shouldHoldReferenceCursor({ kind: "correct", ref: ref("لله"), confidence: 95 }), "correct لا يعلّق");
}

console.log("═══ dedupeOverlappingWords ═══");
{
  const a = dedupeOverlappingWords(["بسم", "الله"], ["بسم", "الله", "الرحمن"]);
  assert(a.fresh.join(" ") === "الرحمن", `يزيل التداخل (الفعلي: ${a.fresh.join(" ")})`);
  const b = dedupeOverlappingWords([], ["قل", "هو"]);
  assert(b.fresh.join(" ") === "قل هو", "بدون تداخل يمرّر الكل");
}

console.log("═══ detectWrongAyahJump ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "error", errorType: "wrong_word", ref: ref("ا", 0), heardWord: "س", confidence: 70 },
    { kind: "error", errorType: "wrong_word", ref: ref("ب", 1), heardWord: "ص", confidence: 70 },
    { kind: "error", errorType: "wrong_word", ref: ref("ج", 2), heardWord: "د", confidence: 70 },
    { kind: "correct", ref: ref("الحمد", 3), confidence: 95 },
  ];
  const result = postProcessAlignmentEvents(events);
  assert(result.some((e) => e.kind === "error" && e.errorType === "wrong_ayah_jump"), "wrong_ayah_jump بعد 3 استبدالات");
  assert(result.filter((e) => e.kind === "error" && e.errorType === "wrong_word").length === 0, "لا تبقى wrong_word منفصلة في السلسلة");
}

console.log(`\n${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
