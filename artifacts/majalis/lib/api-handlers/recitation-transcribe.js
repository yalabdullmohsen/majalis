/**
 * recitation-transcribe.js
 * وسيط خادمي بين مزوّد التسميع الخادمي (ServerQuranASRProvider) وGroq
 * (استضافة رسمية سريعة لـ whisper-large-v3 عبر REST، لا حاجة لإدارة
 * استضافة GPU خاصة بنا — "الخيار ب" من قرار المعمارية في التقرير النهائي).
 *
 * ⚠️ قرار تعمُّدي: **لا** يُستخدَم tarteel-ai/whisper-base-ar-quran رغم
 * كونه المرشَّح الذي حدَّده بحث سابق في هذه الجلسة (راجع التعليق التاريخي
 * في providers/server-provider.ts) — يتعارض مع قيد صريح سابق في نفس
 * الجلسة: "لا استخدام API/نموذج/بيانات أي منافس" (ترتيل منافس مباشر).
 * whisper-large-v3 نموذج عام لا علاقة له بأي منافس، ويعمل بدقة معقولة هنا
 * تحديدًا لأن المطابقة تُجرى ضد نص متوقَّع معروف مسبقًا (محاذاة نافذة
 * منزلقة في VerseAlignmentEngine) لا تفريغًا حرًّا عامًا.
 *
 * لا صوت يُخزَّن على خوادمنا: يُستقبَل، يُمرَّر لـGroq، وتُترَك النتيجة
 * فقط — لا كتابة لأي ملف أو صف قاعدة بيانات في هذا المسار إطلاقًا.
 *
 * GET: فحص تهيئة رخيص (بلا أي استدعاء شبكي خارجي) — يستخدمه
 * ServerQuranASRProvider.isAvailable() ليقرر بصدق هل يختار هذا المزوّد
 * أصلًا قبل محاولة أي جلسة (تجنّبًا لاختيار مزوّد سيفشل حتمًا).
 * POST: يستقبل مقطعًا صوتيًا قصيرًا (base64) ويُعيد النص المفرَّغ.
 */
import { sendJson } from "../api/_http.mjs";

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const GROQ_MODEL = "whisper-large-v3";
const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // ~8MB — مقطع قصير (2-4 ثوانٍ) لا يقترب من هذا الحد إطلاقًا؛ سقف أمان فقط

// تطبيق iOS/Android الأصلي (Capacitor) يُحمِّل الواجهة من ملفات مُجمَّعة
// محليًا لا من موقعنا (لا server.url مضبوط في capacitor.config.ts) —
// أصلها ليس https://www.majlisilm.com بل هذه المخططات المحلية، فطلب
// server-provider.ts (الذي يبني رابطًا مطلقًا للدومين الحقيقي حين يعمل
// أصليًا) يُعامَل كطلب عابر للأصول (CORS) يحتاج إذنًا صريحًا هنا — بلا
// هذا، تفشل الميزة صامتًا في التطبيق الأصلي فقط رغم عملها في متصفح الويب.
// هذه النقطة بلا جلسة/كوكيز (بروكسي عديم الحالة لـGroq)، فالسماح بهذه
// الأصول المحدودة (لا "*") آمن.
const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost", // iOS
  "https://localhost", // Android (androidScheme: "https")
  "http://localhost", // احتياط بيئة تطوير محلية للتطبيق الأصلي
]);

function applyCors(req, res) {
  const origin = String(req.headers?.origin || "");
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getApiKey() {
  return String(process.env.GROQ_API_KEY || "").trim();
}

async function parseJsonBody(req) {
  let raw = req.body;
  if (raw === undefined) {
    raw = "";
    for await (const chunk of req) raw += chunk;
  }
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  if (req.method === "GET" || req.method === "HEAD") {
    sendJson(res, 200, { configured: getApiKey().length > 0 });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "الطريقة غير مدعومة." });
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    sendJson(res, 503, { error: "مزوّد التعرّف الصوتي الخادمي غير مُهيَّأ (GROQ_API_KEY مفقود)." });
    return;
  }

  const body = await parseJsonBody(req);
  if (!body || typeof body.audioBase64 !== "string" || !body.audioBase64) {
    sendJson(res, 400, { error: "صيغة الطلب غير صالحة — audioBase64 مطلوب." });
    return;
  }

  let audioBuffer;
  try {
    audioBuffer = Buffer.from(body.audioBase64, "base64");
  } catch {
    sendJson(res, 400, { error: "تعذّر فك ترميز الصوت." });
    return;
  }
  if (audioBuffer.length === 0 || audioBuffer.length > MAX_AUDIO_BYTES) {
    sendJson(res, 400, { error: "حجم المقطع الصوتي غير صالح." });
    return;
  }

  const mimeType = typeof body.mimeType === "string" && body.mimeType ? body.mimeType : "audio/webm";

  try {
    const form = new FormData();
    form.append("file", new Blob([audioBuffer], { type: mimeType }), "chunk.webm");
    form.append("model", GROQ_MODEL);
    form.append("language", "ar");
    form.append("response_format", "json");
    // بلا prompt نصي بالنص القرآني — لا نطلب من النموذج "تخمين" نص قرآني
    // بذاته؛ هو يُفرِّغ ما سُمع حرفيًا فقط، والمطابقة مع النص المعتمد تتم
    // بالكامل لاحقًا داخل VerseAlignmentEngine على جهاز المستخدم.

    const groqRes = await fetch(GROQ_TRANSCRIBE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(15_000),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => "");
      console.error("recitation-transcribe: Groq API error", groqRes.status, errText.slice(0, 500));
      sendJson(res, 502, { error: "تعذّر التعرّف الصوتي حاليًا. حاول مجددًا." });
      return;
    }

    const data = await groqRes.json();
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    sendJson(res, 200, { text });
  } catch (err) {
    console.error("recitation-transcribe: فشل الاستدعاء", err);
    sendJson(res, 502, { error: "تعذّر الاتصال بمحرك التعرّف الصوتي." });
  }
}
