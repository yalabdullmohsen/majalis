/**
 * error-detector.ts
 * طبقة 6 من القسم 4: تُعالج دفعة أحداث محاذاة خامة (من VerseAlignmentEngine)
 * بعد انتهاء الجلسة (أو انتهاء آية) لاكتشاف نمطين لا يُصدرهما المحرك
 * مباشرة لأنهما يحتاجان النظر لعدة أحداث متتالية معًا:
 *
 * 1. "تقديم/تأخير" (out_of_order): missing_word لكلمة X تلاها extra_word
 *    بنص يطابق X خلال مسافة قصيرة — إعادة تصنيف كخطأ واحد بدل اثنين.
 * 2. "بداية خاطئة" (wrong_start): سلسلة أخطاء (extra_word/wrong_word)
 *    فور بداية الجلسة قبل أي correct — تُدمَج في خطأ واحد بدل عدّة.
 *
 * وحدة نقية بلا حالة: تستقبل مصفوفة أحداث كاملة وتُعيد نسخة مُعاد تصنيفها.
 */
import type { AlignmentEvent } from "./types";

const OUT_OF_ORDER_WINDOW = 3; // أقصى مسافة (بعدد الأحداث) بين missing وextra ليُعدّا تقديمًا/تأخيرًا
const WRONG_START_MIN_ERRORS = 2; // أقل عدد أخطاء متتالية في البداية لتُصنَّف "بداية خاطئة"

function normLoose(s: string): string {
  return s.trim();
}

export function postProcessAlignmentEvents(events: AlignmentEvent[]): AlignmentEvent[] {
  let result = detectOutOfOrder(events);
  result = detectWrongAyahJump(result);
  result = detectWrongStart(result);
  return result;
}

function detectOutOfOrder(events: AlignmentEvent[]): AlignmentEvent[] {
  const out: AlignmentEvent[] = [...events];
  const consumed = new Set<number>();

  for (let i = 0; i < out.length; i++) {
    if (consumed.has(i)) continue;
    const e = out[i];
    if (e.kind !== "error" || e.errorType !== "missing_word" || !e.ref) continue;

    const targetNorm = e.ref.normalized;
    const windowEnd = Math.min(out.length, i + 1 + OUT_OF_ORDER_WINDOW);
    for (let j = i + 1; j < windowEnd; j++) {
      if (consumed.has(j)) continue;
      const cand = out[j];
      if (cand.kind === "error" && cand.errorType === "extra_word" && cand.heardWord) {
        if (normLoose(cand.heardWord) === normLoose(targetNorm) || normLoose(cand.heardWord) === normLoose(e.ref.raw)) {
          out[i] = {
            kind: "error",
            errorType: "out_of_order",
            ref: e.ref,
            heardWord: cand.heardWord,
            confidence: Math.min(e.confidence, cand.confidence),
            note: "تقديم/تأخير مكتشَف — كلمة نُطقت في موضع غير موضعها",
          };
          consumed.add(j);
          break;
        }
      }
    }
  }

  return out.filter((_, idx) => !consumed.has(idx));
}

function detectWrongStart(events: AlignmentEvent[]): AlignmentEvent[] {
  let firstCorrectIdx = events.findIndex((e) => e.kind === "correct");
  if (firstCorrectIdx === -1) firstCorrectIdx = events.length;

  const leadingErrors = events
    .slice(0, firstCorrectIdx)
    .filter(
      (e): e is Extract<AlignmentEvent, { kind: "error" }> =>
        e.kind === "error" && (e.errorType === "extra_word" || e.errorType === "wrong_word"),
    );

  if (leadingErrors.length < WRONG_START_MIN_ERRORS) return events;

  const merged: AlignmentEvent = {
    kind: "error",
    errorType: "wrong_start",
    ref: null,
    heardWord: leadingErrors.map((e) => e.heardWord).filter(Boolean).join(" "),
    confidence: Math.min(...leadingErrors.map((e) => e.confidence)),
    note: `بداية من موضع غير صحيح (${leadingErrors.length} كلمات لا تطابق بداية النطاق المطلوب)`,
  };

  const rest = events.slice(0, firstCorrectIdx).filter((e: AlignmentEvent) => !(leadingErrors as AlignmentEvent[]).includes(e));
  return [merged, ...rest, ...events.slice(firstCorrectIdx)];
}

/**
 * قفز لآية خاطئة: سلسلة wrong_word متتالية (≥3) بلا correct بينها،
 * ثم عودة لصحيح — تُعاد صياغتها كـ wrong_ayah_jump واحد بدل عدّة أخطاء
 * استبدال (إشارة إلى انتقال لمتشابه/موضع آخر ثم العودة أو التصحيح).
 */
function detectWrongAyahJump(events: AlignmentEvent[]): AlignmentEvent[] {
  const JUMP_MIN = 3;
  const out: AlignmentEvent[] = [];
  let i = 0;
  while (i < events.length) {
    const e = events[i];
    if (e.kind === "error" && e.errorType === "wrong_word") {
      let j = i;
      const streak: Extract<AlignmentEvent, { kind: "error" }>[] = [];
      while (
        j < events.length &&
        events[j].kind === "error" &&
        (events[j] as Extract<AlignmentEvent, { kind: "error" }>).errorType === "wrong_word"
      ) {
        streak.push(events[j] as Extract<AlignmentEvent, { kind: "error" }>);
        j += 1;
      }
      if (streak.length >= JUMP_MIN) {
        out.push({
          kind: "error",
          errorType: "wrong_ayah_jump",
          ref: streak[0].ref,
          heardWord: streak.map((s) => s.heardWord).filter(Boolean).join(" "),
          confidence: Math.min(...streak.map((s) => s.confidence)),
          note: `انتقال محتمل لموضع/آية مختلفة (${streak.length} كلمات متتالية لا تطابق السياق)`,
        });
        i = j;
        continue;
      }
    }
    out.push(e);
    i += 1;
  }
  return out;
}
