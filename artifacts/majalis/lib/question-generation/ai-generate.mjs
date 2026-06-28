import { getEnvConfig } from "../env-config.mjs";
import { TRUSTED_SOURCES } from "./config.mjs";

const GENERATION_SCHEMA = `{
  "question": "نص السؤال بالعربية",
  "options": ["خيار1","خيار2","خيار3","خيار4"],
  "correct_index": 0,
  "correct_answer": "الإجابة الصحيحة",
  "explanation": "شرح موجز مع الدليل",
  "category": "slug",
  "difficulty": "سهل|متوسط|متقدم",
  "source_type": "quran|hadith|scholar|book",
  "source_reference": "مرجع محدد (سورة:آية أو رقم حديث)",
  "tags": ["وسم1","وسم2"]
}`;

export async function generateCandidate({ category_slug, category_name_ar, difficulty }) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) {
    return { ok: false, error: "OPENAI_API_KEY not configured" };
  }

  const sources = TRUSTED_SOURCES.join("، ");
  const prompt = `أنت خبير في العلوم الشرعية. أنشئ سؤالاً واحداً (اختيار من متعدد) بالعربية الفصحى.

الفئة: ${category_name_ar} (${category_slug})
المستوى: ${difficulty}

قواعد صارمة:
- استند فقط إلى: ${sources}
- لا فتاوى خلافية ولا آراء ضعيفة ولا اجتهادات مشكوك فيها
- السؤال واضح بإجابة واحدة صحيحة
- 4 خيارات متقاربة معقولة
- source_reference إلزامي ودقيق
- لا placeholder ولا test

أعد JSON فقط بهذا الشكل:
${GENERATION_SCHEMA}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.45,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `openai_${res.status}` };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(text);
    parsed.category_slug = category_slug;
    parsed.difficulty = difficulty;
    return { ok: true, candidate: parsed };
  } catch (err) {
    return { ok: false, error: err.message || "generation_failed" };
  }
}

export async function verifyCandidate(candidate) {
  const { openaiKey, anthropicKey } = getEnvConfig();
  const key = anthropicKey || openaiKey;
  if (!key) {
    return { ok: false, confidence: 0, error: "no_ai_key_for_verification" };
  }

  const verifyPrompt = `تحقق من هذا السؤال الإسلامي. أعد JSON فقط:
{"correct":true|false,"confidence":0.0-1.0,"issues":["..."],"reference_valid":true|false,"language_quality":0.0-1.0}

معايير: صحة السؤال والجواب، صحة المرجع، جودة العربية، عدم الغموض، مصدر موثوق (قرآن/حديث صحيح/أهل سنة).

السؤال:
${JSON.stringify(candidate, null, 0)}`;

  try {
    if (anthropicKey) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 512,
          messages: [{ role: "user", content: verifyPrompt }],
        }),
      });
      if (!res.ok) return fallbackOpenAIVerify(openaiKey, verifyPrompt);
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return { ok: false, confidence: 0, error: "verify_parse_failed" };
      const result = JSON.parse(match[0]);
      const confidence = Number(result.confidence) || 0;
      return {
        ok: result.correct !== false && confidence >= 0.95,
        confidence,
        reference_valid: result.reference_valid !== false,
        issues: result.issues || [],
        provider: "anthropic",
      };
    }
    return fallbackOpenAIVerify(openaiKey, verifyPrompt);
  } catch (err) {
    return { ok: false, confidence: 0, error: err.message };
  }
}

async function fallbackOpenAIVerify(openaiKey, prompt) {
  if (!openaiKey) return { ok: false, confidence: 0, error: "no_verifier" };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return { ok: false, confidence: 0, error: "verify_openai_failed" };
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  const result = JSON.parse(text);
  const confidence = Number(result.confidence) || 0;
  return {
    ok: result.correct !== false && confidence >= 0.95,
    confidence,
    reference_valid: result.reference_valid !== false,
    issues: result.issues || [],
    provider: "openai",
  };
}
