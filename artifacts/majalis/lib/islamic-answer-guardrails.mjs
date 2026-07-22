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

/**
 * الرد الحرفي المعتمد عند نقص المصادر — لا يجوز تغيير نصه ولا الالتفاف عليه
 * بجواب مولَّد بلا سند. أي جواب بلا citations لا يُوصف بأنه «مستند».
 */
export const NO_TRUSTED_SOURCE_REPLY =
  "لم أجد في المصادر المتاحة مادة موثوقة كافية للإجابة الدقيقة.";

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

// أنماط الحجب — الفتوى الشخصية والأبواب التي لا يُفتى فيها آليًا إطلاقًا
// (المواريث والقسمة، والدماء والقصاص والديات، والنوازل الطبية).
// ما زالت الأسئلة التعليمية العامة («ما هي أحكام المواريث في الإسلام؟») غير محجوبة.
const SENSITIVE_FATWA_PATTERNS = [
  // ── طلاق شخصي ─────────────────────────────────────────────────────────────
  /طلقت|طلقني|طلقها|طلقه\s|وقع\s*(علي|عليها|عليه)\s*طلاق|هل\s*يقع\s*الطلاق\s*(مني|علي|عليه)/,
  /(طلاق|خلع|فسخ)\s*(زوجتي|زوجي|امراتي)|زوجتي.{0,20}طلاق|زوجي.{0,20}طلاق/,
  /نزاع.*(مال|اموال)|خصام.*مال/,
  /قضيتي|محاكمتي|نزاعي\s*(مع|في)/,

  // ── مواريث/تركة/قسمة ──────────────────────────────────────────────────────
  // الحالات الشخصية (تفاصيل عائلية فعلية)
  /(نصيب|حصه|تقسيم|قسمه).{0,20}(ورثه|ميراث|تركه|ارث)|(ورثه|ميراث|تركه|ارث).{0,20}(نصيب|حصه|تقسيم|قسمه)|توفي.{0,25}(ابي|امي|والدي|والدتي|زوجي|زوجتي|مورثنا)|كم.{0,10}(يرث|نصيبه|نصيبها|نصيبي)/,
  // أي طلب قسمة/حساب تركة أو تحديد وارث بعينه — لا يُحسب آليًا
  /(احسب|احسبي|قسم|اقسم|وزع|كيف\s*نقسم|كيف\s*تقسم).{0,25}(تركه|ميراث|ارث|ورثه)/,
  /(ورث|يرث|ترث|ارث|ميراث|تركه|وصيه).{0,25}(زوجتي|زوجي|ابي|امي|والدي|والدتي|اخي|اختي|ابني|ابنتي|جدي|جدتي|عمي|خالي)/,
  /(حرمت|حرموني|حرمني|منعوني).{0,20}(ميراث|ارث|تركه|نصيب)/,
  /(الفرائض|علم\s*المواريث).{0,20}(مساله|مسالتي|حالتي)/,

  // ── دماء وقصاص وديات ──────────────────────────────────────────────────────
  // باب الدماء لا يُفتى فيه آليًا بحال — لا شخصيًا ولا نظريًا.
  /قصاص|(^|\s)القود(\s|$)|الديات/,
  /(ديه|الديه)\s*(القتل|قتل|الجنين|الخطا|المغلظه|الشرعيه)|(قتل|قاتل|جنايه|حادث|دهس).{0,20}(ديه|الديه)/,
  /قتل\s*(عمد|خطا|شبه\s*عمد)|قتلت|قتل.*ابي|قتل.*اخي|قاتل\s*لي/,
  // ملاحظة: «رجم» بحدود كلمة — بلا الحدود تُطابق «ترجمة/مترجم» فتحجب أسئلة بريئة.
  /حد\s*(الرده|الحرابه|الزنا|السرقه|القذف)|اقامه\s*الحد|(^|\s)(ال)?رجم(\s|[،؟.!]|$)|جلد\s*الزاني/,

  // ── نوازل طبية ────────────────────────────────────────────────────────────
  /اجهاض|اسقاط\s*الجنين|(فصل|قطع|رفع)\s*(جهاز|الاجهزه|اجهزه)|نقل\s*عضو|زراعه\s*(عضو|الاعضاء)|تبرع\s*بعضو|وفاه\s*دماغيه|القتل\s*الرحيم/,
  /تاجير\s*ال?ارحام|اطفال\s*ال?انابيب|تلقيح\s*صناعي|تغيير\s*ال?جنس|بنوك\s*ال?حليب|الاستنساخ/,
];

/**
 * محاولات كشف تعليمات النظام (prompt extraction / jailbreak) —
 * تُردّ محليًا بلا استدعاء النموذج إطلاقًا حتى لا يُسرَّب شيء.
 */
const PROMPT_EXTRACTION_PATTERNS = [
  /system\s*prompt|systemprompt|initial\s*(instructions|prompt)|developer\s*(message|prompt)/i,
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions|disregard\s+.{0,20}instructions/i,
  /(reveal|repeat|print|show|output|dump|leak)\s+(me\s+)?(your|the)\s+(system|initial|hidden|original)?\s*(prompt|instructions|rules)/i,
  /(اكشف|اظهر|اطبع|اعرض|كرر|انسخ|ما\s*هي|ماهي|اذكر)\s*(لي\s*)?(نص\s*)?(تعليمات(ك|\s*النظام)|التعليمات|الاوامر|البرومبت|prompt|رسالة\s*النظام|توجيهات(ك)?)/,
  /تجاهل\s*(كل\s*)?(ال)?(تعليمات|اوامر|توجيهات)\s*(السابقه|السابقة|السابق)?/,
  /(ما|ماذا)\s*(هو|هي)\s*(نص\s*)?(system\s*prompt|البرومبت|تعليماتك)/i,
  /اعد\s*صياغه\s*تعليماتك|افصح\s*عن\s*تعليماتك|اخرج\s*عن\s*دورك|تظاهر\s*انك/,
];

/** @returns {boolean} */
export function isPromptExtractionAttempt(text) {
  const raw = String(text || "");
  if (!raw.trim()) return false;
  const normalized = normalizeForMatch(raw);
  return PROMPT_EXTRACTION_PATTERNS.some((p) => p.test(raw) || p.test(normalized));
}

/** الرد الثابت على محاولات كشف التعليمات — لا يذكر شيئًا من محتواها. */
export const PROMPT_EXTRACTION_REPLY =
  "لا أشارك تعليمات تشغيلي الداخلية.\n" +
  "لكن يسعدني الإجابة عن سؤالك العلمي — اكتب مسألتك الشرعية أو العلمية وسأجيب بما تسنده المصادر.";

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
    // روابط مرجعية عامة موثوقة — ليست دليلًا على إجابة بعينها، ولا تحمل درجات ثقة
    // مُختلَقة. الإشراف والنسبة مذكوران كما هي معروفة رسميًا للمصدر.
    references: [
      { title: "إسلام سؤال وجواب", href: "https://islamqa.info/ar", source_name: "بإشراف الشيخ محمد صالح المنجد" },
      { title: "إسلام ويب — الفتاوى", href: "https://www.islamweb.net/ar/fatwa", source_name: "الشبكة الإسلامية (إسلام ويب)" },
      { title: "موقع الشيخ ابن باز", href: "https://binbaz.org.sa", source_name: "موقع سماحة الشيخ عبد العزيز بن باز رحمه الله" },
      { title: "الدرر السنية", href: "https://dorar.net", source_name: "مؤسسة الدرر السنية" },
    ],
    citations: [],
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
