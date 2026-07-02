/**
 * توليد الإجابة — Claude API مع Context محدود بالمصادر فقط
 *
 * قاعدة صارمة: النموذج يُجيب فقط من [السياق المقدم]، لا من معرفته العامة.
 */

import { RAG_MODEL, RAG_SYSTEM_PROMPT, MAX_EXCERPT_LEN, NO_SOURCES_MSG } from "./constants.mjs";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/** بناء نص السياق المُمرَّر للنموذج */
function buildContext(docs) {
  return docs
    .slice(0, 12)
    .map((doc, i) => {
      const grade =
        doc.content_type === "hadith" && doc.metadata?.grade
          ? ` (درجة: ${doc.metadata.grade})`
          : "";
      const body = String(doc.excerpt || "").slice(0, MAX_EXCERPT_LEN);
      return (
        `[${i + 1}] النوع: ${doc.content_type}${grade}\n` +
        `العنوان: ${doc.title}\n` +
        `المصدر: ${doc.source_ref}\n` +
        `المقتطف: ${body}\n` +
        (doc.source_url ? `الرابط: ${doc.source_url}` : "")
      );
    })
    .join("\n\n---\n\n");
}

/** رسالة المستخدم مع السياق */
function buildUserMessage(query, context) {
  return (
    `[السياق المقدم — لا تُجب إلا منه]\n\n${context}\n\n` +
    `[السؤال]\n${query}`
  );
}

/**
 * توليد إجابة RAG عبر Claude API
 *
 * @param {string} query - سؤال المستخدم
 * @param {Array}  docs  - وثائق مُرتَّبة من ranking
 * @returns {{ answer: string, usedSources: number, model: string }}
 */
export async function generateAnswer(query, docs) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return {
      answer:      buildFallbackAnswer(query, docs),
      usedSources: docs.length,
      model:       "fallback",
    };
  }

  if (!docs.length) {
    return {
      answer:      NO_SOURCES_MSG,
      usedSources: 0,
      model:       "no_sources",
    };
  }

  const context = buildContext(docs);
  const userMessage = buildUserMessage(query, context);

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method:  "POST",
      headers: {
        "content-type":     "application/json",
        "x-api-key":        apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model:      RAG_MODEL,
        max_tokens: 1500,
        system:     RAG_SYSTEM_PROMPT,
        messages:   [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(20000), // 20 ثانية حد أقصى
    });

    if (!res.ok) {
      console.error("[rag/generation] Anthropic error:", res.status);
      return {
        answer:      buildFallbackAnswer(query, docs),
        usedSources: docs.length,
        model:       "fallback",
      };
    }

    const data = await res.json();
    const answer = data.content?.[0]?.text || NO_SOURCES_MSG;

    return { answer, usedSources: docs.length, model: RAG_MODEL };
  } catch (err) {
    console.error("[rag/generation] fetch error:", err.message);
    return {
      answer:      buildFallbackAnswer(query, docs),
      usedSources: docs.length,
      model:       "fallback",
    };
  }
}

/**
 * إجابة احتياطية بدون LLM — تعرض المصادر مباشرة
 */
function buildFallbackAnswer(query, docs) {
  if (!docs.length) return NO_SOURCES_MSG;
  const intro = `وفق المواد الموثّقة في قاعدة المجلس العلمي، إليك ما يرتبط بسؤالك «${query}»:\n\n`;
  const bullets = docs.slice(0, 6).map((d, i) => {
    const ref = d.source_ref ? ` — ${d.source_ref}` : "";
    return `${i + 1}. **${d.title}**${ref}\n   ${String(d.excerpt || "").slice(0, 180)}${d.excerpt?.length > 180 ? "…" : ""}`;
  });
  return intro + bullets.join("\n\n") + "\n\n⚠️ هذا ملخص بحثي وليس فتوى شخصية.";
}
