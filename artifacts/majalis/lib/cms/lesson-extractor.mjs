/**
 * Vision + OCR + AI enrichment for lesson posters (Arabic).
 * Falls back to manual entry when ANTHROPIC_API_KEY is missing.
 */
import Anthropic from "@anthropic-ai/sdk";
import { validateLessonDraft, buildExternalKey, buildLessonSlug } from "./content-validator.mjs";

const MODEL = "claude-sonnet-4-6";

const EXTRACTION_PROMPT = `أنت نظام استخراج بيانات لمنصة علمية إسلامية كويتية.
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

const ENRICH_PROMPT = `راجع بيانات الدرس التالية وأصلح:
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

export function isVisionEnabled() {
  return Boolean((process.env.ANTHROPIC_API_KEY || "").trim());
}

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

function getClient() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

function parseJson(text) {
  const raw = String(text || "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callVision({ imageBase64, mimeType, textPrompt }) {
  const client = getClient();
  if (!client) return null;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 },
          },
          { type: "text", text: textPrompt || EXTRACTION_PROMPT },
        ],
      },
    ],
  });
  const block = response.content?.find((b) => b.type === "text");
  return block?.text || "";
}

async function callText(prompt, data) {
  const client = getClient();
  if (!client) return null;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: `${prompt}\n\n${JSON.stringify(data, null, 2)}` }],
  });
  const block = response.content?.find((b) => b.type === "text");
  return block?.text || "";
}

function normalizePayload(extracted, enriched = {}) {
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

function buildMissingFields(data) {
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

export async function extractLessonFromImage({ imageBase64, mimeType = "image/jpeg" }) {
  if (!isVisionEnabled()) {
    const empty = emptyLessonPayload();
    const validation = validateLessonDraft(empty);
    return {
      visionEnabled: false,
      message: "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.",
      extracted: empty,
      extracted_text: "",
      parsed_fields: empty,
      confidence_score: 0,
      aiSuggestions: [],
      validation,
      missing_fields: buildMissingFields(empty),
      rawVision: "",
    };
  }

  const visionText = await callVision({ imageBase64, mimeType });
  const extracted = parseJson(visionText) || { raw_ocr_text: visionText, title: "" };

  const enrichText = await callText(ENRICH_PROMPT, extracted);
  const enriched = parseJson(enrichText) || { corrected: extracted, suggestions: [] };

  const merged = normalizePayload(extracted, enriched);
  const validation = validateLessonDraft(merged);

  return {
    visionEnabled: true,
    extracted: merged,
    extracted_text: merged.raw_ocr_text || visionText,
    parsed_fields: merged,
    confidence_score: Number(merged.confidence) || 0,
    aiSuggestions: enriched.suggestions || [],
    validation,
    missing_fields: buildMissingFields(merged),
    rawVision: visionText,
  };
}

export async function extractLessonFromText({ text, sourceUrl }) {
  if (!isVisionEnabled()) {
    const empty = { ...emptyLessonPayload(), description: text?.slice(0, 500) || "" };
    return {
      visionEnabled: false,
      message: "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.",
      extracted: empty,
      parsed_fields: empty,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
    };
  }

  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${EXTRACTION_PROMPT}\n\nالمصدر: ${sourceUrl || ""}\n\nالنص:\n${text}`,
      },
    ],
  });
  const block = response.content?.find((b) => b.type === "text");
  const visionText = block?.text || "";
  const extracted = parseJson(visionText) || { title: "", description: text?.slice(0, 500) };
  const enrichText = await callText(ENRICH_PROMPT, extracted);
  const enriched = parseJson(enrichText) || { corrected: extracted, suggestions: [] };
  const merged = normalizePayload(extracted, enriched);
  return {
    visionEnabled: true,
    extracted: merged,
    parsed_fields: merged,
    aiSuggestions: enriched.suggestions || [],
    validation: validateLessonDraft(merged),
    missing_fields: buildMissingFields(merged),
  };
}

export { buildMissingFields };
