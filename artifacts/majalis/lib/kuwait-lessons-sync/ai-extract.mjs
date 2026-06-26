import { safeJsonParse, truncate } from './utils.mjs';

const SYSTEM_PROMPT = `You extract structured Islamic lesson/event data from unstructured Arabic text.
Return ONLY valid JSON with keys: title, sheikh, date (YYYY-MM-DD or null), day (Arabic weekday or null), time, location, city, description, category.
Use null for unknown fields. Do not invent data not present in the source.`;

export async function extractWithAi(rawText, context = {}) {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;
  if (!apiKey) {
    return { ok: false, skipped: true, reason: 'missing_ai_api_key' };
  }

  const model = process.env.LESSON_SYNC_AI_MODEL ?? 'gpt-4o-mini';
  const input = truncate(rawText, 4000);

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
            content: `Source: ${context.source_name ?? 'unknown'}\nURL: ${context.source_url ?? 'n/a'}\n\nText:\n${input}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return { ok: false, error: `ai_http_${response.status}` };
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content ?? '{}';
    const parsed = safeJsonParse(content, {});

    return { ok: true, data: parsed };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'ai_extract_failed',
    };
  }
}

export async function enrichDraftWithAi(draft) {
  const needsAi =
    !draft.title ||
    !draft.sheikh ||
    (!draft.date && !draft.day) ||
    !draft.location ||
    (draft.description && draft.description.length > 20 && draft.time === '—');

  if (!needsAi) {
    return { draft, ai_used: false };
  }

  const textParts = [draft.title, draft.description, draft.raw_payload?.description]
    .filter(Boolean)
    .join('\n');

  if (!textParts.trim()) {
    return { draft, ai_used: false };
  }

  const result = await extractWithAi(textParts, {
    source_name: draft.source_name,
    source_url: draft.source_url,
  });

  if (!result.ok) {
    return { draft, ai_used: false, ai_error: result.error ?? result.reason };
  }

  const merged = {
    ...draft,
    title: draft.title || result.data.title || draft.title,
    sheikh: draft.sheikh || result.data.sheikh || draft.sheikh,
    date: draft.date || result.data.date || draft.date,
    day: draft.day || result.data.day || draft.day,
    time: draft.time && draft.time !== '—' ? draft.time : result.data.time || draft.time,
    location: draft.location || result.data.location || draft.location,
    city: draft.city || result.data.city || draft.city,
    description: draft.description || result.data.description || draft.description,
    category: draft.category || result.data.category || draft.category,
  };

  return { draft: merged, ai_used: true };
}
