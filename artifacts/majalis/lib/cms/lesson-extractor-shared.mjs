/**
 * Shared lesson extraction helpers (used by lesson-extractor + vision fallback).
 */
import { validateLessonDraft, buildExternalKey, buildLessonSlug } from "../cms/content-validator.mjs";

export const EXTRACTION_PROMPT = `أنت نظام استخراج بيانات لمنصة علمية إسلامية كويتية.
من صورة إعلان درس/دورة، استخرج كل المعلومات بدقة.

أعد JSON فقط بدون markdown:
{
  "title": "عنوان الدرس",
  "speaker_name": "اسم الشيخ",
  "gregorian_date": "YYYY-MM-DD إن وُجد",
  "day_of_week": "اليوم بالعربية",
  "lesson_time": "الوقت",
  "mosque": "اسم المسجد",
  "region": "المنطقة",
  "city": "المحافظة",
  "country": "الدولة",
  "category": "تفسير|فقه|عقيدة|حديث|سيرة|تجويد|أخرى",
  "description": "وصف مختصر",
  "organizer": "الجهة المنظمة",
  "cooperative_org": "الجهة المتعاونة إن وُجدت",
  "has_live_stream": false,
  "women_section": "مكان النساء إن ذُكر",
  "has_women_section": false,
  "phone": "رقم الهاتف",
  "live_url": "رابط البث إن وُجد",
  "registration_url": "رابط التسجيل",
  "maps_url": "رابط الخريطة",
  "links": [],
  "is_course": false,
  "activity_type": "درس",
  "start_date": "YYYY-MM-DD إن وُجد",
  "end_date": "YYYY-MM-DD إن وُجد",
  "raw_ocr_text": "النص العربي الكامل المقروء من الصورة",
  "keywords": ["كلمات", "مفتاحية"],
  "slug": "مقترح-slug",
  "confidence": 0.0
}

إذا لم تجد حقلًا اتركه فارغاً "" أو false. لا تخمّن fatwa أو أحكام.`;

export const ENRICH_PROMPT = `راجع بيانات الدرس التالية وأصلح:
- الأخطاء الإملائية العربية
- صيغة التاريخ والوقت
- تصنيف الدرس
- slug SEO بالإنجليزية/transliteration
- meta description للSEO (≤160 حرف)

أعد JSON:
{
  "corrected": { ...same fields as input... },
  "suggestions": [{ "field": "", "old": "", "new": "", "reason": "" }],
  "seo_title": "",
  "seo_description": "",
  "slug": ""
}`;

export function emptyLessonPayload() {
  return {
    title: "",
    speaker_name: "",
    gregorian_date: "",
    day_of_week: "",
    lesson_time: "",
    mosque: "",
    region: "",
    city: "العاصمة",
    country: "الكويت",
    category: "",
    description: "",
    organizer: "",
    cooperative_org: "",
    has_live_stream: false,
    women_section: "",
    has_women_section: false,
    phone: "",
    live_url: "",
    registration_url: "",
    maps_url: "",
    links: [],
    is_course: false,
    activity_type: "درس",
    start_date: "",
    end_date: "",
    raw_ocr_text: "",
    keywords: [],
    slug: "",
    confidence: 0,
  };
}

export function normalizeExtractedPayload(extracted, enriched = {}) {
  const corrected = enriched.corrected || {};
  const merged = {
    ...emptyLessonPayload(),
    ...extracted,
    ...corrected,
    start_date: corrected.start_date || extracted.start_date || extracted.gregorian_date || "",
    gregorian_date: extracted.gregorian_date || corrected.gregorian_date || extracted.start_date || "",
    has_live_stream: Boolean(extracted.has_live_stream || extracted.live_url),
    has_women_section: Boolean(
      extracted.has_women_section || (extracted.women_section && String(extracted.women_section).trim()),
    ),
    seo_title: enriched.seo_title || extracted.title || "",
    seo_description: enriched.seo_description || extracted.description || "",
    slug: enriched.slug || extracted.slug || buildLessonSlug(extracted.title),
    external_key: buildExternalKey({ ...extracted, ...corrected }),
  };
  return merged;
}

export function buildMissingFields(data) {
  const checks = [
    { key: "title", label: "عنوان الدرس" },
    { key: "speaker_name", label: "اسم الشيخ" },
    { key: "day_of_week", label: "اليوم" },
    { key: "lesson_time", label: "الوقت" },
    { key: "mosque", label: "المسجد" },
    { key: "city", label: "المحافظة" },
  ];
  return checks.filter((c) => !String(data[c.key] || "").trim()).map((c) => c.key);
}

export function validateExtracted(extracted) {
  return validateLessonDraft(extracted);
}
