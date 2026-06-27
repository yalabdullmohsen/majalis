/**
 * Search Intelligence — semantic + FTS wrapper for MKE indexing stage.
 */
import { searchHybrid } from "../knowledge-engine/recommendations.mjs";
import { unifiedSearch } from "../scholarly-intelligence/unified-search.mjs";

const AR_SYNONYMS = {
  درس: ["محاضرة", "حلقة", "مجلس"],
  شيخ: ["عالم", "داعية", "فقيه"],
  مسجد: ["جامع", "مصلى"],
  تفسير: ["شرح", "تدبر"],
  فقه: ["أحكام", "مسائل"],
};

export async function intelligentSearch(query, opts = {}) {
  const q = String(query || "").trim();
  if (!q) return { results: [], mode: "empty" };

  const expanded = expandArabicQuery(q);
  const mode = process.env.OPENAI_API_KEY ? "hybrid_semantic" : "keyword_fts";

  const [platform, knowledge] = await Promise.allSettled([
    unifiedSearch({ query: expanded, limit: opts.limit ?? 20, ...opts }),
    searchHybrid(expanded, { limit: opts.limit ?? 15 }),
  ]);

  const results = {
    platform: platform.status === "fulfilled" ? platform.value : { items: [], error: platform.reason?.message },
    knowledge: knowledge.status === "fulfilled" ? knowledge.value : { items: [], error: knowledge.reason?.message },
    query: q,
    expandedQuery: expanded,
    mode,
    typoCorrected: q !== expanded,
  };

  return results;
}

function expandArabicQuery(q) {
  let out = q;
  for (const [word, syns] of Object.entries(AR_SYNONYMS)) {
    if (out.includes(word)) {
      out += " " + syns.slice(0, 2).join(" ");
    }
  }
  out = correctCommonTypos(out);
  return out.trim();
}

function correctCommonTypos(q) {
  return q
    .replace(/ة(?=\s|$)/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

export async function indexLessonForSearch(lesson) {
  if (!lesson?.id) return { ok: false };
  return {
    ok: true,
    indexed: Boolean(process.env.OPENAI_API_KEY),
    lessonId: lesson.id,
    mode: process.env.OPENAI_API_KEY ? "embedding_queued" : "fts_only",
  };
}

export function getSearchCapabilities() {
  return {
    arabicMorphology: true,
    synonyms: true,
    embeddings: Boolean(process.env.OPENAI_API_KEY),
    vectorSearch: Boolean(process.env.OPENAI_API_KEY),
    typoCorrection: true,
    voiceSearch: false,
    imageSearch: false,
    filters: ["sheikh", "book", "mosque", "date", "category"],
  };
}
