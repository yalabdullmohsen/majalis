/**
 * Telegram AI Extraction Engine
 * Extracts structured lesson data from raw Telegram channel posts using Claude.
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const EXTRACTION_PROMPT = `أنت مساعد متخصص في استخراج بيانات الدروس والمحاضرات الإسلامية من إعلانات التيليجرام.

استخرج البيانات التالية من الإعلان وأعدها بصيغة JSON فقط (بدون أي نص إضافي):

{
  "title": "عنوان الدرس أو المحاضرة (منقح ومنظم)",
  "sheikh_name": "اسم الشيخ أو المحاضر",
  "category": "أحد التصنيفات: عقيدة | فقه | حديث | تفسير | سيرة | تزكية | لغة_عربية | أصول_الفقه | تجويد | دعوة | محاضرة | دورة | مجلس_علم | لقاء | برنامج_علمي",
  "event_date": "YYYY-MM-DD أو null",
  "event_day": "الاسم العربي لليوم أو null",
  "event_time": "HH:MM بصيغة 24h أو null",
  "mosque": "اسم المسجد أو المكان",
  "area": "الحي أو المنطقة",
  "city": "المدينة",
  "governorate": "المحافظة",
  "country": "الدولة (الافتراضي: الكويت)",
  "stream_url": "رابط البث المباشر أو null",
  "location_url": "رابط خرائط المكان أو null",
  "contact": "رقم التواصل أو null",
  "organizer": "الجهة المنظمة",
  "co_organizer": "الجهة المتعاونة أو null",
  "has_womens_section": true/false/null,
  "description": "وصف احترافي مختصر بـ 2-3 جمل",
  "confidence_scores": {
    "title": 0-1,
    "sheikh_name": 0-1,
    "event_date": 0-1,
    "event_time": 0-1,
    "mosque": 0-1,
    "category": 0-1
  }
}

قواعد مهمة:
- إذا لم تجد بيانات كافية لحقل، ضع null
- لا تخترع أو تخمن تواريخ أو أسماء — فقط استخرج ما هو موجود فعلاً
- نظّف الأخطاء الإملائية في العنوان والاسم
- أزل الإيموجي من العنوان والوصف النهائي
- وحّد صيغة التاريخ والوقت
- درجة الثقة 1.0 = مذكور صراحةً، 0.5 = مستنتج من سياق، 0.0 = غير موجود`;

export async function extractLessonFromText(rawText, rawCaption = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY not set" };

  const content = [rawText, rawCaption].filter(Boolean).join("\n\n---\n\n");
  if (!content.trim()) return { ok: false, error: "empty_content" };

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `${EXTRACTION_PROMPT}\n\nالإعلان:\n${content}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `anthropic_${res.status}: ${err.slice(0, 200)}` };
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const usage = data.usage || {};

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, error: "no_json_in_response", raw: text.slice(0, 500) };

    let extracted;
    try {
      extracted = JSON.parse(jsonMatch[0]);
    } catch {
      return { ok: false, error: "invalid_json", raw: jsonMatch[0].slice(0, 500) };
    }

    return {
      ok: true,
      data: extracted,
      model: MODEL,
      promptTokens: usage.input_tokens,
      completionTokens: usage.output_tokens,
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export function computeQualityScore(extracted) {
  const weights = {
    title: 25,
    sheikh_name: 20,
    event_date: 20,
    mosque: 15,
    category: 10,
    event_time: 5,
    description: 5,
  };

  let score = 0;
  let totalWeight = 0;
  const missing = [];

  for (const [field, weight] of Object.entries(weights)) {
    totalWeight += weight;
    const value = extracted[field];
    const confidence = extracted.confidence_scores?.[field] ?? 1;
    if (value && value !== null && value !== "") {
      score += weight * confidence;
    } else {
      missing.push(field);
    }
  }

  const pct = Math.round((score / totalWeight) * 100) / 100;

  let status;
  let reason = null;

  if (pct >= 0.85) {
    status = "complete";
  } else if (pct >= 0.55) {
    status = "needs_review";
    reason = `حقول ناقصة: ${missing.join(", ")}`;
  } else {
    status = "incomplete";
    reason = `بيانات غير كافية — حقول ناقصة: ${missing.join(", ")}`;
  }

  return { score: pct, status, reason };
}

export function buildContentHash(extracted) {
  const parts = [
    (extracted.title || "").trim().replace(/\s+/g, " ").toLowerCase(),
    (extracted.sheikh_name || "").trim().toLowerCase(),
    extracted.event_date || "",
    (extracted.mosque || "").trim().toLowerCase(),
  ].filter(Boolean);

  if (parts.length < 2) return null;

  // Simple hash: sorted join
  return Buffer.from(parts.join("|")).toString("base64").replace(/=/g, "");
}
