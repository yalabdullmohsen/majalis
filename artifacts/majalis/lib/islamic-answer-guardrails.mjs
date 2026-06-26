/**
 * Islamic Answer Guardrails — source-first, no independent fatwa.
 */

import { REASONING_DISCLAIMER, NO_EVIDENCE_MESSAGE } from "../reasoning-engine/constants.mjs";

export const ISLAMIC_DISCLAIMER =
  "هذه إجابة تعليمية مختصرة وليست فتوى شخصية ملزمة.";

export const INSUFFICIENT_SOURCES_MESSAGE =
  "لا أملك مصدرًا موثقًا كافيًا داخل قاعدة المعرفة للإجابة بثقة.";

export const REQUIRES_SCHOLAR_MESSAGE =
  "هذه المسألة تحتاج سؤال أهل العلم أو الجهة الشرعية المختصة.";

/** Trusted source labels for citation display */
export const TRUSTED_SOURCE_NAMES = [
  "هيئة كبار العلماء",
  "اللجنة الدائمة",
  "جمهور العلماء",
  "ابن باز",
  "ابن عثيمين",
  "الإسلام سؤال وجواب",
  "الدرر السنية",
  "الموسوعة الفقهية",
  "القرآن الكريم",
  "صحيح البخاري",
  "صحيح مسلم",
  "المجمع الفقهي",
];

const SENSITIVE_FATWA_PATTERNS = [
  /طلاق/,
  /نذر/,
  /يمين/,
  /حلف/,
  /دم(?!اء)/,
  /دماء/,
  /قصاص/,
  /دية/,
  /ميراث/,
  /نزاع.*(مال|أموال)/,
  /قضية/,
  /محكمة/,
];

const DEFINITIVE_FATWA_PATTERNS = [
  /فتوى/,
  /أفتني/,
  /ما حكم/,
  /هل يجوز/,
  /يجوز لي/,
  /حلال\s*(ام|أم|ولا|or)?\s*حرام/,
  /حرام\s*(ام|أم|ولا|or)?\s*حلال/,
  /واجب\s*علي/,
  /تبطل\s*(صلات|صوم|وضو)/,
];

export const ISLAMIC_SYSTEM_PROMPT = `أنت المساعد العلمي لمنصة المجلس العلمي — إرشاد تعليمي فقط، لا فتوى مستقلة.

مصادرك المعتمدة (بالأولوية):
1. القرآن الكريم
2. السنة النبوية الصحيحة (الصحيحين والسنن المعتمدة)
3. فتاوى هيئة كبار العلماء واللجنة الدائمة
4. أقوال جمهور العلماء ومنهج أهل السنة والجماعة
5. فهم السلف الصالح والمذاهب الفقهية المعتبرة عند الحاجة

قواعد صارمة:
- لا تصدر فتوى شخصية ملزمة.
- فرّق بين: نص قطعي، مسألة خلافية، فتوى معاصرة، توجيه عام.
- إن لم تجد مصدرًا موثقًا: قل "${INSUFFICIENT_SOURCES_MESSAGE}"
- في الطلاق والنذور والأيمان والدماء والأموال المتنازع عليها: "${REQUIRES_SCHOLAR_MESSAGE}"
- اذكر المصادر عند الإجابة.`;

/**
 * @typedef {"general_guidance"|"fiqh_answer"|"requires_scholar"|"insufficient_sources"|"blocked_sensitive_fatwa"} SafetyClassification
 */

/** @returns {SafetyClassification} */
export function classifyIslamicQuery(text) {
  const q = String(text || "").trim();
  if (!q) return "general_guidance";

  if (SENSITIVE_FATWA_PATTERNS.some((p) => p.test(q))) {
    return "blocked_sensitive_fatwa";
  }

  if (DEFINITIVE_FATWA_PATTERNS.some((p) => p.test(q))) {
    return "requires_scholar";
  }

  return "general_guidance";
}

export function buildScholarRedirectAnswer(classification) {
  if (classification === "blocked_sensitive_fatwa" || classification === "requires_scholar") {
    return `${REQUIRES_SCHOLAR_MESSAGE}\n\n${ISLAMIC_DISCLAIMER}`;
  }
  return null;
}

export function buildInsufficientSourcesPayload() {
  return {
    answer: `${INSUFFICIENT_SOURCES_MESSAGE}\n\n${ISLAMIC_DISCLAIMER}`,
    citations: [],
    confidence: 0,
    safety_classification: "insufficient_sources",
    disclaimer: ISLAMIC_DISCLAIMER,
    grounded: true,
    no_evidence: true,
  };
}

export function buildGroundedPayload(summary, citations = [], confidence = 0, classification = "fiqh_answer") {
  const safeCitations = Array.isArray(citations) ? citations : [];
  const hasSources = safeCitations.length > 0;

  if (!hasSources || confidence < 0.35) {
    return buildInsufficientSourcesPayload();
  }

  return {
    answer: `${summary}\n\n${REASONING_DISCLAIMER}\n\n${ISLAMIC_DISCLAIMER}`,
    citations: safeCitations,
    confidence: Math.round(confidence * 100) / 100,
    safety_classification: classification,
    disclaimer: ISLAMIC_DISCLAIMER,
    grounded: true,
    no_evidence: false,
  };
}

export function shouldBlockUnsourcedIslamicFallback(query) {
  return classifyIslamicQuery(query) !== "general_guidance" ||
    /\b(حكم|فتو|يجوز|حرام|حلال|سنة|فرض|واجب|صلا|صوم|زكا|حج|عمر)\b/u.test(query);
}

export { NO_EVIDENCE_MESSAGE, REASONING_DISCLAIMER };
