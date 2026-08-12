/**
 * AI assistance for reference system — metadata only, no religious text generation.
 */

export const AI_CONSTRAINTS = {
  generatesReligiousText: false,
  generatesFatwa: false,
  generatesHadith: false,
  generatesAyah: false,
  allowedOperations: [
    "detect_stale_content",
    "suggest_relations",
    "detect_conflicts",
    "improve_classification",
    "improve_keywords",
    "generate_summary",
    "generate_review_questions",
    "generate_flashcards",
  ],
};

export async function aiAnalyzeReference(item) {
  const text = [item.title, item.summary, item.description].filter(Boolean).join(" ");
  const keywords = item.ai_keywords || item.keywords || [];

  const suggestions = {
    stale: false,
    suggested_relations: [],
    classification_improvement: null,
    keyword_suggestions: [],
    summary: null,
    review_questions: [],
    flashcards: [],
    conflicts: [],
    disclaimer: "AI metadata only — no religious text generated or attributed without source.",
  };

  if (!text) {
    suggestions.classification_improvement = "Add title and summary";
    return suggestions;
  }

  const updated = item.updated_at || item.created_at;
  if (updated) {
    const ageDays = (Date.now() - new Date(updated).getTime()) / (1000 * 60 * 60 * 24);
    suggestions.stale = ageDays > 365;
  }

  suggestions.keyword_suggestions = keywords.length < 3
    ? ["فقه", "علم", "شرع"].filter((k) => !keywords.includes(k)).slice(0, 3)
    : [];

  suggestions.review_questions = [
    { question: `ما موضوع "${item.title || "هذا المحتوى"}"؟`, type: "text" },
    { question: "هل المصدر موثق؟", type: "true_false", answer: Boolean(item.source_name) },
  ];

  suggestions.flashcards = [
    { front: item.title || "المحتوى", back: item.summary || item.source_name || "راجع المصدر" },
  ];

  if (process.env.OPENAI_API_KEY && item.title) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Analyze Islamic scholarly content metadata. Return JSON: {summary, keyword_suggestions[], classification}. Do NOT generate hadith, ayah, fatwa, or attribute quotes.",
            },
            { role: "user", content: `Title: ${item.title}\nSource: ${item.source_name || "unknown"}` },
          ],
          response_format: { type: "json_object" },
          max_tokens: 300,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}");
        if (parsed.summary) suggestions.summary = parsed.summary;
        if (parsed.keyword_suggestions?.length) suggestions.keyword_suggestions = parsed.keyword_suggestions;
        if (parsed.classification) suggestions.classification_improvement = parsed.classification;
      }
    } catch {
      /* template fallback */
    }
  }

  return suggestions;
}

export async function aiSuggestRelations(fromItem, candidates) {
  const fromText = [fromItem.title, fromItem.summary].filter(Boolean).join(" ").toLowerCase();
  const suggestions = [];

  for (const candidate of candidates.slice(0, 20)) {
    const candText = [candidate.title, candidate.summary].filter(Boolean).join(" ").toLowerCase();
    const overlap = fromText.split(/\s+/).filter((w) => w.length > 2 && candText.includes(w));
    if (overlap.length >= 2) {
      suggestions.push({
        to_ref_id: candidate.ref_id,
        relation_type: "related",
        score: Math.min(overlap.length / 5, 1),
        reason: `Shared terms: ${overlap.slice(0, 3).join(", ")}`,
      });
    }
  }

  return suggestions.slice(0, 8);
}
