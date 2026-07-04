/**
 * Vision + OCR + AI enrichment for lesson posters (Arabic).
 * Falls back to manual entry when ANTHROPIC_API_KEY is missing.
 *
 * سياسة الأخطاء:
 *  - جميع أخطاء Anthropic تُصنَّف هنا ولا تُمرَّر خاماً للواجهة
 *  - التسجيل الكامل في console بدون كشف المفتاح السري
 *  - إعادة المحاولة تلقائياً عند 429 و5xx مع Exponential Backoff
 */
import Anthropic from "@anthropic-ai/sdk";
import { validateLessonDraft, buildExternalKey, buildLessonSlug } from "./content-validator.mjs";

const MODEL = "claude-sonnet-4-6";
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;
const TIMEOUT_MS = 60_000;

const EXTRACTION_PROMPT = `أنت نظام استخراج بيانات لمنصة علمية إسلامية كويتية.
من صورة إعلان درس/دورة، استخرج كل المعلومات بدقة.

قواعد تصنيف الجمهور:
- audience = "نساء" فقط إذا وُجد نص صريح مثل "للنساء فقط" أو "خاص بالنساء" أو "دروس نسائية"
- audience = "رجال" فقط إذا وُجد نص صريح مثل "للرجال فقط" أو "خاص بالرجال"
- audience = "الكل" في كل الحالات الأخرى
- has_women_section = true فقط إذا وُجد "يوجد مكان للنساء" أو "مصلى النساء" (لا علاقة بـ audience)

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
  "audience": "الكل",
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

let _client = null;
function getClient() {
  const key = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!key) return null;
  if (!_client) {
    _client = new Anthropic({ apiKey: key, timeout: TIMEOUT_MS });
  }
  return _client;
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

/** تصنيف خطأ Anthropic SDK وتحويله لرسالة عربية آمنة. */
function classifyAnthropicError(err) {
  const status = err?.status ?? err?.statusCode ?? 0;
  const msg = String(err?.message || err?.error?.message || "").toLowerCase();

  // 400: Credit / Auth / Model
  if (status === 400) {
    if (msg.includes("credit") || msg.includes("balance")) {
      return { code: "credit_exhausted", arabic: "رصيد API منتهٍ — يُرجى شحن حساب Anthropic.", retryable: false };
    }
    if (msg.includes("api_key") || msg.includes("api key") || msg.includes("invalid key")) {
      return { code: "invalid_api_key", arabic: "مفتاح API غير صالح.", retryable: false };
    }
    if (msg.includes("model")) {
      return { code: "model_not_found", arabic: "النموذج المطلوب غير متاح حالياً.", retryable: false };
    }
    return { code: "bad_request", arabic: "طلب غير صالح — يُرجى المحاولة مجدداً.", retryable: false };
  }
  if (status === 401) {
    return { code: "unauthorized", arabic: "مفتاح API غير صالح أو منتهي الصلاحية.", retryable: false };
  }
  if (status === 403) {
    return { code: "forbidden", arabic: "لا تملك صلاحية استخدام هذه الخدمة.", retryable: false };
  }
  if (status === 404) {
    return { code: "not_found", arabic: "النموذج أو الخدمة غير موجودة.", retryable: false };
  }
  if (status === 429) {
    return { code: "rate_limit", arabic: "تجاوزت حد الطلبات — سيُعاد المحاولة تلقائياً.", retryable: true };
  }
  if (status === 408 || err?.name === "APIConnectionTimeoutError") {
    return { code: "timeout", arabic: "انتهت مهلة الاتصال — سيُعاد المحاولة.", retryable: true };
  }
  if (status >= 500 && status < 600) {
    return { code: "server_error", arabic: "خطأ مؤقت في خادم Anthropic — سيُعاد المحاولة.", retryable: true };
  }
  if (err?.name === "APIConnectionError") {
    return { code: "network_error", arabic: "تعذر الاتصال بالخادم — تحقق من الشبكة وأعد المحاولة.", retryable: true };
  }
  return { code: "unknown", arabic: "تعذر الاستخراج التلقائي حالياً — يمكنك إدخال البيانات يدويًا.", retryable: false };
}

/**
 * استدعاء API مع Retry تلقائي وExponential Backoff.
 * يُعيد { ok, text?, errorCode?, errorArabic? }
 */
async function callWithRetry(fn, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now();
    try {
      const result = await fn();
      const elapsed = Date.now() - t0;
      console.log(`[lesson-extractor] ${label} success attempt=${attempt} ms=${elapsed}`);
      return { ok: true, text: result };
    } catch (err) {
      lastErr = err;
      const classified = classifyAnthropicError(err);
      const elapsed = Date.now() - t0;
      // لا نُسجّل API key أو بيانات المستخدم
      console.error(
        `[lesson-extractor] ${label} error attempt=${attempt} ms=${elapsed} code=${classified.code} status=${err?.status ?? 0} model=${MODEL}`,
      );

      if (!classified.retryable || attempt === MAX_RETRIES) {
        return { ok: false, errorCode: classified.code, errorArabic: classified.arabic };
      }
      const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`[lesson-extractor] ${label} retry in ${Math.round(delay)}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  // مسار احتياطي
  const classified = classifyAnthropicError(lastErr);
  return { ok: false, errorCode: classified.code, errorArabic: classified.arabic };
}

async function callVision({ imageBase64, mimeType, textPrompt }) {
  const client = getClient();
  if (!client) return { ok: false, errorCode: "no_key", errorArabic: "مفتاح API غير مضبوط." };

  return callWithRetry(async () => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 } },
            { type: "text", text: textPrompt || EXTRACTION_PROMPT },
          ],
        },
      ],
    });
    const block = response.content?.find((b) => b.type === "text");
    return block?.text || "";
  }, "callVision");
}

async function callText(prompt, data) {
  const client = getClient();
  if (!client) return { ok: false, errorCode: "no_key", errorArabic: "مفتاح API غير مضبوط." };

  return callWithRetry(async () => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: `${prompt}\n\n${JSON.stringify(data, null, 2)}` }],
    });
    const block = response.content?.find((b) => b.type === "text");
    return block?.text || "";
  }, "callText");
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
    audience: "الكل",
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

function normalizePayload(extracted, enriched = {}) {
  const corrected = enriched.corrected || {};
  const merged = {
    ...emptyLessonPayload(),
    ...extracted,
    ...corrected,
    start_date: corrected.start_date || extracted.start_date || extracted.gregorian_date || "",
    gregorian_date: extracted.gregorian_date || corrected.gregorian_date || extracted.start_date || "",
    has_live_stream: Boolean(extracted.has_live_stream || extracted.live_url),
    // has_women_section = صحيح فقط إذا كان هناك نص صريح عن مكان للنساء
    has_women_section: Boolean(
      extracted.has_women_section || (extracted.women_section && String(extracted.women_section).trim()),
    ),
    // audience لا يُعدَّل — الاستخراج يحدده بشكل صحيح
    audience: corrected.audience || extracted.audience || "الكل",
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
    return {
      visionEnabled: false,
      message: "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.",
      extracted: empty,
      extracted_text: "",
      parsed_fields: empty,
      confidence_score: 0,
      aiSuggestions: [],
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      rawVision: "",
    };
  }

  const visionResult = await callVision({ imageBase64, mimeType });
  if (!visionResult.ok) {
    const empty = emptyLessonPayload();
    return {
      visionEnabled: true,
      extraction_failed: true,
      errorCode: visionResult.errorCode,
      errorArabic: visionResult.errorArabic,
      message: visionResult.errorArabic,
      extracted: empty,
      extracted_text: "",
      parsed_fields: empty,
      confidence_score: 0,
      aiSuggestions: [],
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      rawVision: "",
    };
  }

  const visionText = visionResult.text || "";
  const extracted = parseJson(visionText) || { raw_ocr_text: visionText, title: "" };

  // الإثراء اختياري — فشله لا يوقف العملية
  let enriched = { corrected: extracted, suggestions: [] };
  const enrichResult = await callText(ENRICH_PROMPT, extracted);
  if (enrichResult.ok) {
    enriched = parseJson(enrichResult.text) || enriched;
  } else {
    console.warn(`[lesson-extractor] enrich failed (non-fatal): ${enrichResult.errorCode}`);
  }

  const merged = normalizePayload(extracted, enriched);
  const validation = validateLessonDraft(merged);

  return {
    visionEnabled: true,
    extraction_failed: false,
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

  const result = await callWithRetry(async () => {
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
    return block?.text || "";
  }, "extractFromText");

  if (!result.ok) {
    const empty = emptyLessonPayload();
    return {
      visionEnabled: true,
      extraction_failed: true,
      errorCode: result.errorCode,
      errorArabic: result.errorArabic,
      message: result.errorArabic,
      extracted: empty,
      parsed_fields: empty,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
    };
  }

  const extracted = parseJson(result.text) || { title: "", description: text?.slice(0, 500) };
  const merged = normalizePayload(extracted, {});
  return {
    visionEnabled: true,
    extraction_failed: false,
    extracted: merged,
    parsed_fields: merged,
    aiSuggestions: [],
    validation: validateLessonDraft(merged),
    missing_fields: buildMissingFields(merged),
  };
}

export { buildMissingFields };
