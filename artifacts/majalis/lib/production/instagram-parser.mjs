/**
 * Caption and course-ad field parsers for Instagram content.
 */

const FIELD_PATTERNS = {
  speaker_name: [
    /(?:الشيخ|فضيلة|معالي|الدكتور|د\.\s*)\s*[:-]?\s*([^\n|،,]+?)(?:\s*[—–-]|$)/i,
    /(?:بإشراف|مع)\s+([^\n|،,]+?)(?:\s*[—–-]|$)/i,
  ],
  title: [
    /(?:درس|محاضرة|دورة|ندوة|خطبة)\s*[:-]?\s*([^\n|]+?)(?:\s*[—–-]|$)/i,
    /(?:عنوان|موضوع)\s*[:-]?\s*([^\n]+)/i,
  ],
  mosque: [
    /(?:مسجد|جامع|مصلى)\s*[:-]?\s*([^\n|،,]+?)(?:\s*[—–-]|$)/i,
  ],
  city: [
    /(?:المدينة|محافظة|منطقة)\s*[:-]?\s*([^\n|،,]+?)(?:\s*[—–-]|$)/i,
    /(الكويت|العاصمة|الجهراء|حولي|الفروانية|الأحمدي|مبارك(?:\s+الكبير)?)/i,
  ],
  lesson_time: [
    /(?:الوقت|بعد|الساعة)\s*[:-]?\s*([^\n|،,]+?)(?:\s*[—–-]|$)/i,
    /(\d{1,2}\s*[:：]\s*\d{2}\s*(?:ص|م|am|pm)?)/i,
    /(بعد\s+(?:الفجر|الظهر|العصر|المغرب|العشاء|التراويح))/i,
  ],
  start_date: [
    /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
    /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
    /(\d{1,2}\s+(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر))/i,
  ],
  day_of_week: [
    /(السبت|الأحد|الاثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)/,
  ],
  phone: [
    /(?:هاتف|جوال|واتس|whatsapp|tel)\s*[:-]?\s*([+\d][\d\s-]{7,})/i,
    /(\+965[\d\s-]{7,})/,
  ],
  email: [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
  ],
  registration_url: [
    /(https?:\/\/[^\s]+(?:register|signup|form|تسجيل)[^\s]*)/i,
    /(https?:\/\/[^\s]+)/,
  ],
  organizer: [
    /(?:الجهة|تنظيم|من\s+قِبل)\s*[:-]?\s*([^\n|،,]+?)(?:\s*[—–-]|$)/i,
  ],
  series: [
    /(?:سلسلة|مسلسل)\s*[:-]?\s*([^\n|،,]+?)(?:\s*[—–-]|$)/i,
  ],
};

export function extractHashtags(text) {
  const matches = String(text || "").match(/#[\u0600-\u06FF\w]+/g);
  return matches ? [...new Set(matches)] : [];
}

export function extractLinks(text) {
  const matches = String(text || "").match(/https?:\/\/[^\s]+/g);
  return matches ? [...new Set(matches.map((u) => u.replace(/[.,)]+$/, "")))] : [];
}

/**
 * @param {string} caption
 */
export function parseCourseAdFields(caption) {
  const text = String(caption || "");
  const fields = {};

  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const re of patterns) {
      const m = text.match(re);
      if (m?.[1]) {
        fields[field] = m[1].trim();
        break;
      }
      if (m?.[0] && !m[1] && field === "city") {
        fields[field] = m[0].trim();
        break;
      }
    }
  }

  if (fields.start_date) fields.gregorian_date = normalizeDate(fields.start_date);
  if (/دورة|course/i.test(text)) fields.is_course = true;
  if (/qr|barcode|باركود/i.test(text)) fields.has_qr_code = true;

  return fields;
}

function normalizeDate(raw) {
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const y = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${y}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  }
  return s;
}
