/**
 * Unified Scholarly Intelligence Search — orchestrates all corpora.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { searchEverything } from "../knowledge-search-bridge.mjs";
import { searchScholarlyContent } from "../scholarly-verification/orchestrator.mjs";
import { processQuery } from "./query-processor.mjs";
import { searchKnowledgeAll } from "./semantic-search.mjs";
import { enrichResult } from "./url-resolver.mjs";
import { rankResults, dedupeResults, groupByKind } from "./ranker.mjs";
import { cacheGet, cacheSet, cacheKey } from "./cache.mjs";
import { getUserPreferences } from "./recommendations.mjs";
import { trackSearchEvent } from "./analytics.mjs";
import { matchTopicsToQuery, getTopicBySlug, getAllTopics } from "./topics.mjs";

const CONTENT_TYPE_MAP = {
  lessons: "lesson",
  lesson: "lesson",
  library: "library",
  fatwas: "fatwa",
  fatwa: "fatwa",
  rulings: "ruling",
  ruling: "ruling",
  qa: "qa",
  fawaid: "fawaid",
  adhkar: "adhkar",
  miracles: "miracle",
  miracle: "miracle",
  courses: "course",
  course: "course",
  updates: "update",
  update: "update",
  fiqh_decisions: "fiqh_decision",
  sheikhs: "sheikh",
  quran: "quran",
  hadith: "hadith",
};

function flattenPlatformResults(data, perKindLimit = 15) {
  if (!data) return [];
  const results = [];

  if (Array.isArray(data)) {
    return data.map((item) => enrichResult(item));
  }

  for (const [kind, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    const mappedKind = CONTENT_TYPE_MAP[kind] || kind;
    for (const item of items.slice(0, perKindLimit)) {
      results.push(
        enrichResult({
          ...item,
          kind: mappedKind,
          content_kind: mappedKind,
          rank: item.rank || item.score || 5,
        }),
      );
    }
  }
  return results;
}

function applyFilters(results, filters) {
  let filtered = results;

  if (filters.content_type) {
    const types = Array.isArray(filters.content_type) ? filters.content_type : [filters.content_type];
    filtered = filtered.filter((r) => types.includes(r.kind) || types.includes(r.content_kind));
  }
  if (filters.author || filters.scholar) {
    const author = (filters.author || filters.scholar).toLowerCase();
    filtered = filtered.filter((r) => (r.source_name || r.scholar || "").toLowerCase().includes(author));
  }
  if (filters.verification_status) {
    filtered = filtered.filter((r) => r.verification_status === filters.verification_status);
  }
  if (filters.language) {
    filtered = filtered.filter((r) => !r.language || r.language === filters.language);
  }
  if (filters.year) {
    filtered = filtered.filter((r) => {
      const d = r.updated_at || r.published_at;
      return d && new Date(d).getFullYear() === Number(filters.year);
    });
  }
  if (filters.date_from) {
    filtered = filtered.filter((r) => {
      const d = r.updated_at || r.published_at;
      return d && new Date(d) >= new Date(filters.date_from);
    });
  }
  if (filters.date_to) {
    filtered = filtered.filter((r) => {
      const d = r.updated_at || r.published_at;
      return d && new Date(d) <= new Date(filters.date_to);
    });
  }

  return filtered;
}

export async function unifiedSearch(opts = {}) {
  const start = Date.now();
  const query = String(opts.query || "").trim();
  const limit = Math.min(Number(opts.limit || 40), 100);
  const filters = opts.filters || {};
  const userId = opts.userId || null;
  const sessionId = opts.sessionId || null;
  const skipCache = Boolean(opts.skipCache);

  if (!query) {
    return { ok: false, error: "query_required", results: [], groups: {}, topics: [] };
  }

  const ck = cacheKey("unified", { query, limit, filters, userId });
  if (!skipCache) {
    const cached = cacheGet(ck);
    if (cached) return { ...cached, cached: true, response_ms: Date.now() - start };
  }

  const queryInfo = processQuery(query);
  const admin = getSupabaseAdmin();
  const prefs = await getUserPreferences(admin, userId);
  const matchedTopics = matchTopicsToQuery(query);

  const searchPromises = [
    admin
      ? admin.rpc("search_platform", { query: queryInfo.searchString || query }).then(({ data }) => flattenPlatformResults(data))
      : Promise.resolve([]),
    admin ? searchKnowledgeAll(admin, query, limit) : Promise.resolve([]),
    searchScholarlyContent({
      query: queryInfo.searchString || query,
      content_type: filters.content_type,
      verification_status: filters.verification_status,
      author: filters.author,
      language: filters.language,
      date_from: filters.date_from,
      date_to: filters.date_to,
      limit: Math.ceil(limit / 2),
    }).then((r) =>
      (r.results || []).map((item) =>
        enrichResult({
          ...item,
          kind: item.content_type,
          content_kind: item.content_type,
          title: item.title,
          rank: 6,
        }),
      ),
    ),
    searchEverything(queryInfo.searchString || query, limit).then((items) =>
      items.map((item) => enrichResult({ ...item, rank: item.rank || 4 })),
    ),
  ];

  const [platformRpc, knowledge, scholarly, platformBridge] = await Promise.all(searchPromises);

  let allResults = dedupeResults([...platformRpc, ...knowledge, ...scholarly, ...platformBridge]);
  allResults = applyFilters(allResults, filters);
  allResults = rankResults(allResults, queryInfo, prefs);
  allResults = allResults.slice(0, limit);

  const groups = groupByKind(allResults);
  const response_ms = Date.now() - start;

  const payload = {
    ok: true,
    query,
    query_info: {
      normalized: queryInfo.normalized,
      expanded_terms: queryInfo.expandedTerms.slice(0, 8),
    },
    count: allResults.length,
    results: allResults,
    groups,
    topics: matchedTopics.map((t) => ({ slug: t.slug, title: t.title })),
    response_ms,
    cached: false,
  };

  cacheSet(ck, payload);
  void trackSearchEvent(admin, {
    event_type: "search",
    query,
    result_count: allResults.length,
    response_ms,
    zero_results: allResults.length === 0,
    topic_slugs: matchedTopics.map((t) => t.slug),
    user_id: userId,
    session_id: sessionId,
    filters,
  });

  return payload;
}

export async function getTopicContent(slug, opts = {}) {
  const topic = getTopicBySlug(slug);
  if (!topic) return { ok: false, error: "topic_not_found" };

  const limit = Math.min(Number(opts.limit || 30), 80);
  const searchTerms = [...topic.keywords, ...topic.synonyms, topic.title];
  const query = searchTerms.slice(0, 4).join(" ");

  const result = await unifiedSearch({ query, limit, skipCache: true });
  const groups = result.groups || {};

  const sections = {
    quran: groups.quran || [],
    hadith: groups.hadith || [],
    fatwa: [...(groups.fatwa || []), ...(groups.fatwas || [])],
    library: groups.library || [],
    lessons: [...(groups.lesson || []), ...(groups.lessons || [])],
    scholars: groups.sheikh || groups.sheikhs || [],
    articles: [...(groups.update || []), ...(groups.updates || []), ...(groups.article || [])],
    qa: groups.qa || [],
    fawaid: groups.fawaid || [],
    fiqh: [...(groups.fiqh_decision || []), ...(groups.fiqh_council || [])],
    courses: groups.course || groups.courses || [],
    miracles: groups.miracle || groups.miracles || [],
    knowledge: groups.knowledge || [],
  };

  const totalCount = Object.values(sections).reduce((sum, arr) => sum + arr.length, 0);

  return {
    ok: true,
    topic: {
      slug: topic.slug,
      title: topic.title,
      title_en: topic.title_en,
      category: topic.category,
      keywords: topic.keywords,
    },
    sections,
    total_count: totalCount,
    related_topics: getAllTopics()
      .filter((t) => t.slug !== slug && t.category === topic.category)
      .slice(0, 6)
      .map((t) => ({ slug: t.slug, title: t.title })),
  };
}

export async function trackResultClick(opts = {}) {
  const admin = getSupabaseAdmin();
  return trackSearchEvent(admin, {
    event_type: "click",
    query: opts.query,
    clicked_result_id: opts.resultId,
    clicked_kind: opts.kind,
    user_id: opts.userId,
    session_id: opts.sessionId,
  });
}
