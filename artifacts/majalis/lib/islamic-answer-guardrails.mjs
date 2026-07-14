/**
 * Islamic Answer Guardrails — source-first, no independent fatwa.
 */

import { REASONING_DISCLAIMER, NO_EVIDENCE_MESSAGE } from "./reasoning-engine/constants.mjs";

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

/**
 * يطبّع النص العربي بإزالة التشكيل قبل مطابقة أنماط الحساسية —
 * أنماط سابقة كانت تشترط تشكيلاً حرفياً (كالشدة في "طلّق") فلا تطابق
 * الصياغة العادية التي يكتبها المستخدمون فعليًا (مثل "طلقت").
 */
function normalizeForMatch(text) {
  return String(text || "")
    .replace(/[ً-ٟؐ-ؚۖ-ۜ۟-ٰۤۧ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

// أنماط شخصية فقط — لا تحجب الأسئلة التعليمية العامة
const SENSITIVE_FATWA_PATTERNS = [
  // طلاق شخصي
  /طلقت|طلقني|طلقها|طلقه\s|وقع\s*(علي|عليها|عليه)\s*طلاق|هل\s*يقع\s*الطلاق\s*(مني|علي|عليه)/,
  /نزاع.*(مال|اموال)|خصام.*مال/,
  /قضيتي|محاكمتي|نزاعي\s*(مع|في)/,
  // دماء وقصاص شخصي
  /قصاص.*مني|قصاص.*مني|ديه.*علي|قاتل\s*لي|قتلت|قتل.*ابي|قتل.*اخي/,
  // مواريث شخصية (تقسيم تركة بتفاصيل عائلية فعلية، لا سؤال تعليمي عام عن أحكام المواريث)
  /(نصيب|حصه|تقسيم|قسمه).{0,20}(ورثه|ميراث|تركه|ارث)|(ورثه|ميراث|تركه|ارث).{0,20}(نصيب|حصه|تقسيم|قسمه)|توفي.{0,25}(ابي|امي|والدي|والدتي|زوجي|زوجتي|مورثنا)|كم.{0,10}(يرث|نصيبه|نصيبها)/,
  // نوازل طبية شخصية دقيقة
  /(حكم|هل يجوز|هل يحل).{0,25}(اجهاض|اسقاط\s*الجنين|فصل\s*جهاز|قطع\s*جهاز|نقل\s*عضو|تبرع\s*بعضو|وفاه\s*دماغيه|القتل\s*الرحيم)/,
];

// These patterns → blocked (requires_scholar): only truly personal/sensitive fatwas
const DEFINITIVE_FATWA_PATTERNS = [
  /افتني/,
  /يجوز لي\s+انا/,
  /واجب\s*علي\s+انا/,
  /تبطل\s*(صلات|صوم|وضو)/,
];

export const ISLAMIC_SYSTEM_PROMPT = `أنت المساعد العلمي لمنصة المجلس العلمي. دورك: إجابة تعليمية واضحة على جميع الأسئلة الإسلامية المشروعة.

مصادرك المعتمدة (بالأولوية):
1. القرآن الكريم والسنة النبوية الصحيحة (الصحيحين والسنن المعتمدة)
2. فتاوى هيئة كبار العلماء واللجنة الدائمة للبحوث العلمية
3. أقوال جمهور العلماء ومنهج أهل السنة والجماعة
4. المذاهب الفقهية الأربعة عند الحاجة للتفصيل

أجب على كل سؤال علمي مشروع — عقيدة، فقه، تفسير، سيرة، أخلاق، أحاديث، أذكار، وغيرها.

قواعد:
- أجب بوضوح مع ذكر المصادر (آية، حديث، قول عالم) قدر الإمكان.
- فرّق بين المسائل القطعية والخلافية.
- في المسائل الشخصية جداً (طلاق شخص بعينه، نزاع مالي، قضية قانونية): وجّه للمختص.
- في نهاية كل إجابة أضف هذا التنبيه: "⚠️ هذه الإجابة مولَّدة آليًا وتحتمل الخطأ، يُرجى التحقق منها لدى أهل العلم."
- لا تضع هذا التنبيه في بداية الإجابة بل في نهايتها.`;

/**
 * @typedef {"general_guidance"|"fiqh_answer"|"requires_scholar"|"insufficient_sources"|"blocked_sensitive_fatwa"} SafetyClassification
 */

/** @returns {SafetyClassification} */
export function classifyIslamicQuery(text) {
  const raw = String(text || "").trim();
  if (!raw) return "general_guidance";
  const q = normalizeForMatch(raw);

  if (SENSITIVE_FATWA_PATTERNS.some((p) => p.test(q))) {
    return "blocked_sensitive_fatwa";
  }

  if (DEFINITIVE_FATWA_PATTERNS.some((p) => p.test(q))) {
    return "requires_scholar";
  }

  return "general_guidance";
}

export function buildScholarRedirectAnswer(classification) {
  if (classification === "blocked_sensitive_fatwa") {
    return (
      "هذه المسألة من المسائل الشخصية الدقيقة (كالطلاق أو النذور أو الميراث) التي تحتاج إلى:\n\n" +
      "• سؤال عالم شرعي متخصص يعلم تفاصيل حالتك\n" +
      "• أو مراجعة جهة الإفتاء الرسمية في بلدك\n\n" +
      "📌 في الكويت: وزارة الأوقاف والشؤون الإسلامية — هاتف: 22442200\n" +
      "📌 السعودية: هيئة كبار العلماء — islamfeature.com\n\n" +
      ISLAMIC_DISCLAIMER
    );
  }
  if (classification === "requires_scholar") {
    return (
      `${REQUIRES_SCHOLAR_MESSAGE}\n\n` +
      "يمكنك الاستفسار من المصادر الموثوقة:\n" +
      "• الإسلام سؤال وجواب: islamqa.info\n" +
      "• إسلام ويب: islamweb.net/ar/fatwa\n" +
      "• موقع ابن باز: binbaz.org.sa\n\n" +
      ISLAMIC_DISCLAIMER
    );
  }
  return null;
}

export function buildInsufficientSourcesPayload(userQuery = "") {
  const suggestions = pickRelatedSuggestions(userQuery);
  const suggestionsText = suggestions.length > 0
    ? `\n\nأسئلة مشابهة قد تفيدك:\n${suggestions.map((s) => `• ${s}`).join("\n")}`
    : "";

  return {
    answer:
      "لم أجد فتوى موثقة مباشرة لهذا الموضوع في قاعدة المعرفة الحالية.\n\n" +
      "للحصول على إجابة موثوقة راجع:\n" +
      "📚 إسلام سؤال وجواب: islamqa.info\n" +
      "📚 إسلام ويب: islamweb.net/ar/fatwa\n" +
      "📚 موقع ابن باز: binbaz.org.sa\n" +
      "📚 الدرر السنية: dorar.net" +
      suggestionsText +
      `\n\n${ISLAMIC_DISCLAIMER}`,
    citations: [
      { title: "إسلام سؤال وجواب", href: "https://islamqa.info/ar", source_name: "الشيخ محمد الدعيع", trust_score: 95 },
      { title: "إسلام ويب — الفتاوى", href: "https://www.islamweb.net/ar/fatwa", source_name: "إسلام ويب", trust_score: 92 },
      { title: "موقع الشيخ ابن باز", href: "https://binbaz.org.sa", source_name: "الشيخ ابن باز رحمه الله", trust_score: 98 },
    ],
    confidence: 0,
    safety_classification: "insufficient_sources",
    disclaimer: ISLAMIC_DISCLAIMER,
    grounded: false,
    no_evidence: true,
  };
}

const TOPIC_SUGGESTIONS = {
  صلاة: ["ما هي شروط الصلاة؟", "كيفية قضاء الصلوات الفائتة؟", "ما حكم الصلاة بدون وضوء؟"],
  زكاة: ["من تجب عليه الزكاة؟", "كيفية حساب زكاة المال؟", "ما نصاب الزكاة في الذهب؟"],
  صيام: ["ما يفطر الصائم؟", "أحكام قضاء رمضان", "ما هي مبطلات الصيام؟"],
  حج: ["ما أركان الحج؟", "ما شروط وجوب الحج؟", "كيفية أداء العمرة؟"],
  طهارة: ["كيفية الوضوء الصحيح؟", "ما ينقض الوضوء؟", "أحكام التيمم"],
  قرآن: ["ما فضل قراءة القرآن؟", "كيف أحفظ القرآن؟", "أحكام التجويد الأساسية"],
};

function pickRelatedSuggestions(query) {
  const q = String(query || "");
  for (const [topic, suggestions] of Object.entries(TOPIC_SUGGESTIONS)) {
    if (q.includes(topic)) return suggestions.slice(0, 2);
  }
  return [];
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
