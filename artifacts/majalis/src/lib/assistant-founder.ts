export const FOUNDER_SHORT_ANSWER =
  "صاحب ومؤسس منصة سُنّة هو: يوسف عبدالمحسن يوسف المطيري.";

export const FOUNDER_EXTENDED_ANSWER =
  "منصة سُنّة هي مشروع شخصي أسسه يوسف عبدالمحسن يوسف المطيري بهدف جمع الدروس والدورات الشرعية والقرآن الكريم والأذكار والفوائد والأسئلة والأجوبة العلمية في منصة رقمية واحدة، مع التركيز على سهولة الوصول إلى المحتوى العلمي الموثوق وجودة تجربة المستخدم.";

export const FOUNDER_CONTACT_ANSWER =
  "المنصة لا تعرض بيانات تواصل شخصية للمؤسس. للاستفسارات العامة عن المنصة يمكنك استخدام صفحة «تواصل معنا».";

const OWNER_PATTERNS = [
  /من\s+(?:هو\s+)?(?:صاحب|مؤسس|أنشأ|أسس|يمتلك|وراء|قام\s+ب(?:إنشاء|تأسيس))/,
  /(?:صاحب|مؤسس|منشئ|مالك)\s+(?:ال)?(?:منصة|موقع|مجلس|المجلس\s+العلمي)/,
  /(?:ال)?مجلس\s+العلمي\s+(?:صاحب|مؤسس|من\s+أسس|من\s+أنشأ)/,
  /من\s+يقف\s+خلف/,
  /من\s+وراء\s+(?:ال)?(?:منصة|موقع|مجلس)/,
  /يوسف\s+عبدالمحسن|المطيري/,
  /founder|owner|who\s+(?:created|founded|owns)/i,
];

const EXTENDED_HINTS = [
  /(?:معلومات|تفاصيل|about|عن\s+(?:ال)?(?:منصة|مشروع|موقع)|هدف|رؤية|رسالة|لماذا\s+أُنشئ)/,
  /(?:أخبرني|حدثني|اشرح|وضّح).*(?:عن|حول)/,
  /(?:ما\s+هي|ما\s+هو).*(?:منصة|مجلس)/,
];

const CONTACT_PATTERNS = [
  /(?:تواصل|راسل|اتصل|مراسلة|بريد|إيميل|email|واتس).*(?:مؤسس|صاحب|يوسف|المطيري)/,
  /(?:مؤسس|صاحب).*(?:تواصل|راسل|اتصل|بريد|إيميل|email|واتس|رقم)/,
  /(?:كيف\s+أ)?(?:تواصل|راسل).*(?:مع\s+)?(?:المؤسس|الصاحب)/,
];

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function wantsExtendedInfo(text: string) {
  return matchesAny(text, EXTENDED_HINTS);
}

function isFounderContactQuestion(text: string) {
  return matchesAny(text, CONTACT_PATTERNS);
}

function isFounderOwnerQuestion(text: string) {
  return matchesAny(text, OWNER_PATTERNS);
}

/** يُرجع الرد الرسمي عن المؤسس إن وُجد سؤال مطابق، وإلا null */
export function resolveFounderQuestion(message: string): string | null {
  const text = message.trim();
  if (!text) return null;

  if (isFounderContactQuestion(text)) {
    return FOUNDER_CONTACT_ANSWER;
  }

  if (!isFounderOwnerQuestion(text)) {
    return null;
  }

  return wantsExtendedInfo(text) ? FOUNDER_EXTENDED_ANSWER : FOUNDER_SHORT_ANSWER;
}
