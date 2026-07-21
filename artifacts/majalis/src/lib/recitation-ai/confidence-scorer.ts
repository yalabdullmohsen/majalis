/**
 * confidence-scorer.ts
 * طبقة 8 من القسم 4. وحدة نقية صغيرة: تقرّر كيف تُعرَض درجة ثقة كنص
 * للمستخدم — خصوصًا "قاعدة الصدق العلمي" الإلزامية في القسم 3 لملاحظات
 * التجويد: دون عتبة 85% تُعرض بصيغة "قد توجد ملاحظة..." لا جزمًا أبدًا.
 * أخطاء الحفظ (غير التجويدية) لا تخضع لنفس العتبة — الحفظ إما مطابق
 * للنص المرجعي حرفيًا أو لا، فلا لبس فونيمي يستدعي التحوّط اللغوي.
 */

export const TAJWEED_CONFIDENCE_THRESHOLD = 85;

export type ConfidenceBand = "high" | "medium" | "low";

export function confidenceBand(pct: number): ConfidenceBand {
  if (pct >= 85) return "high";
  if (pct >= 60) return "medium";
  return "low";
}

/**
 * يبني نص عرض ملاحظة تجويدية بحسب قاعدة الصدق العلمي — لا جزم أبدًا دون
 * العتبة. مثال: "قد توجد ملاحظة في المدّ اللازم عند كلمة ...".
 */
export function formatTajweedNoteMessage(ruleLabel: string, wordRaw: string, confidencePct: number): string {
  if (confidencePct >= TAJWEED_CONFIDENCE_THRESHOLD) {
    return `ملاحظة أداء: ${ruleLabel} عند كلمة "${wordRaw}"`;
  }
  return `قد توجد ملاحظة في ${ruleLabel} عند كلمة "${wordRaw}" — الثقة غير كافية للجزم`;
}

/** ملخّص ثقة الجلسة الكلي — متوسط مرجّح بسيط بعدد الكلمات لكل حدث. */
export function overallSessionConfidence(perWordConfidences: number[]): number {
  if (perWordConfidences.length === 0) return 0;
  const sum = perWordConfidences.reduce((a, b) => a + b, 0);
  return Math.round((sum / perWordConfidences.length) * 10) / 10;
}
