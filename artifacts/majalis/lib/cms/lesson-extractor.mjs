/**
 * Vision + OCR + AI enrichment for lesson posters (Arabic).
 */
import Anthropic from "@anthropic-ai/sdk";
import { validateLessonDraft, buildExternalKey } from "./content-validator.mjs";

const MODEL = "claude-sonnet-4-6";

const EXTRACTION_PROMPT = `أنت نظام استخراج بيانات لمنصة علمية إسلامية كويتية.
من صورة إعلان درس/دورة، استخرج كل المعلومات بدقة.

أعد JSON فقط بدون markdown:
{
  "title": "عنوان الدرس",
  "speaker_name": "اسم الشيخ",
  "day_of_week": "اليوم بالعربية",
  "lesson_time": "الوقت",
  "mosque": "اسم المسجد",
  "region": "المنطقة",
  "city": "المحافظة",
  "category": "تفسير|فقه|عقيدة|حديث|سيرة|تجويد|أخرى",
  "description": "وصف مختصر",
  "organizer": "الجهة المنظمة",
  "live_url": "رابط البث إن وُجد",
  "women_section": "مكان النساء إن ذُكر",
  "phone": "رقم الهاتف",
  "registration_url": "رابط التسجيل",
  "maps_url": "رابط الخريطة",
  "is_course": false,
  "activity_type": "درس",
  "start_date": "YYYY-MM-DD إن وُجد",
  "end_date": "YYYY-MM-DD إن وُجد",
  "raw_ocr_text": "النص العربي الكامل المقروء من الصورة",
  "keywords": ["كلمات", "مفتاحية"],
  "confidence": 0.0
}

إذا لم تجد حقلًا اتركه فارغاً "". لا تخمّن fatwa أو أحكام.`;

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

function getClient() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
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
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: `${prompt}\n\n${JSON.stringify(data, null, 2)}` }],
  });
  const block = response.content?.find((b) => b.type === "text");
  return block?.text || "";
}

export async function extractLessonFromImage({ imageBase64, mimeType = "image/jpeg" }) {
  const visionText = await callVision({ imageBase64, mimeType });
  const extracted = parseJson(visionText) || { raw_ocr_text: visionText, title: "" };

  const enrichText = await callText(ENRICH_PROMPT, extracted);
  const enriched = parseJson(enrichText) || { corrected: extracted, suggestions: [] };

  const merged = {
    ...extracted,
    ...(enriched.corrected || {}),
    seo_title: enriched.seo_title || extracted.title,
    seo_description: enriched.seo_description || extracted.description,
    slug: enriched.slug || "",
    external_key: buildExternalKey({ ...extracted, ...(enriched.corrected || {}) }),
  };

  const validation = validateLessonDraft(merged);

  return {
    extracted: merged,
    aiSuggestions: enriched.suggestions || [],
    validation,
    rawVision: visionText,
  };
}

export async function extractLessonFromText({ text, sourceUrl }) {
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
  const merged = {
    ...extracted,
    ...(enriched.corrected || {}),
    external_key: buildExternalKey(extracted),
  };
  return {
    extracted: merged,
    aiSuggestions: enriched.suggestions || [],
    validation: validateLessonDraft(merged),
  };
}
