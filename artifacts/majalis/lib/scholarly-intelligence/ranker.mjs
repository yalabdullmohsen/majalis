/**
 * Unified ranking — relevance, quality, trust, recency, verification.
 */

import { scoreTextMatch } from "./query-processor.mjs";

const KIND_BOOST = {
  quran: 8,
  hadith: 7,
  fatwa: 6,
  fatwas: 6,
  fiqh_decision: 6,
  fiqh_council: 6,
  lesson: 5,
  lessons: 5,
  knowledge: 5,
  qa: 4,
  fawaid: 4,
  library: 3,
  book: 3,
  course: 3,
  courses: 3,
  miracle: 3,
  miracles: 3,
  adhkar: 2,
  update: 2,
  updates: 2,
};

function recencyBoost(dateStr) {
  if (!dateStr) return 0;
  const age = Date.now() - new Date(dateStr).getTime();
  const days = age / (1000 * 60 * 60 * 24);
  if (days <= 7) return 8;
  if (days <= 30) return 5;
  if (days <= 90) return 3;
  if (days <= 365) return 1;
  return 0;
}

export function computeRank(item, queryInfo, opts = {}) {
  let score = item.rank ?? item.score ?? item.similarity ?? 0;

  const title = item.title || item.ai_title || item.question || item.text || "";
  const body = [item.summary, item.ai_summary, item.description, item.answer, item.meta].filter(Boolean).join(" ");

  score += scoreTextMatch(title, queryInfo) * 0.6;
  score += scoreTextMatch(body, queryInfo) * 0.3;

  const kind = item.content_kind || item.kind || item.content_type;
  score += KIND_BOOST[kind] || 0;

  if (item.verification_status === "verified") score += 10;
  else if (item.verification_status === "needs_review") score -= 2;

  score += (item.trust_level ?? item.trust_score ?? 0) * 0.05;
  score += (item.quality_score ?? 0) * 0.08;
  score += recencyBoost(item.updated_at || item.published_at);

  if (opts.preferredKinds?.includes(kind)) score += 15;
  if (opts.preferredTopics?.length) {
    const topic = (item.ai_topic || item.category || "").toLowerCase();
    if (opts.preferredTopics.some((t) => topic.includes(t))) score += 12;
  }

  if (item.semantic_score) score += item.semantic_score * 20;
  if (item.source === "semantic") score += 5;

  return Math.round(score * 100) / 100;
}

export function rankResults(results, queryInfo, opts = {}) {
  const scored = results.map((item) => ({
    ...item,
    relevance_score: computeRank(item, queryInfo, opts),
  }));

  return scored.sort((a, b) => b.relevance_score - a.relevance_score);
}

export function dedupeResults(results) {
  const seen = new Set();
  const out = [];
  for (const item of results) {
    const key = `${item.kind || item.content_kind}:${item.id || item.content_id || item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function groupByKind(results) {
  const groups = {};
  for (const item of results) {
    const kind = item.kind || item.content_kind || "other";
    if (!groups[kind]) groups[kind] = [];
    groups[kind].push(item);
  }
  return groups;
}
