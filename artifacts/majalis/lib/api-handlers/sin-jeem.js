import { sendJson } from "../api/_http.mjs";
import { getEnvConfig } from "../../env-config.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";

const USED_HASHES = new Set();

function hashText(t) {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return String(h);
}

async function fetchSourceContent(source) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  if (source === "fawaid") {
    const { data } = await admin.from("fawaid").select("text,author_name").eq("status", "approved").limit(20);
    return (data || []).map((r) => r.text).filter(Boolean);
  }
  if (source === "lessons") {
    const { data } = await admin.from("lessons").select("title,description").limit(20);
    return (data || []).map((r) => `${r.title}: ${r.description || ""}`.trim());
  }
  if (source === "qa") {
    const { data } = await admin.from("qa_questions").select("question,answer").limit(20);
    return (data || []).map((r) => `س: ${r.question} ج: ${r.answer}`);
  }
  return [];
}

async function generateFromOpenAI(content, difficulty) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) return null;

  const prompt = `أنشئ سؤالاً islamic MCQ بالعربية من المحتوى التالي. أعد JSON فقط:
{"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"...","difficulty":"${difficulty}","keywords":["..."]}
المحتوى: ${content.slice(0, 800)}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

async function generateOffline(content, difficulty) {
  const snippet = content.slice(0, 120);
  const h = hashText(snippet);
  if (USED_HASHES.has(h)) return null;
  USED_HASHES.add(h);

  const admin = getSupabaseAdmin();
  const existing = new Set();
  if (admin) {
    const { data } = await admin.from("sin_jeem_questions").select("question").limit(500);
    for (const row of data || []) existing.add(row.question);
  }

  const question = `ما المقصود بالعبارة التالية؟ «${snippet.slice(0, 60)}...»`;
  if (existing.has(question)) return null;

  return {
    question,
    options: [snippet.slice(0, 40), "لا علاقة", "تفسير خاطئ", "غير ذلك"],
    correct_index: 0,
    explanation: `مستخرج من: ${snippet.slice(0, 80)}`,
    difficulty,
    keywords: ["auto", "offline"],
    question_type: "multiple_choice",
  };
}

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "health";

  if (action === "health") {
    sendJson(res, 200, { ok: true, service: "sin-jeem" });
    return;
  }

  if (action === "generate") {
    const source = req.body?.source || "fawaid";
    const difficulty = req.body?.difficulty || "متوسط";
    const contents = await fetchSourceContent(source);
    const pick = contents[Math.floor(Math.random() * contents.length)] || "الصلاة ركن من أركان الإسلام";

    let question = await generateFromOpenAI(pick, difficulty);
    if (!question) question = await generateOffline(pick, difficulty);

    if (!question) {
      sendJson(res, 503, { ok: false, error: "duplicate_or_no_content" });
      return;
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("sin_jeem_ai_generations").insert({
          source_type: source,
          prompt_hash: hashText(pick),
          status: "pending",
          raw_response: question,
        });
      } catch {
        /* table may not exist yet */
      }
    }

    sendJson(res, 200, { ok: true, question });
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}
