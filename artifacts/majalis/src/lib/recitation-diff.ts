import { normalizeQuranWord } from "@/lib/recitation-ai/quran-normalize";
import { alignWindow } from "@/lib/recitation-ai/word-alignment";

export type RecitationWordResult = { text: string; matched: boolean };
export type RecitationDiffResult = {
  words: RecitationWordResult[];
  matchPercent: number;
};

/**
 * يقارن نص الآية الأصلي بما تعرّف عليه محرّك الصوت من تلاوة المستخدم.
 * النص المعروض (words[].text) يبقى بتشكيله الأصلي الكامل؛ المطابقة فقط
 * تُجرى على نسخة مطبَّعة (بلا تشكيل).
 *
 * ⚠️ إصلاح ازدواجية حقيقية (2026-07-18، TASMEE_AUDIT.md القسم 1): كانت
 * هذه الوحدة تستخدم `normalizeArabic` العامة مباشرة + محاذاة LCS ثنائية
 * (صحيح/غير مطابق فقط)، بمعزل تام عن `normalizeQuranWord` (تحمل مرادفات
 * الرسم العثماني ← النطق الحديث، مثل الصلوة/الصلاة، وتصحيحات موضعية مثل
 * مالك/الفاتحة:4) المستخدَمة في محرك التسميع الكامل
 * (`VerseAlignmentEngine`) — فتحمل نفس فئة الأخطاء الوهمية المُصلَحة هناك
 * (مثال حقيقي: "رب العالمين" كانت ستُصنَّف خطأً). الإصلاح: تستخدم الآن
 * نفس `normalizeQuranWord` ونفس خوارزمية المحاذاة (`alignWindow`،
 * Needleman-Wunsch من `word-alignment.ts`) المستخدَمتين في محرك التسميع
 * الكامل — لا نظام مطابقة موازٍ، بل إعادة استخدام حقيقية لنفس "الدماغ"
 * خلف عقد إخراج مبسَّط (مطابق/غير مطابق فقط) يناسب سياق الفحص السريع
 * لآية واحدة أثناء التصفّح العادي (`RecitationTestPanel.tsx`).
 */
export function diffRecitation(canonicalText: string, spokenText: string): RecitationDiffResult {
  const canonicalRaw = canonicalText.split(/\s+/).filter(Boolean);
  const canonicalNorm = canonicalRaw.map((w) => normalizeQuranWord(w));
  const spokenNorm = spokenText.split(/\s+/).filter(Boolean).map((w) => normalizeQuranWord(w));

  if (canonicalNorm.length === 0) return { words: [], matchPercent: 0 };
  if (spokenNorm.length === 0) return { words: canonicalRaw.map((text) => ({ text, matched: false })), matchPercent: 0 };

  const ops = alignWindow(spokenNorm, canonicalNorm);
  const matched = new Array(canonicalNorm.length).fill(false);
  for (const op of ops) {
    if (op.type === "match" && op.refIndex !== null) matched[op.refIndex] = true;
  }

  const words = canonicalRaw.map((text, idx) => ({ text, matched: matched[idx] }));
  const matchCount = matched.filter(Boolean).length;
  return { words, matchPercent: Math.round((matchCount / canonicalNorm.length) * 100) };
}
