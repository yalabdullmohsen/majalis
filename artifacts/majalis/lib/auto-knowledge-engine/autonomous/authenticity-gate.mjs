/**
 * Islamic authenticity verification — auto-reject weak/spam/political content.
 */

import { formatLanguage } from "../quality-gate.mjs";

const POLITICAL_NOISE = [
  /انتخابات/u, /حزب/u, /برلمان/u, /معارضة/u, /انقلاب/u,
  /democrat/i, /republican/i, /trump/i, /biden/i,
];

const SPAM_SIGNALS = [
  /click here/i, /buy now/i, /discount/i, /casino/i,
  /crypto giveaway/i, /free money/i,
];

const WEAK_HADITH_MARKERS = [
  /ضعيف/u, /موضوع/u, /لا أصل/u, /باطل/u,
  /weak hadith/i, /fabricated/i,
];

export function runAuthenticityGate(item, analysis, verification, connector) {
  const trustLevel = connector?.trust_level ?? connector?.trustLevel ?? 3;
  const text = `${item.raw_title || ""} ${item.raw_body || ""} ${analysis?.ai_summary || ""}`;
  const reasons = [];
  let confidence = analysis?.ai_confidence ?? 70;

  if (verification.isDuplicate) {
    reasons.push({ code: "duplicate_content", reason: "محتوى مكرر", confidence: 95, stage: "duplicate_detection" });
  }

  if (!verification.sourceVerified && trustLevel < 4) {
    reasons.push({ code: "weak_source", reason: "مصدر غير موثوق", confidence: 80, stage: "authenticity_verification" });
  }

  if (!item.raw_title?.trim() || item.raw_title.trim().length < 4) {
    reasons.push({ code: "missing_title", reason: "عنوان مفقود", confidence: 99, stage: "normalize" });
  }

  const bodyLen = (item.raw_body || analysis?.ai_summary || "").trim().length;
  if (bodyLen < 20) {
    reasons.push({ code: "insufficient_content", reason: "محتوى غير كافٍ", confidence: 90, stage: "normalize" });
  }

  if (verification.warnings?.includes("broken_link")) {
    reasons.push({ code: "broken_page", reason: "رابط مكسور", confidence: 85, stage: "reference_validation" });
  }

  for (const re of POLITICAL_NOISE) {
    if (re.test(text)) {
      reasons.push({ code: "political_propaganda", reason: "محتوى سياسي — مرفوض", confidence: 88, stage: "authenticity_verification" });
      break;
    }
  }

  for (const re of SPAM_SIGNALS) {
    if (re.test(text)) {
      reasons.push({ code: "spam", reason: "محتوى إعلاني/spam", confidence: 92, stage: "authenticity_verification" });
      break;
    }
  }

  if (!analysis?.ai_scholar && trustLevel < 4 && item.content_kind === "fatwa") {
    reasons.push({ code: "unknown_author", reason: "فتوى بدون عالم معروف", confidence: 75, stage: "metadata_extraction" });
  }

  for (const re of WEAK_HADITH_MARKERS) {
    if (re.test(text)) {
      reasons.push({ code: "weak_hadith", reason: "إشارة لحديث ضعيف/موضوع", confidence: 90, stage: "reference_validation" });
      break;
    }
  }

  const lang = formatLanguage(text);
  if (!lang.ok && bodyLen > 50) {
    reasons.push({ code: "language_mismatch", reason: "لغة غير عربية كافية", confidence: 70, stage: "language_detection" });
  }

  if (analysis?.needs_human_review && trustLevel < 4) {
    reasons.push({ code: "needs_review", reason: "يتطلب مراجعة بشرية", confidence: 65, stage: "ai_enrichment" });
  }

  const passed = reasons.length === 0;
  return {
    passed,
    reasons,
    primaryReason: reasons[0] || null,
    confidence,
    shouldReject: reasons.some((r) => r.confidence >= 80),
    shouldReview: !passed && !reasons.some((r) => r.confidence >= 80),
  };
}
