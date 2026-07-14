function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function truncate(value, max = 500) {
  const text = String(value ?? '');
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

const SYSTEM_PROMPT = `You are an Islamic content metadata assistant for Al-Majlis Al-Ilmi (المجلس العلمي).
Analyze the provided content and return ONLY valid JSON with keys:
summary (string, max 200 chars),
keywords (string array, max 10),
category_suggestion (string),
tags (string array),
seo_description (string, max 160 chars),
related_topics (string array),
quality_notes (string array — organizational suggestions only).

STRICT RULES:
- Do NOT rewrite, paraphrase, or change any religious text (Quran, Hadith, fatwa rulings).
- Do NOT invent fatwas, rulings, or attributions.
- Only organize, summarize metadata, and suggest links/topics based on what is present.
- If unsure, use null or empty arrays.`;

export async function suggestMetadataWithAi(item, context = {}) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, reason: 'missing_ai_api_key' };
  }

  const model = process.env.SCHOLARLY_AI_MODEL ?? 'gpt-4o-mini';
  const text = truncate(
    [item.title, item.content ?? item.text, item.description, item.question, item.answer]
      .filter(Boolean)
      .join('\n'),
    3500,
  );

  if (!text.trim()) return { ok: false, skipped: true, reason: 'empty_content' };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Content type: ${context.content_type ?? 'unknown'}\nSource: ${item.source_name ?? 'n/a'}\n\n${text}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return { ok: false, error: `ai_http_${response.status}` };

    const payload = await response.json();
    const parsed = safeJsonParse(payload.choices?.[0]?.message?.content ?? '{}', {});

    return {
      ok: true,
      suggestions: {
        summary: parsed.summary ?? null,
        keywords: parsed.keywords ?? [],
        category_suggestion: parsed.category_suggestion ?? null,
        tags: parsed.tags ?? [],
        seo_description: parsed.seo_description ?? null,
        related_topics: parsed.related_topics ?? [],
        quality_notes: parsed.quality_notes ?? [],
      },
      ai_used: true,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'ai_failed' };
  }
}

export function detectConflicts(item, existingItems = []) {
  const conflicts = [];
  const title = String(item.title ?? item.text ?? '').trim().toLowerCase();
  for (const other of existingItems) {
    const otherTitle = String(other.title ?? other.text ?? '').trim().toLowerCase();
    if (title && otherTitle && title === otherTitle && other.id !== item.id) {
      conflicts.push({ type: 'duplicate_title', other_id: other.id });
    }
  }
  return conflicts;
}
