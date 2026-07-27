/**
 * session-event-policy.ts
 * سياسة أحداث الجلسة حسب مستوى التنبيه — تُحوِّل أحداث المحرك الخام
 * إلى سلوك واجهة/تقدم صادق:
 *   - gentle: أخطاء الاستبدال → needs_repeat (لا جزم أحمر فوري)
 *   - medium: أخطاء مؤكَّدة تُسجَّل، بلا إيقاف الجلسة
 *   - immediate: بطاقة تصحيح فورية دون إيقاف الميكروفون
 *   - teacher: إيقاف فعلي حتى إعادة من موضع الخطأ
 *
 * كذلك تُعلِن هل يجب "تعليق المؤشر" (عدم اعتبار الكلمة محسومة) عند
 * unclear / needs_repeat حتى يُعاد نطقها — كان المحرك يُقدِّم المؤشر
 * فيُفقَد معنى "أعد الكلمة".
 */
import type { AlertLevel, AlignmentEvent } from "./types";

export type EventPolicyDecision = {
  events: AlignmentEvent[];
  /** true: أوقف الاستماع وافتح بطاقة معلّم إلزامية */
  holdSession: boolean;
  /** true: اعرض بطاقة تصحيح (اختيارية أو إلزامية حسب holdSession) */
  showCorrection: boolean;
  softPrompt: string | null;
};

/** هل هذا الحدث يعني أن مؤشر المرجع يجب ألا يتقدّم؟ */
export function shouldHoldReferenceCursor(event: AlignmentEvent): boolean {
  return event.kind === "unclear" || event.kind === "needs_repeat";
}

export function applyAlertPolicy(events: AlignmentEvent[], alertLevel: AlertLevel): EventPolicyDecision {
  let holdSession = false;
  let showCorrection = false;
  let softPrompt: string | null = null;

  const mapped: AlignmentEvent[] = events.map((e) => {
    if (e.kind === "unclear") {
      softPrompt = "لم أسمع بوضوح — أعد الكلمة من فضلك";
      return e;
    }
    if (e.kind === "needs_repeat") {
      softPrompt = "أعد الكلمة للتأكيد";
      if (alertLevel === "immediate" || alertLevel === "teacher") showCorrection = true;
      return e;
    }
    if (e.kind !== "error") return e;

    // لطيف: حوّل wrong_word إلى needs_repeat (تقليل الإنذارات الخاطئة)
    if (alertLevel === "gentle" && e.errorType === "wrong_word" && e.ref && e.heardWord) {
      softPrompt = "أعد الكلمة للتأكيد";
      return { kind: "needs_repeat", ref: e.ref, heardWord: e.heardWord, confidence: e.confidence };
    }

    if (alertLevel === "medium" && (e.errorType === "wrong_word" || e.errorType === "missing_word")) {
      softPrompt = e.note ?? "لاحظ موضعًا يحتاج مراجعة";
      showCorrection = true;
      return e;
    }

    if (alertLevel === "immediate") {
      showCorrection = true;
      return e;
    }

    if (alertLevel === "teacher" && e.errorType !== "long_pause" && e.errorType !== "repetition") {
      holdSession = true;
      showCorrection = true;
      return e;
    }

    return e;
  });

  return { events: mapped, holdSession, showCorrection, softPrompt };
}
