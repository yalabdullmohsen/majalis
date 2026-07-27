/**
 * قيود إعادة صياغة الذكاء الاصطناعي للمحتوى الشرعي/التاريخي.
 * الدور المسموح: إعادة صياغة لفظية فقط — بلا اختراع تاريخ أو فضل أو عبادة.
 */
import type { VerifiedReligiousRecord } from "./types";
import { ReligiousContentValidator } from "./ReligiousContentValidator";

export type AiRewriteCheck = {
  allowed: boolean;
  reasons: string[];
};

const ADDED_RULING =
  /\b(يجب|يُفرض|فُرض|سنة\s*مؤكدة|واجب|محرّم|يستحب\s*تخصيص)/;
const ADDED_DATE =
  /\b(\d{1,2}\s*(محر|صفر|ربيع|جماد|رجب|شعبان|رمضان|شوّال|ذي\s*الق|ذي\s*الح)|\d{1,2}\/\d{1,2})/;
const REMOVED_CAVEAT_MARKERS = /محل\s*خلاف|ورد\s*في\s*بعض\s*المصادر|على\s*المشهور|لم\s*يثبت/;

/**
 * يقارن النص الناتج بالمصدر الموثّق قبل الاعتماد.
 */
export function guardAiReligiousRewrite(
  source: VerifiedReligiousRecord,
  rewritten: string,
): AiRewriteCheck {
  const reasons: string[] = [];
  const src = source.verifiedDescription;
  const out = rewritten.trim();

  if (!out) {
    return { allowed: false, reasons: ["النص الناتج فارغ."] };
  }

  // لا إضافة تاريخ غير موجود في المصدر
  if (ADDED_DATE.test(out) && !ADDED_DATE.test(src)) {
    reasons.push("أضاف تاريخًا غير موجود في المصدر الموثّق.");
  }

  // لا إضافة حكم/فضل ثقيل إن لم يكن في المصدر
  if (ADDED_RULING.test(out) && !ADDED_RULING.test(src)) {
    reasons.push("أضاف حكمًا أو صيغة إلزام/استحباب غير موجودة في المصدر.");
  }

  // لا حذف التحفظات إن كانت جزءًا من النص المصدر نفسه (وليس مجرد حقل caveat منفصل)
  if (
    REMOVED_CAVEAT_MARKERS.test(src) &&
    !REMOVED_CAVEAT_MARKERS.test(out)
  ) {
    reasons.push("حذف التحفظات العلمية الموجودة في المصدر.");
  }

  // لا ربط الهجرة بمحرّم
  const probe = ReligiousContentValidator.validateFreeText(out, source.id);
  if (!probe.publishable) {
    for (const r of probe.rejections) {
      reasons.push(r.reason);
    }
  }

  // طول مفرط قد يخفي إضافات معنوية
  if (out.length > src.length * 1.6 + 80) {
    reasons.push("التوسيع مفرط وقد يغيّر المعنى أو يضيف معلومات.");
  }

  return { allowed: reasons.length === 0, reasons };
}

/**
 * إن فشل الحارس يُعاد النص الموثّق الأصلي بلا تعديل.
 */
export function applySafeRewrite(
  source: VerifiedReligiousRecord,
  rewritten: string | null | undefined,
): string {
  if (!rewritten) return source.verifiedDescription;
  const check = guardAiReligiousRewrite(source, rewritten);
  return check.allowed ? rewritten.trim() : source.verifiedDescription;
}
