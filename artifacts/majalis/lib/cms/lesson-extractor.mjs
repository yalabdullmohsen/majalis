/**
 * Multi-stage lesson extraction pipeline for Arabic Islamic posters.
 *
 * Pipeline:
 *   Stage 1 — Primary Vision (comprehensive Arabic prompt)
 *   Stage 2 — Fallback Vision (text-first prompt, when Stage 1 confidence < 40%)
 *   Stage 3 — DB Enrichment (fill gaps from sheikh/lesson history)
 *   Stage 4 — Confidence computation (server-side, not AI-reported)
 *   Stage 5 — Debug log (stored in draft for admin inspection)
 *
 * Security policy:
 *   - All Anthropic errors classified + translated to Arabic before reaching client
 *   - API keys never logged
 *   - No Quran/Hadith/Fatwa auto-generation
 */
import Anthropic from "@anthropic-ai/sdk";
import { validateLessonDraft, buildExternalKey, buildLessonSlug } from "./content-validator.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const MODEL = "claude-sonnet-4-6";
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 1_000;
// BUG-001 fix: Vercel maxDuration=60s → keep client timeout safely below that
const TIMEOUT_MS = 45_000;
// BUG-002 fix: total pipeline budget (Stage1+2+3+4 must fit inside Vercel's 60s window)
const PIPELINE_BUDGET_MS = 50_000;
// BUG-002 fix: raised threshold requires better confidence to skip Stage 2
const FALLBACK_CONFIDENCE_THRESHOLD = 0.3;

// ── أوزان حساب الثقة (المجموع = 100) ────────────────────────────────────────
const FIELD_WEIGHTS = {
  title: 25,
  speaker_name: 20,
  day_of_week: 15,
  lesson_time: 15,
  mosque: 15,
  city: 10,
};

// ── أسباب فشل الحقول ─────────────────────────────────────────────────────────
const FIELD_FAILURE_REASONS = {
  title: "لم يُعثر على عنوان الدرس في الصورة",
  speaker_name: "تعذر التعرف على اسم الشيخ",
  day_of_week: "لم يُذكر يوم صريح في الصورة",
  lesson_time: "لم يُذكر وقت صريح (لا ساعة ولا صلاة مرجعية)",
  mosque: "لم يُذكر اسم المسجد أو المكان",
  city: "لم تُذكر المحافظة أو المنطقة",
};

// ── Prompt المرحلة الأولى: استخراج شامل ────────────────────────────────────
const PRIMARY_PROMPT = `أنت نظام استخراج بيانات متخصص في قراءة إعلانات الدروس الإسلامية الكويتية.

[الخطوة الأولى — قراءة النص الكامل]
اقرأ كل نص مرئي في الصورة بدقة تامة: العناوين، الأسماء، الأرقام، الأوقات، المواقع، الشعارات، أرقام الهاتف.

[الخطوة الثانية — استخراج البيانات من النص]

عنوان الدرس (title):
- العنوان هو اسم الدرس أو الدورة أو المحاضرة
- مثال: "شرح كتاب الأربعين النووية" أو "درس في التجويد"
- كلمات مؤشرة: شرح / دراسة / درس / دورة / محاضرة / حلقة / مجلس + اسم الكتاب

اسم الشيخ (speaker_name):
- ابحث عن: "الشيخ:" أو "للشيخ" أو "فضيلة" أو "الأستاذ" ثم الاسم
- احتفظ بالاسم الكامل مع اللقب (الشيخ / الدكتور / الأستاذ)

اليوم (day_of_week):
- أيام الأسبوع: السبت، الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة
- "كل يوم X" أو "أسبوعياً" → استخرج اليوم
- إذا تكرر أكثر من يوم: افصلها بـ ، مثل "السبت،الجمعة"

الوقت (lesson_time):
- وقت صريح: "7:30 مساءً" أو "19:30" → استخرجه كما هو
- بعد صلاة مغرب / عشاء / فجر / عصر → "بعد المغرب" / "بعد العشاء" / "بعد الفجر" / "بعد العصر"
- "عقب صلاة الجمعة" → "بعد صلاة الجمعة"

نوع المكان (venue_type) واسمه (mosque):
- مسجد / جامع / مصلى → venue_type="مسجد"
- ديوان → venue_type="ديوان"
- مجلس → venue_type="مجلس"
- مزرعة / استراحة مزرعة → venue_type="مزرعة"
- استراحة / شاليه → venue_type="استراحة"
- مركز / دار علم / مكتبة → venue_type="مركز"
- جامعة / كلية → venue_type="جامعة"
- اسم المكان في mosque بدون كلمة النوع (مثال: "مسجد الرحمة" → mosque="الرحمة")

الموقع (region, city):
- المحافظات: العاصمة، حولي، الفروانية، مبارك الكبير، الأحمدي، الجهراء
- المناطق: السالمية، الرميثية، السلام، الفحيحيل، القادسية، الروضة، الصليبية، إلخ

الجمهور (audience):
- "للنساء فقط" أو "خاص بالنساء" → audience="نساء"
- "للرجال فقط" → audience="رجال"
- "يوجد مكان للنساء" أو "مصلى نساء" → audience="الكل"، has_women_section=true
- الافتراضي: audience="الكل"

أعد JSON فقط (بلا markdown):
{
  "raw_ocr_text": "النص الكامل المقروء من الصورة بدون حذف أي كلمة",
  "title": "",
  "speaker_name": "",
  "gregorian_date": "",
  "hijri_date": "",
  "day_of_week": "",
  "lesson_time": "",
  "venue_type": "مسجد",
  "mosque": "",
  "region": "",
  "city": "",
  "country": "الكويت",
  "category": "تفسير|فقه|عقيدة|حديث|سيرة|تجويد|أخرى",
  "description": "",
  "organizer": "",
  "cooperative_org": "",
  "audience": "الكل",
  "has_live_stream": false,
  "has_women_section": false,
  "women_section": "",
  "phone": "",
  "live_url": "",
  "registration_url": "",
  "maps_url": "",
  "links": [],
  "is_course": false,
  "activity_type": "درس",
  "start_date": "",
  "end_date": "",
  "keywords": [],
  "slug": "",
  "field_confidence": {
    "title": 0.0,
    "speaker_name": 0.0,
    "day_of_week": 0.0,
    "lesson_time": 0.0,
    "mosque": 0.0,
    "city": 0.0
  }
}

ملاحظة: في field_confidence، ضع 1.0 إذا وجدت الحقل بوضوح، 0.5 إذا استنتجته، 0.0 إذا لم تجده.
لا تخمّن أحكاماً شرعية أو فتاوى.`;

// ── Prompt المرحلة الثانية: استخراج تركيزي عند فشل المرحلة الأولى ─────────
const FALLBACK_PROMPT = `اقرأ هذه الصورة بتركيز تام.

أولاً، اكتب كل نص مرئي في الصورة كلمة كلمة (حتى لو كان صغيراً أو في زاوية أو في تذييل الصورة).

ثانياً، بناءً على ما قرأت، أجب:
- من هو الشيخ؟ (ابحث عن كلمة "للشيخ" أو "الشيخ")
- ما عنوان الدرس؟ (ابحث عن اسم الكتاب أو الموضوع)
- متى يُعقد؟ (يوم + وقت)
- أين يُعقد؟ (مسجد / ديوان / مجلس + اسمه + منطقته)
- ما رقم الهاتف؟

أعد JSON:
{
  "raw_ocr_text": "كل النصوص المرئية كاملة",
  "title": "",
  "speaker_name": "",
  "day_of_week": "",
  "lesson_time": "",
  "venue_type": "مسجد",
  "mosque": "",
  "region": "",
  "city": "",
  "country": "الكويت",
  "phone": "",
  "organizer": "",
  "category": "أخرى",
  "audience": "الكل",
  "has_live_stream": false,
  "has_women_section": false,
  "is_course": false,
  "activity_type": "درس",
  "keywords": [],
  "links": [],
  "field_confidence": {
    "title": 0.0,
    "speaker_name": 0.0,
    "day_of_week": 0.0,
    "lesson_time": 0.0,
    "mosque": 0.0,
    "city": 0.0
  }
}`;

// ── Prompt الإثراء (enrichment) ───────────────────────────────────────────────
const ENRICH_PROMPT = `راجع بيانات الدرس التالية وأصلح:
- الأخطاء الإملائية العربية
- صيغة التاريخ والوقت
- تصنيف الدرس
- slug SEO بالإنجليزية/transliteration (بلا مسافات)
- meta description للSEO (≤160 حرف)

أعد JSON فقط:
{
  "corrected": {},
  "suggestions": [{ "field": "", "old": "", "new": "", "reason": "" }],
  "seo_title": "",
  "seo_description": "",
  "slug": ""
}`;

// ── Client ────────────────────────────────────────────────────────────────────
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

// ── JSON parser ───────────────────────────────────────────────────────────────
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

// ── Error classifier ──────────────────────────────────────────────────────────
function classifyAnthropicError(err) {
  const status = err?.status ?? err?.statusCode ?? 0;
  const msg = String(err?.message || err?.error?.message || "").toLowerCase();

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
  if (status === 401) return { code: "unauthorized", arabic: "مفتاح API غير صالح أو منتهي الصلاحية.", retryable: false };
  if (status === 403) return { code: "forbidden", arabic: "لا تملك صلاحية استخدام هذه الخدمة.", retryable: false };
  if (status === 404) return { code: "not_found", arabic: "النموذج أو الخدمة غير موجودة.", retryable: false };
  if (status === 429) return { code: "rate_limit", arabic: "تجاوزت حد الطلبات — سيُعاد المحاولة تلقائياً.", retryable: true };
  if (status === 408 || err?.name === "APIConnectionTimeoutError") {
    return { code: "timeout", arabic: "انتهت مهلة الاتصال — سيُعاد المحاولة.", retryable: true };
  }
  if (status >= 500 && status < 600) {
    return { code: "server_error", arabic: "خطأ مؤقت في خادم Anthropic — سيُعاد المحاولة.", retryable: true };
  }
  if (err?.name === "APIConnectionError") {
    return { code: "network_error", arabic: "تعذر الاتصال بالخادم — تحقق من الشبكة وأعد المحاولة.", retryable: true };
  }
  return { code: "unknown", arabic: "تعذر الاستخراج التلقائي — يمكنك إدخال البيانات يدويًا.", retryable: false };
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────
async function callWithRetry(fn, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const t0 = Date.now();
    try {
      const result = await fn();
      console.log(`[lesson-extractor] ${label} ok attempt=${attempt} ms=${Date.now() - t0}`);
      return { ok: true, text: result, ms: Date.now() - t0 };
    } catch (err) {
      lastErr = err;
      const c = classifyAnthropicError(err);
      console.error(
        `[lesson-extractor] ${label} error attempt=${attempt} ms=${Date.now() - t0} code=${c.code} status=${err?.status ?? 0}`,
      );
      if (!c.retryable || attempt === MAX_RETRIES) {
        return { ok: false, errorCode: c.code, errorArabic: c.arabic, ms: Date.now() - t0 };
      }
      const delay = BASE_BACKOFF_MS * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`[lesson-extractor] ${label} retry in ${Math.round(delay)}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  const c = classifyAnthropicError(lastErr);
  return { ok: false, errorCode: c.code, errorArabic: c.arabic };
}

// ── Vision call ───────────────────────────────────────────────────────────────
async function callVision({ imageBase64, mimeType, prompt }) {
  const client = getClient();
  if (!client) return { ok: false, errorCode: "no_key", errorArabic: "مفتاح API غير مضبوط.", ms: 0 };

  return callWithRetry(async () => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    return response.content?.find((b) => b.type === "text")?.text || "";
  }, `callVision[${prompt === PRIMARY_PROMPT ? "primary" : "fallback"}]`);
}

// ── Text call ─────────────────────────────────────────────────────────────────
async function callText(prompt, data) {
  const client = getClient();
  if (!client) return { ok: false, errorCode: "no_key", errorArabic: "مفتاح API غير مضبوط.", ms: 0 };

  return callWithRetry(async () => {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: `${prompt}\n\n${JSON.stringify(data, null, 2)}` }],
    });
    return response.content?.find((b) => b.type === "text")?.text || "";
  }, "callEnrich");
}

// ── Confidence computation (server-side) ──────────────────────────────────────
function computeConfidenceScore(data) {
  let score = 0;
  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const val = String(data[field] || "").trim();
    if (val) score += weight;
  }
  return Math.round(score) / 100;
}

// ── Failure reasons builder ───────────────────────────────────────────────────
function buildFailureReasons(data, fieldConfidences = {}) {
  const reasons = {};
  for (const [field, reason] of Object.entries(FIELD_FAILURE_REASONS)) {
    const val = String(data[field] || "").trim();
    if (!val) {
      reasons[field] = reason;
    } else if (fieldConfidences[field] < 0.5) {
      reasons[field] = `تم استنتاج "${val}" — يُرجى التحقق يدوياً`;
    }
  }
  return reasons;
}

// ── Missing fields ────────────────────────────────────────────────────────────
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

// ── DB enrichment ─────────────────────────────────────────────────────────────
async function enrichFromDatabase(data, debugStages) {
  const admin = getSupabaseAdmin();
  if (!admin) return data;

  const t0 = Date.now();
  const enriched = { ...data };
  const dbInfo = { fields_filled: [], sources: {} };

  // إثراء من سجل دروس الشيخ
  const speakerName = String(data.speaker_name || "").trim();
  if (speakerName && (!enriched.mosque || !enriched.city || !enriched.day_of_week)) {
    try {
      const normalized = speakerName.replace(/^(الشيخ|فضيلة|معالي|د\.|دكتور)\s+/u, "").trim();
      const { data: sheikhLessons } = await admin
        .from("lessons")
        .select("mosque, day_of_week, lesson_time, city, region")
        .or(`speaker_name.ilike.%${normalized}%,title.ilike.%${normalized}%`)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3);

      if (sheikhLessons?.length > 0) {
        const latest = sheikhLessons[0];
        if (!enriched.mosque && latest.mosque) {
          enriched.mosque = latest.mosque;
          dbInfo.fields_filled.push("mosque");
          dbInfo.sources.mosque = "sheikh_lesson_history";
        }
        if (!enriched.city && latest.city) {
          enriched.city = latest.city;
          dbInfo.fields_filled.push("city");
          dbInfo.sources.city = "sheikh_lesson_history";
        }
        if (!enriched.region && latest.region) {
          enriched.region = latest.region;
          dbInfo.fields_filled.push("region");
          dbInfo.sources.region = "sheikh_lesson_history";
        }
      }
    } catch (e) {
      console.warn("[lesson-extractor] db_sheikh_enrichment failed:", e?.message);
    }
  }

  // إثراء اسم الشيخ من جدول sheikhs
  if (speakerName && !enriched.city) {
    try {
      const normalized = speakerName.replace(/^(الشيخ|فضيلة|معالي|د\.|دكتور)\s+/u, "").trim();
      const { data: sheikhs } = await admin
        .from("sheikhs")
        .select("name, city")
        .ilike("name", `%${normalized.split(" ")[0]}%`)
        .limit(3);

      const match = sheikhs?.find((s) => s.city);
      if (match?.city) {
        enriched.city = match.city;
        dbInfo.fields_filled.push("city");
        dbInfo.sources.city = "sheikhs_table";
      }
    } catch (e) {
      console.warn("[lesson-extractor] db_sheikh_city_lookup failed:", e?.message);
    }
  }

  debugStages.push({ stage: "db_enrichment", ms: Date.now() - t0, ...dbInfo });
  return enriched;
}

// ── Merge two extraction results (take best per field) ────────────────────────
function mergeExtractions(primary, fallback) {
  if (!fallback) return primary;
  const merged = { ...primary };
  const FIELDS = ["title", "speaker_name", "day_of_week", "lesson_time", "mosque", "region", "city", "phone", "organizer", "category", "description", "venue_type", "raw_ocr_text"];
  for (const field of FIELDS) {
    if (!String(merged[field] || "").trim() && String(fallback[field] || "").trim()) {
      merged[field] = fallback[field];
    }
  }
  // دمج field_confidence
  const fc = { ...(primary.field_confidence || {}), ...(fallback.field_confidence || {}) };
  for (const [f, score] of Object.entries(fallback.field_confidence || {})) {
    if (!primary.field_confidence?.[f] || score > (primary.field_confidence[f] || 0)) {
      fc[f] = score;
    }
  }
  merged.field_confidence = fc;
  return merged;
}

// ── Normalize payload ─────────────────────────────────────────────────────────
function normalizePayload(extracted, enriched = {}) {
  const corrected = enriched.corrected || {};
  const base = {
    ...emptyLessonPayload(),
    ...extracted,
    ...corrected,
    start_date: corrected.start_date || extracted.start_date || extracted.gregorian_date || "",
    gregorian_date: extracted.gregorian_date || corrected.gregorian_date || extracted.start_date || "",
    has_live_stream: Boolean(extracted.has_live_stream || extracted.live_url),
    has_women_section: Boolean(
      extracted.has_women_section || (extracted.women_section && String(extracted.women_section).trim()),
    ),
    audience: corrected.audience || extracted.audience || "الكل",
    seo_title: enriched.seo_title || extracted.title || "",
    seo_description: enriched.seo_description || extracted.description || "",
    slug: enriched.slug || extracted.slug || buildLessonSlug(extracted.title || ""),
    external_key: buildExternalKey({ ...extracted, ...corrected }),
  };
  // تنظيف venue_type: تأكد أنه ضمن القائمة المعتمدة
  const VALID_VENUE_TYPES = ["مسجد", "مجلس", "ديوان", "مزرعة", "استراحة", "مركز", "جامعة", "أخرى"];
  if (!VALID_VENUE_TYPES.includes(base.venue_type)) base.venue_type = "مسجد";
  return base;
}

export function emptyLessonPayload() {
  return {
    title: "",
    speaker_name: "",
    gregorian_date: "",
    hijri_date: "",
    day_of_week: "",
    lesson_time: "",
    venue_type: "مسجد",
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

// ── Main extraction function ──────────────────────────────────────────────────
export async function extractLessonFromImage({ imageBase64, mimeType = "image/jpeg" }) {
  const pipelineStart = Date.now();
  const debugStages = [];

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
      failure_reasons: buildFailureReasons(empty),
      debug_log: { stages: [], total_ms: 0 },
      rawVision: "",
    };
  }

  // ── Stage 1: Primary Vision ────────────────────────────────────────────────
  const s1Start = Date.now();
  const primaryResult = await callVision({ imageBase64, mimeType, prompt: PRIMARY_PROMPT });

  if (!primaryResult.ok) {
    const empty = emptyLessonPayload();
    return {
      visionEnabled: true,
      extraction_failed: true,
      errorCode: primaryResult.errorCode,
      errorArabic: primaryResult.errorArabic,
      message: primaryResult.errorArabic,
      extracted: empty,
      extracted_text: "",
      parsed_fields: empty,
      confidence_score: 0,
      aiSuggestions: [],
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      failure_reasons: { _global: primaryResult.errorArabic },
      debug_log: {
        stages: [{ stage: "primary_vision", ok: false, error: primaryResult.errorCode, ms: primaryResult.ms }],
        total_ms: Date.now() - pipelineStart,
      },
      rawVision: "",
    };
  }

  const primaryText = primaryResult.text || "";
  let primaryData = parseJson(primaryText) || { raw_ocr_text: primaryText };

  debugStages.push({
    stage: "primary_vision",
    ok: true,
    ms: Date.now() - s1Start,
    fields_found: Object.keys(FIELD_WEIGHTS).filter((f) => String(primaryData[f] || "").trim()),
    fields_missing: Object.keys(FIELD_WEIGHTS).filter((f) => !String(primaryData[f] || "").trim()),
    raw_confidence: computeConfidenceScore(primaryData),
  });

  // ── Stage 2: Fallback Vision (if confidence < threshold) ──────────────────
  let finalData = primaryData;
  const primaryConfidence = computeConfidenceScore(primaryData);

  if (primaryConfidence < FALLBACK_CONFIDENCE_THRESHOLD) {
    const s2Start = Date.now();
    const fallbackResult = await callVision({ imageBase64, mimeType, prompt: FALLBACK_PROMPT });

    if (fallbackResult.ok) {
      const fallbackData = parseJson(fallbackResult.text || "") || {};
      finalData = mergeExtractions(primaryData, fallbackData);

      debugStages.push({
        stage: "fallback_vision",
        ok: true,
        ms: Date.now() - s2Start,
        fields_recovered: Object.keys(FIELD_WEIGHTS).filter(
          (f) => !String(primaryData[f] || "").trim() && String(fallbackData[f] || "").trim(),
        ),
        confidence_after_merge: computeConfidenceScore(finalData),
      });
    } else {
      debugStages.push({ stage: "fallback_vision", ok: false, error: fallbackResult.errorCode, ms: Date.now() - s2Start });
    }
  }

  // ── Stage 3: DB Enrichment ────────────────────────────────────────────────
  const currentConfidence = computeConfidenceScore(finalData);
  if (currentConfidence < 0.85) {
    finalData = await enrichFromDatabase(finalData, debugStages);
  }

  // ── Stage 4: Enrich (spelling + SEO) — BUG-002: skip if budget exhausted ──
  let enriched = { corrected: finalData, suggestions: [] };
  const elapsedSoFar = Date.now() - pipelineStart;
  if (elapsedSoFar < PIPELINE_BUDGET_MS - 12_000) {
    const enrichResult = await callText(ENRICH_PROMPT, finalData);
    if (enrichResult.ok) {
      const parsed = parseJson(enrichResult.text);
      if (parsed) enriched = parsed;
    } else {
      console.warn(`[lesson-extractor] enrich non-fatal: ${enrichResult.errorCode}`);
    }
  } else {
    console.warn(`[lesson-extractor] enrich skipped: budget exhausted elapsed=${elapsedSoFar}ms`);
  }

  // ── Stage 5: Normalize + confidence ──────────────────────────────────────
  const merged = normalizePayload(finalData, enriched);
  const fieldConfidences = finalData.field_confidence || {};
  const finalConfidence = computeConfidenceScore(merged);
  const validation = validateLessonDraft(merged);
  const missing = buildMissingFields(merged);
  const failureReasons = buildFailureReasons(merged, fieldConfidences);

  debugStages.push({
    stage: "final",
    ok: true,
    ms: Date.now() - pipelineStart,
    confidence: finalConfidence,
    missing_fields: missing,
    failure_reasons: failureReasons,
  });

  const debugLog = {
    stages: debugStages,
    field_confidence: fieldConfidences,
    failure_reasons: failureReasons,
    raw_ocr_text: merged.raw_ocr_text || primaryText,
    total_ms: Date.now() - pipelineStart,
  };

  return {
    visionEnabled: true,
    extraction_failed: false,
    extracted: merged,
    extracted_text: merged.raw_ocr_text || primaryText,
    parsed_fields: merged,
    confidence_score: finalConfidence,
    field_confidence: fieldConfidences,
    failure_reasons: failureReasons,
    aiSuggestions: enriched.suggestions || [],
    validation,
    missing_fields: missing,
    rawVision: primaryText,
    debug_log: debugLog,
  };
}

// ── Action Registry ───────────────────────────────────────────────────────────
export const SUPPORTED_CONTENT_TYPES = [
  "lesson", "article", "fatwa", "hadith", "story", "book",
  "news", "announcement", "event", "scholar_bio", "seerah",
];

const LESSON_HINTS = ["درس أسبوعي", "إعلان", "مناسبة", "دورة"];

function buildGeneralPrompt(hint) {
  return `أنت نظام استخراج بيانات من نصوص المحتوى الإسلامي.
نوع المحتوى المتوقع: ${hint || "عام"}

اقرأ النص بدقة تامة ثم أعد JSON فقط (بلا markdown):
{
  "content_type": "${hint || "عام"}",
  "title": "",
  "speaker_name": "",
  "author": "",
  "day_of_week": "",
  "lesson_time": "",
  "venue_type": "مسجد",
  "mosque": "",
  "region": "",
  "city": "",
  "country": "الكويت",
  "date": "",
  "category": "",
  "description": "",
  "body": "",
  "source": "",
  "organizer": "",
  "phone": "",
  "audience": "الكل",
  "has_live_stream": false,
  "has_women_section": false,
  "is_course": false,
  "activity_type": "درس",
  "keywords": [],
  "links": [],
  "field_confidence": {
    "title": 0.0,
    "speaker_name": 0.0,
    "day_of_week": 0.0,
    "lesson_time": 0.0,
    "mosque": 0.0,
    "city": 0.0
  }
}

تعليمات:
- title: العنوان الرئيسي للمحتوى
- speaker_name / author: اسم الشيخ أو المؤلف أو المصدر
- body: النص الكامل أو ملخص وافٍ (≤800 حرف)
- description: وصف مختصر للـ SEO (≤160 حرف)
- category: تصنيف الموضوع (فقه / عقيدة / حديث / سيرة / تفسير / تجويد / أخرى)
- في field_confidence: ضع 1.0 إذا وجدت الحقل بوضوح، 0.5 إذا استنتجته، 0.0 إذا لم تجده
- لا تخمّن أحكاماً شرعية أو فتاوى من عندك`;
}

export async function extractContentFromText({ text, hint = "" }) {
  const useLesson = LESSON_HINTS.some((h) => hint.includes(h)) || !hint;
  const prompt = useLesson ? PRIMARY_PROMPT : buildGeneralPrompt(hint);

  if (!isVisionEnabled()) {
    const empty = { ...emptyLessonPayload(), description: text?.slice(0, 500) || "", content_type: hint || "lesson" };
    return {
      visionEnabled: false,
      message: "الاستخراج التلقائي غير مفعّل — يمكنك إدخال البيانات يدويًا.",
      extracted: empty,
      parsed_fields: empty,
      confidence_score: 0,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      failure_reasons: buildFailureReasons(empty),
    };
  }

  const result = await callWithRetry(async () => {
    const client = getClient();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: `${prompt}\n\nالنص:\n${text}` }],
    });
    return response.content?.find((b) => b.type === "text")?.text || "";
  }, `extractContentFromText[${hint || "general"}]`);

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
      confidence_score: 0,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      failure_reasons: buildFailureReasons(empty),
    };
  }

  const extracted = parseJson(result.text) || { title: "", description: text?.slice(0, 500), content_type: hint };
  const merged = normalizePayload(extracted, {});
  merged.content_type = hint || merged.content_type || "lesson";
  if (extracted.body) merged.body = extracted.body;
  if (extracted.author) merged.author = extracted.author;
  const confidence = computeConfidenceScore(merged);

  return {
    visionEnabled: true,
    extraction_failed: false,
    extracted: merged,
    parsed_fields: merged,
    confidence_score: confidence,
    field_confidence: extracted.field_confidence || {},
    failure_reasons: buildFailureReasons(merged, extracted.field_confidence || {}),
    aiSuggestions: [],
    validation: validateLessonDraft(merged),
    missing_fields: buildMissingFields(merged),
  };
}

// ── Text extraction (URL-based) ───────────────────────────────────────────────
export async function extractLessonFromText({ text, sourceUrl }) {
  if (!isVisionEnabled()) {
    const empty = { ...emptyLessonPayload(), description: text?.slice(0, 500) || "" };
    return {
      visionEnabled: false,
      message: "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا.",
      extracted: empty,
      parsed_fields: empty,
      confidence_score: 0,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      failure_reasons: buildFailureReasons(empty),
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
          content: `${PRIMARY_PROMPT}\n\nالمصدر: ${sourceUrl || ""}\n\nالنص:\n${text}`,
        },
      ],
    });
    return response.content?.find((b) => b.type === "text")?.text || "";
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
      confidence_score: 0,
      validation: validateLessonDraft(empty),
      missing_fields: buildMissingFields(empty),
      failure_reasons: buildFailureReasons(empty),
    };
  }

  const extracted = parseJson(result.text) || { title: "", description: text?.slice(0, 500) };
  const merged = normalizePayload(extracted, {});
  const confidence = computeConfidenceScore(merged);

  return {
    visionEnabled: true,
    extraction_failed: false,
    extracted: merged,
    parsed_fields: merged,
    confidence_score: confidence,
    field_confidence: extracted.field_confidence || {},
    failure_reasons: buildFailureReasons(merged, extracted.field_confidence || {}),
    aiSuggestions: [],
    validation: validateLessonDraft(merged),
    missing_fields: buildMissingFields(merged),
  };
}

export { buildMissingFields };
