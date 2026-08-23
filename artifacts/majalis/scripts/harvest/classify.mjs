import { normalizeArabic } from "./normalize.mjs";

const TYPE_RULES = [
  { type: "تسجيل", re: /تسجيل|التسجيل مفتوح|استمارة|forms\.gle|رابط التسجيل/i },
  { type: "دورة", re: /دورة|دبلوم|برنامج|مسار|اكاديميه|أكاديمية/i },
  { type: "حلقة", re: /حلقه|حلقات|تحفيظ|تسميع|مقراه|مقرأة/i },
  { type: "خطبة", re: /خطبه|الجمعة|خطيب/i },
  { type: "درس", re: /درس|شرح|مجلس|محاضره|محاضرة|لقاء/i },
];

const SHEIKH_RE =
  /(?:الشيخ|الشيخه|د\.|دكتور|الاستاذ|الأستاذ|الاستاذه|الأستاذة|بإشراف)\s*[:\-]?\s*([^\n،,.|]{3,60})/i;
const PLACE_RE =
  /(?:مسجد|جامع|مركز|قطعه|قطعة|منطقه|منطقة|في)\s*[:\-]?\s*([^\n،,.|]{3,80})/i;
const TIME_RE =
  /(?:بعد\s+(?:الفجر|الظهر|العصر|المغرب|العشاء|التراويح))|(?:\d{1,2}\s*[:٫،]\s*\d{0,2}\s*(?:ص|م|صباحا|مساء|مساءً))|(?:[٠-٩]{1,2}\s*[:٫،]\s*[٠-٩]{0,2}\s*(?:ص|م))/i;
const DATE_RE =
  /(?:\d{4}[-/]\d{1,2}[-/]\d{1,2})|(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(?:\d{1,2}\s+(?:يناير|فبراير|مارس|ابريل|أبريل|مايو|يونيو|يوليو|اغسطس|أغسطس|سبتمبر|اكتوبر|أكتوبر|نوفمبر|ديسمبر))|(?:\d{1,2}\s+(?:محرم|صفر|ربيع|جمادى|رجب|شعبان|رمضان|شوال|ذو))/i;
const REGISTER_RE = /(https?:\/\/(?:forms\.gle|docs\.google\.com\/forms)[^\s]+|https?:\/\/(?:wa\.me|t\.me)\/[^\s]+)/i;

export function classifyType(text) {
  const n = normalizeArabic(text);
  for (const rule of TYPE_RULES) {
    if (rule.re.test(n)) return rule.type;
  }
  return "إعلان";
}

export function extractFields(text, accountAudience = "عام") {
  const raw = String(text ?? "");
  const sheikh = raw.match(SHEIKH_RE)?.[1]?.trim() ?? null;
  const place = raw.match(PLACE_RE)?.[1]?.trim() ?? null;
  const time_text = raw.match(TIME_RE)?.[0]?.trim() ?? null;
  const dateMatch = raw.match(DATE_RE)?.[0];
  let starts_at = null;
  if (dateMatch) {
    const parsed = Date.parse(dateMatch.replace(/\//g, "-"));
    if (!Number.isNaN(parsed)) starts_at = new Date(parsed).toISOString();
  }
  const register_url = raw.match(REGISTER_RE)?.[1] ?? null;

  let audience = accountAudience;
  const n = normalizeArabic(raw);
  if (/نساء|نسائيه|للنساء/.test(n)) audience = "نساء";
  else if (/رجال|للرجال/.test(n)) audience = "رجال";
  else if (/نشء|شباب/.test(n)) audience = "نشء";

  return { sheikh, place, time_text, starts_at, register_url, audience };
}

export function confidenceFor(item, fields) {
  let score = 0.45;
  if (item.title?.trim()) score += 0.2;
  if (fields.sheikh) score += 0.1;
  if (fields.place) score += 0.1;
  if (fields.time_text || fields.starts_at) score += 0.1;
  if (fields.register_url) score += 0.05;
  return Math.min(1, Number(score.toFixed(2)));
}
