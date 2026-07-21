/**
 * تصنيف منشورات Instagram المستوردة إلى نوع محتوى موحّد — قواعد نصية رخيصة
 * أولًا (بلا استدعاء ذكاء اصطناعي لكل منشور)، مطابقة للأمثلة المطلوبة حرفيًا.
 */

const COURSE_KEYWORDS = ["دورة", "تسجيل", "برنامج علمي", "منظومة", "مقاعد", "التسجيل مفتوح", "برنامج تأهيلي"];
const LESSON_KEYWORDS = ["محاضرة", "درس", "شرح", "لقاء علمي", "شرح متن", "سلسلة دروس"];
const EVENT_KEYWORDS = ["موعد", "يقام", "الساعة", "حضور", "بث مباشر", "يوم", "غدًا", "غدا", "مساء اليوم"];
const BENEFIT_KEYWORDS = ["فائدة", "قال", "من فوائد", "تدبر", "تذكير", "حكمة", "خاطرة"];
const ANNOUNCEMENT_KEYWORDS = ["إعلان", "بيان", "تنويه", "توضيح", "إشعار"];
const COMMERCIAL_KEYWORDS = ["إعلان ممول", "خصم", "عرض خاص", "اشترِ الآن", "توصيل", "متجر", "سعر"];

function countHits(text, keywords) {
  return keywords.reduce((n, kw) => (text.includes(kw) ? n + 1 : n), 0);
}

/**
 * @param {{caption?: string, sourceAccount?: string}} post
 * @returns {"lesson"|"course"|"event"|"benefit"|"announcement"|"ignored"}
 */
export function classifyInstagramPost({ caption = "" } = {}) {
  const text = String(caption || "").trim();
  if (!text) return "ignored";

  if (countHits(text, COMMERCIAL_KEYWORDS) > 0) return "ignored";

  const scores = {
    course: countHits(text, COURSE_KEYWORDS),
    event: countHits(text, EVENT_KEYWORDS),
    lesson: countHits(text, LESSON_KEYWORDS),
    benefit: countHits(text, BENEFIT_KEYWORDS),
    announcement: countHits(text, ANNOUNCEMENT_KEYWORDS),
  };

  // الأولوية: دورة > فعالية > درس > فائدة > إعلان — دورة تُسجَّل فيها مواعيد
  // غالبًا أيضًا (كلمة "الساعة"/"يوم") فيجب ألا تُصنَّف فعالية بدل دورة.
  const order = ["course", "event", "lesson", "benefit", "announcement"];
  let best = null;
  let bestScore = 0;
  for (const type of order) {
    if (scores[type] > bestScore) {
      best = type;
      bestScore = scores[type];
    }
  }

  return best || "ignored";
}

/** يحاول استخراج اسم شيخ/شيخة من نص المنشور صراحة (لا تخمين) — يُستخدم فقط
 * للحسابات المؤسسية (attribute_to_person=false) قبل الرجوع لاسم الجهة. */
const NAME_PATTERN = /(الشيخ|الشيخة|فضيلة الشيخ|د\.|الدكتور|الدكتورة)\s+[ء-ي][ء-ي\s.]{2,40}?(?=[\n.،,]|$)/u;

export function extractExplicitPersonName(caption = "") {
  const text = String(caption || "");
  const match = text.match(NAME_PATTERN);
  if (!match) return null;
  const name = match[0].replace(/\s+/g, " ").trim();
  return name.length >= 4 && name.length <= 60 ? name : null;
}

/** الحسابات الخمسة المعتمدة لخط instagram-multitype-sync.mjs تحديدًا (لا
 * الحسابات الأقدم التي يديرها lesson-source-monitor.mjs بمعزل تام) —
 * يُميَّزها وجود اسم نسب افتراضي (شخص أو جهة)، حقل لا تملكه المصادر الأقدم. */
export function isMultiTypeInstagramSource(source) {
  return Boolean(source.default_attribution_name || source.default_organization_name);
}
