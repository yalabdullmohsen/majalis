/**
 * ترتيب وتسجيل نقاط المصادر
 *
 * مبدأ الترتيب:
 * القرآن (100) > حديث صحيح (95) > حديث حسن (80) > قرار مجمع فقهي (85)
 * > فتوى موثقة (80) > تفسير (75) > كتاب (70) > درس (65) > فائدة (60)
 */

import { AUTHORITY_SCORES } from "./constants.mjs";

/** نقاط إضافية حسب درجة الحديث */
function hadithGradeBonus(metadata) {
  const grade = String(metadata?.grade || "").toLowerCase();
  if (grade.includes("صحيح"))  return 10;
  if (grade.includes("حسن"))   return 0;
  if (grade.includes("ضعيف"))  return -20;
  return 0;
}

/** نقاط إضافية حسب درجة موثوقية الفتوى */
function fiqhConfidenceBonus(metadata) {
  const level = metadata?.confidence_level || "";
  if (level === "source_verified") return 8;
  if (level === "high")            return 4;
  return 0;
}

/**
 * احسب النقاط النهائية لوثيقة
 */
function scoreDocument(doc) {
  const baseAuthority = AUTHORITY_SCORES[doc.content_type] || 50;
  const typeBonus = doc.content_type === "hadith"
    ? hadithGradeBonus(doc.metadata)
    : doc.content_type === "fiqh_decision"
    ? fiqhConfidenceBonus(doc.metadata)
    : 0;

  const authorityFinal = Math.min(100, baseAuthority + typeBonus);

  // دمج: 60% موثوقية + 40% صلة بالاستعلام
  const combined = (authorityFinal * 0.6) + (doc.relevance_score * 100 * 0.4);
  return combined;
}

/**
 * ترتيب الوثائق وتجميعها حسب النوع
 * @param {Array} docs - وثائق من retrieval
 * @returns {{ranked: Array, byType: Record<string, Array>}}
 */
export function rankDocuments(docs) {
  if (!docs?.length) return { ranked: [], byType: {} };

  const ranked = docs
    .map((d) => ({ ...d, final_score: scoreDocument(d) }))
    .sort((a, b) => b.final_score - a.final_score);

  const byType = {};
  for (const doc of ranked) {
    if (!byType[doc.content_type]) byType[doc.content_type] = [];
    byType[doc.content_type].push(doc);
  }

  return { ranked, byType };
}

/**
 * اكتشاف الخلاف (تعدد الآراء في نفس المسألة)
 */
export function detectOpinionDiversity(docs) {
  if (docs.length < 2) return false;
  const fiqhDocs = docs.filter((d) =>
    ["fiqh_decision", "fatwa", "benefit", "lesson"].includes(d.content_type)
  );
  return fiqhDocs.length >= 2;
}

/**
 * استخراج معلومات الخلاف للعرض في الواجهة
 */
export function extractOpinions(docs) {
  return docs
    .filter((d) => ["fiqh_decision", "fatwa"].includes(d.content_type))
    .slice(0, 6)
    .map((d) => ({
      title:      d.title,
      excerpt:    d.excerpt,
      source:     d.source_ref,
      source_url: d.source_url,
      type:       d.content_type,
      authority:  d.authority_score,
    }));
}
