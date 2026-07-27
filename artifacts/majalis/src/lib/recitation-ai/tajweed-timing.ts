/**
 * tajweed-timing.ts
 * ملاحظات تجويد قابلة للقياس من الطوابع الزمنية للكلمات فقط —
 * بلا ادعاء فونيمي غير مدعوم. القواعد الحالية:
 *   - madd_tabeei_suspect: كلمة تحوي حرف مدّ (ا/و/ي أو ألف خنجرية) ومدتها
 *     أقصر بكثير من المتوقع (~180ms كحد أدنى تقريبي لحركة المدّ الطبيعي)
 *     أو أطول بكثير من سقف معقول (~900ms) ⇒ ملاحظة محتملة بثقة منخفضة.
 *
 * كل ملاحظة confidencePct < 85 تُعرض بصيغة "قد توجد ملاحظة" لا جزم.
 */
import type { ReferenceWord, TajweedNote } from "./types";

export type TimedHeardWord = {
  word: string;
  startSec: number | null;
  endSec: number | null;
};

const MADD_CHARS = /[اويىٰٱ]/;
/** حد أدنى تقريبي لمدة كلمة فيها مد طبيعي (ثانية) */
const MADD_MIN_SEC = 0.18;
/** سقف معقول قبل اعتبار المد زائدًا بوضوح */
const MADD_MAX_SEC = 0.95;

function durationSec(w: TimedHeardWord): number | null {
  if (w.startSec == null || w.endSec == null) return null;
  const d = w.endSec - w.startSec;
  return d > 0 ? d : null;
}

function hasMaddLetter(raw: string): boolean {
  return MADD_CHARS.test(raw);
}

/**
 * يقارن كلمات مسموعة ذات طوابع زمنية مع المرجع المقابل (بنفس الترتيب
 * بعد المحاذاة الناجحة فقط — يُمرَّر للملاحظات على الكلمات الصحيحة).
 */
export function analyzeTajweedTimings(
  pairs: { ref: ReferenceWord; heard: TimedHeardWord }[],
): TajweedNote[] {
  const notes: TajweedNote[] = [];
  for (const { ref, heard } of pairs) {
    if (!hasMaddLetter(ref.raw) && !hasMaddLetter(heard.word)) continue;
    const dur = durationSec(heard);
    if (dur == null) continue;

    if (dur < MADD_MIN_SEC) {
      notes.push({
        ref,
        rule: "madd_tabeei_short",
        confidencePct: 62,
        message: "قد يكون المدّ أقصر من المتوقع في هذه الكلمة — أعد سماعها من قارئ معتمد.",
      });
    } else if (dur > MADD_MAX_SEC) {
      notes.push({
        ref,
        rule: "madd_tabeei_long",
        confidencePct: 58,
        message: "قد يكون المدّ أطول من المعتاد هنا — راجع حكم المد مع معلّم إن أمكن.",
      });
    }
  }
  return notes;
}
