/**
 * اختبارات WER + ملاحظات التجويد الزمنية + ربط الطوابع بالمرجع.
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/wer-tajweed-harness.test.ts
 */
import { computeWer } from "../wer";
import { analyzeTajweedTimings } from "../tajweed-timing";
import { pairCorrectEventsWithTimedWords } from "../pair-timed-refs";
import { normalizeQuranWord } from "../quran-normalize";
import type { AlignmentEvent, ReferenceWord } from "../types";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

function ref(raw: string, wordIndex = 0): ReferenceWord {
  return {
    surah: 1,
    ayah: 1,
    wordIndex,
    globalIndex: wordIndex,
    raw,
    normalized: normalizeQuranWord(raw),
    page: 1,
  };
}

console.log("═══ computeWer — تطابق كامل ═══");
{
  const r = computeWer(["بسم", "الله"], ["بسم", "الله"]);
  assert(r.wer === 0, "WER=0 عند التطابق");
  assert(r.substitutions === 0 && r.deletions === 0 && r.insertions === 0, "بلا عمليات");
}

console.log("═══ computeWer — استبدال + حذف + زيادة ═══");
{
  // ref: a b c | hyp: a x c d → 1 sub (b→x), 1 ins (d)
  const r = computeWer(["a", "b", "c"], ["a", "x", "c", "d"]);
  assert(r.substitutions === 1, `استبدال واحد (فعلي: ${r.substitutions})`);
  assert(r.insertions === 1, `زيادة واحدة (فعلي: ${r.insertions})`);
  assert(r.deletions === 0, "بلا حذف");
  assert(Math.abs(r.wer - 2 / 3) < 1e-9, `WER=2/3 (فعلي: ${r.wer})`);
}

console.log("═══ analyzeTajweedTimings — مد قصير ═══");
{
  const notes = analyzeTajweedTimings([
    {
      ref: ref("الرحمن"),
      heard: { word: "الرحمن", startSec: 0, endSec: 0.1 },
    },
  ]);
  assert(notes.length === 1, "ملاحظة مد قصير");
  assert(notes[0].rule === "madd_tabeei_short", "قاعدة madd_tabeei_short");
  assert(notes[0].confidencePct < 85, "ثقة أقل من 85 ⇒ صيغة «قد»");
}

console.log("═══ analyzeTajweedTimings — بلا مد لا ملاحظة ═══");
{
  const notes = analyzeTajweedTimings([
    {
      ref: ref("قل"),
      heard: { word: "قل", startSec: 0, endSec: 0.05 },
    },
  ]);
  assert(notes.length === 0, "كلمة بلا حرف مد لا تُنتج ملاحظة");
}

console.log("═══ pairCorrectEventsWithTimedWords ═══");
{
  const events: AlignmentEvent[] = [
    { kind: "correct", ref: ref("بسم", 0), confidence: 90 },
    { kind: "error", errorType: "wrong_word", ref: ref("الله", 1), heardWord: "الل", confidence: 80 },
    { kind: "correct", ref: ref("الرحمن", 2), confidence: 88 },
  ];
  const timed = [
    { word: "بسم", startSec: 0, endSec: 0.2 },
    { word: "الل", startSec: 0.2, endSec: 0.4 },
    { word: "الرحمن", startSec: 0.4, endSec: 0.9 },
  ];
  const pairs = pairCorrectEventsWithTimedWords(events, timed);
  assert(pairs.length === 2, `زوجان صحيحان (فعلي: ${pairs.length})`);
  assert(pairs[0].ref.raw === "بسم" && pairs[1].ref.raw === "الرحمن", "الترتيب الصحيح");
}

console.log(`\n${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
