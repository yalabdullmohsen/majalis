import { getEnvConfig } from "../env-config.mjs";

export async function enrichResearchPaper(paper) {
  const { openaiKey } = getEnvConfig();
  if (!openaiKey) {
    return {
      ok: true,
      skipped: true,
      ai_summary_short: paper.abstract_full?.slice(0, 200) || "",
      ai_summary_medium: paper.abstract_full?.slice(0, 500) || "",
      ai_keywords: paper.keywords || [],
      ai_category: paper.category_slug,
      ai_topics: [],
    };
  }

  const prompt = `أنت خبير في التصنيف الأكاديمي الشرعي. حلل هذا البحث وأعد JSON فقط:
{"summary_short":"...","summary_medium":"...","keywords":["..."],"category":"...","topics":["..."]}

العنوان: ${paper.title}
الملخص: ${paper.abstract_full || paper.abstract_short || ""}
التخصص: ${paper.specialization || ""}`;

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
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return fallbackEnrich(paper);
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return {
      ok: true,
      ai_summary_short: parsed.summary_short || "",
      ai_summary_medium: parsed.summary_medium || "",
      ai_keywords: parsed.keywords || paper.keywords || [],
      ai_category: parsed.category || paper.category_slug,
      ai_topics: parsed.topics || [],
    };
  } catch {
    return fallbackEnrich(paper);
  }
}

function fallbackEnrich(paper) {
  return {
    ok: true,
    fallback: true,
    ai_summary_short: (paper.abstract_full || "").slice(0, 200),
    ai_summary_medium: (paper.abstract_full || "").slice(0, 500),
    ai_keywords: paper.keywords || [],
    ai_category: paper.category_slug,
    ai_topics: [],
  };
}

export function findSimilarPapers(candidate, corpus, limit = 5) {
  const words = new Set(String(candidate.title || "").split(/\s+/).filter((w) => w.length > 2));
  return corpus
    .filter((p) => p.id !== candidate.id)
    .map((p) => {
      const pw = new Set(String(p.title || "").split(/\s+/).filter((w) => w.length > 2));
      let inter = 0;
      for (const w of words) if (pw.has(w)) inter++;
      return { paper: p, score: inter / Math.max(words.size, pw.size, 1) };
    })
    .filter((x) => x.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.paper);
}
