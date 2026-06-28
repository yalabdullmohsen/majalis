/**
 * AKP v3 — Semantic Search Index.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { generateEmbedding } from "../../knowledge-engine/indexer.mjs";
import { searchKnowledgeAll } from "../../scholarly-intelligence/semantic-search.mjs";
import { normalizeArabicText } from "./quality-engine.mjs";

const SEMANTIC_SYNONYMS = {
  "فضل الصدقة": ["الزكاة", "الإنفاق", "البر", "الإحسان", "التصدق"],
  صدقة: ["زكاة", "إنفاق", "بر"],
  صبر: ["احتساب", "ثبات", "مصيبة"],
};

export async function indexContentRecord({ contentType, contentId, title, body, keywords = [], language = "ar", trustScore = 80 }) {
  const admin = getSupabaseAdmin();
  const excerpt = normalizeArabicText(String(body || "").slice(0, 500));
  const row = {
    content_type: contentType,
    content_id: String(contentId),
    title: title || null,
    body_excerpt: excerpt,
    keywords: Array.isArray(keywords) ? keywords : [],
    language,
    trust_score: trustScore,
    indexed_at: new Date().toISOString(),
  };

  const embedding = await generateEmbedding(`${title || ""} ${excerpt}`.trim());
  if (embedding) row.embedding = embedding;

  if (!admin) return { ok: true, local: true, row };

  const { error } = await admin.from("akp_semantic_index").upsert(row, { onConflict: "content_type,content_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true, indexed: true };
}

export async function semanticSearch(query, { limit = 20, contentType = null } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, results: [] };

  const expanded = expandQuery(query);
  const results = await searchKnowledgeAll(admin, expanded, limit);

  let filtered = results;
  if (contentType) {
    filtered = results.filter((r) => r.content_kind === contentType || r.content_type === contentType);
  }

  if (filtered.length < limit / 2) {
    const { data } = await admin
      .from("akp_semantic_index")
      .select("content_type, content_id, title, body_excerpt, keywords, trust_score")
      .or(`title.ilike.%${query.slice(0, 40)}%,body_excerpt.ilike.%${query.slice(0, 40)}%`)
      .limit(limit);
    for (const row of data || []) {
      filtered.push({
        id: row.content_id,
        title: row.title,
        summary: row.body_excerpt,
        content_kind: row.content_type,
        source: "akp_index",
        rank: row.trust_score / 10,
      });
    }
  }

  return { ok: true, query, expanded, results: dedupeResults(filtered).slice(0, limit) };
}

function expandQuery(query) {
  const q = String(query || "").trim();
  for (const [key, syns] of Object.entries(SEMANTIC_SYNONYMS)) {
    if (q.includes(key) || syns.some((s) => q.includes(s))) {
      return `${q} ${syns.join(" ")}`;
    }
  }
  return q;
}

function dedupeResults(items) {
  const seen = new Set();
  return items.filter((i) => {
    const k = i.id || i.title;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function reindexRecentContent({ limit = 100 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const tables = [
    { type: "benefits", table: "fawaid", title: "text", body: "text" },
    { type: "questions", table: "qa_questions", title: "question", body: "answer" },
  ];

  let indexed = 0;
  for (const t of tables) {
    const { data } = await admin.from(t.table).select("*").order("created_at", { ascending: false }).limit(limit);
    for (const row of data || []) {
      const r = await indexContentRecord({
        contentType: t.type,
        contentId: row.id,
        title: row[t.title],
        body: row[t.body],
      });
      if (r.ok) indexed += 1;
    }
  }
  return { ok: true, indexed };
}
