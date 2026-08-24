import { normalizeArabic } from "./normalize.mjs";
import { classifyWomenAttendance } from "../../lib/lesson-women-attendance.mjs";

const TYPE_RULES = [
  { type: "تسجيل", re: /تسجيل|التسجيل مفتوح|استماره|استمارة|forms\.gle|رابط التسجيل/i },
  { type: "دورة", re: /دورة|دوره|دبلوم|برنامج|مسار|اكاديميه|أكاديمية|اكاديمية/i },
  { type: "حلقة", re: /حلقه|حلقة|حلقات|تحفيظ|تسميع|مقراه|مقرأة/i },
  { type: "خطبة", re: /خطبه|خطبة|الجمعه|الجمعة|خطيب/i },
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
const AUDIENCES_SAFE = new Set(["عام", "رجال", "نساء", "نشء"]);

export function classifyType(text) {
  const n = normalizeArabic(text);
  for (const rule of TYPE_RULES) {
    if (rule.re.test(n)) return rule.type;
  }
  return "إعلان";
}

const WEEKLY_RE =
  /(?:كل\s*(?:اسبوع|أسبوع)|اسبوعيا|أسبوعي(?:ا|ً)?|كل\s*(?:سبت|احد|أحد|اثنين|ثلاثاء|اربعاء|أربعاء|خميس|جمعه|جمعة)|يوم\s*(?:السبت|الاحد|الأحد|الاثنين|الثلاثاء|الاربعاء|الأربعاء|الخميس|الجمعه|الجمعة))/iu;
const MONTHLY_RE = /(?:كل\s*شهر|شهريا|شهري(?:ا|ً)?|مرة\s*في\s*الشهر|من\s*كل\s*شهر)/iu;
const UPCOMING_RE =
  /(?:غدا|غداً|اليوم|الليلة|الليله|قادم|القادم|مقبل|المقبل|يبدا|يبدأ|يبداً|بعد\s*(?:الفجر|الظهر|العصر|المغرب|العشاء)|التسجيل\s*مفتوح)/iu;

/** كشف الجدول: قادم / أسبوعي / شهري — بلا تخمين خارج النص */
export function detectScheduleKind(text) {
  const n = normalizeArabic(text);
  if (MONTHLY_RE.test(n) || MONTHLY_RE.test(String(text ?? ""))) return "monthly";
  if (WEEKLY_RE.test(n) || WEEKLY_RE.test(String(text ?? ""))) return "weekly";
  if (UPCOMING_RE.test(n) || UPCOMING_RE.test(String(text ?? ""))) return "upcoming";
  return null;
}

/** هل النص يشير لدرس/حلقة/دورة قادمة أو متكررة؟ */
export function isLessonRelevant(text) {
  const type = classifyType(text);
  if (type === "درس" || type === "حلقة" || type === "دورة" || type === "خطبة" || type === "تسجيل") {
    return true;
  }
  const kind = detectScheduleKind(text);
  return kind === "weekly" || kind === "monthly" || kind === "upcoming";
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
  const schedule_kind = detectScheduleKind(raw);

  const { womenAttendance, womenAttendanceNote } = classifyWomenAttendance(raw);
  let audience = accountAudience;
  if (womenAttendance === "متاح") audience = "عام";
  else if (/رجال|للرجال/.test(normalizeArabic(raw))) audience = "رجال";
  else if (/نشء|شباب/.test(normalizeArabic(raw))) audience = "نشء";
  if (!AUDIENCES_SAFE.has(audience)) audience = "عام";

  return {
    sheikh,
    place,
    time_text,
    starts_at,
    register_url,
    audience,
    womenAttendance,
    womenAttendanceNote,
    schedule_kind,
  };
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
