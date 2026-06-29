import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { buildAutocompleteSuggestions } from "../../lib/scholarly-intelligence/corpus-search.mjs";
import { matchTopicsToQuery, getAllTopics } from "../../lib/scholarly-intelligence/topics.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const query = String(req.query?.q || req.query?.query || "").trim();
  const limit = Math.min(Number(req.query?.limit || 12), 20);

  if (query.length < 2) {
    const topics = getAllTopics()
      .slice(0, 8)
      .map((t) => ({ id: t.slug, label: t.title, meta: "موضوع", kind: "topic", href: `/topics/${t.slug}` }));
    sendJson(res, 200, { ok: true, query, suggestions: topics, topics });
    return;
  }

  try {
    const admin = getSupabaseAdmin();
    const [suggestions, matchedTopics] = await Promise.all([
      buildAutocompleteSuggestions(admin, query, limit),
      Promise.resolve(matchTopicsToQuery(query)),
    ]);

    const topicSuggestions = matchedTopics.slice(0, 4).map((t) => ({
      id: t.slug,
      label: t.title,
      meta: "موضوع علمي",
      kind: "topic",
      href: `/topics/${t.slug}`,
    }));

    const merged = [...topicSuggestions, ...suggestions].slice(0, limit);

    sendJson(res, 200, {
      ok: true,
      query,
      suggestions: merged,
      topics: matchedTopics.map((t) => ({ slug: t.slug, title: t.title })),
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message, suggestions: [] });
  }
}
