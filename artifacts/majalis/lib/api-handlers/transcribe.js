import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `أنت مساعد علمي إسلامي متخصص في تحليل المحاضرات والدروس الشرعية.
مهمتك:
1. تلخيص المحتوى بأسلوب علمي موثوق
2. استخراج الفوائد العلمية الرئيسية
3. لا تُفتِ ولا تنسب أقوالاً لم تُذكر صراحةً
أجب دائماً بـ JSON فقط بدون أي نص إضافي`;

function setJsonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getEnv(name, fallback = "") {
  return (process.env[name] || fallback).trim();
}

function getSupabaseConfig() {
  const url = getEnv("VITE_SUPABASE_URL", getEnv("SUPABASE_URL"));
  const anonKey = getEnv("VITE_SUPABASE_ANON_KEY", getEnv("SUPABASE_ANON_KEY"));
  if (!url.startsWith("http") || !anonKey) {
    throw createHttpError(500, "إعدادات Supabase غير مكتملة على الخادم.");
  }
  return { url, anonKey };
}

function getAnthropicApiKey() {
  const apiKey = getEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw createHttpError(503, "خدمة التحليل غير متاحة حالياً.");
  }
  return apiKey;
}

function getBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function parseBody(req) {
  let rawBody = req.body;
  if (rawBody === undefined) {
    rawBody = "";
    for await (const chunk of req) {
      rawBody += chunk;
    }
  }
  if (!rawBody) return {};
  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch {
      throw createHttpError(400, "صيغة الطلب غير صالحة.");
    }
  }
  return rawBody;
}

function extractAnthropicText(data) {
  return (data?.content || [])
    .filter((block) => block?.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export default async function handler(req, res) {
  try {
    setJsonHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "الطريقة غير مدعومة." });
      return;
    }

    const accessToken = getBearerToken(req);
    if (!accessToken) {
      res.status(401).json({ error: "غير مصرح" });
      return;
    }

    const { url, anonKey } = getSupabaseConfig();
    const supabase = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    const user = userData?.user;
    if (userError || !user) {
      res.status(401).json({ error: "غير مصرح" });
      return;
    }

    const body = await parseBody(req);
    const { transcript_text, transcription_id } = body;

    if (!transcript_text || !transcription_id) {
      res.status(400).json({ error: "بيانات ناقصة" });
      return;
    }

    const trimmedText = String(transcript_text).trim();
    if (trimmedText.length < 40) {
      res.status(400).json({ error: "النص المُفرَّغ قصير جداً للتحليل." });
      return;
    }

    const anthropic = new Anthropic({
      apiKey: getAnthropicApiKey(),
      maxRetries: 0,
      defaultHeaders: { "anthropic-version": ANTHROPIC_VERSION },
    });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `حلّل هذا النص المُفرَّغ من محاضرة إسلامية وأعد JSON بالشكل التالي:
{
  "summary": "ملخص شامل للمحاضرة في 3-5 فقرات",
  "benefits": [
    {
      "benefit": "نص الفائدة",
      "timestamp": "00:05:30",
      "category": "عقيدة|فقه|حديث|تفسير|سيرة|عام"
    }
  ],
  "main_topics": ["موضوع 1", "موضوع 2"],
  "speaker_info": "ما استُنتج عن الشيخ إن وُجد",
  "key_quotes": ["اقتباس مهم 1", "اقتباس مهم 2"]
}

النص:
${trimmedText.substring(0, 8000)}`,
        },
      ],
    });

    const rawText = extractAnthropicText(response);
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    let analysis;
    try {
      analysis = JSON.parse(cleanJson);
    } catch {
      throw createHttpError(502, "تعذر تحليل رد Claude. حاول مجدداً.");
    }

    const { error } = await supabase
      .from("transcriptions")
      .update({
        transcript_text: trimmedText.substring(0, 50000),
        summary: analysis.summary || "",
        benefits: analysis.benefits || [],
        status: "done",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcription_id)
      .eq("user_id", user.id);

    if (error) throw error;

    res.status(200).json({ success: true, analysis });
  } catch (err) {
    console.error("Transcription API error:", err);
    const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
    const publicStatus = status >= 500 ? 500 : status;
    res.status(publicStatus).json({
      error: publicStatus >= 500 ? "تعذر إكمال التحليل. حاول لاحقًا." : "تعذر معالجة الطلب.",
    });
  }
}
