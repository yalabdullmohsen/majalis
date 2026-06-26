/**
 * Search analytics — track queries, clicks, zero-results, latency.
 */

import { matchTopicsToQuery } from "./topics.mjs";

export async function trackSearchEvent(admin, event) {
  if (!admin) return { ok: false, reason: "no_admin" };

  const row = {
    event_type: event.event_type || "search",
    query: event.query ? String(event.query).slice(0, 500) : null,
    result_count: event.result_count ?? null,
    clicked_result_id: event.clicked_result_id ?? null,
    clicked_kind: event.clicked_kind ?? null,
    response_ms: event.response_ms ?? null,
    filters: event.filters ?? null,
    user_id: event.user_id ?? null,
    session_id: event.session_id ?? null,
    zero_results: event.zero_results ?? false,
    topic_slugs: event.topic_slugs ?? null,
  };

  try {
    const { error } = await admin.from("search_analytics_events").insert(row);
    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, reason: "insert_failed" };
  }
}

export async function getSearchAnalytics(admin, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const empty = {
    top_queries: [],
    top_topics: [],
    zero_result_queries: [],
    content_gaps: [],
    avg_response_ms: 0,
    click_through_rate: 0,
    total_searches: 0,
    quality_score: 0,
  };

  if (!admin) return empty;

  try {
    const { data: events } = await admin
      .from("search_analytics_events")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (!events?.length) return empty;

    const queryCounts = new Map();
    const zeroQueries = new Map();
    const topicCounts = new Map();
    let totalMs = 0;
    let msCount = 0;
    let clicks = 0;
    let searches = 0;

    for (const ev of events) {
      if (ev.event_type === "search") {
        searches++;
        if (ev.query) {
          queryCounts.set(ev.query, (queryCounts.get(ev.query) || 0) + 1);
          if (ev.zero_results) {
            zeroQueries.set(ev.query, (zeroQueries.get(ev.query) || 0) + 1);
          }
          for (const { slug, title } of matchTopicsToQuery(ev.query).map((t) => ({ slug: t.slug, title: t.title }))) {
            topicCounts.set(slug, { count: (topicCounts.get(slug)?.count || 0) + 1, title });
          }
        }
        if (ev.response_ms) {
          totalMs += ev.response_ms;
          msCount++;
        }
      }
      if (ev.event_type === "click") clicks++;
    }

    const top_queries = [...queryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    const zero_result_queries = [...zeroQueries.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    const top_topics = [...topicCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([slug, { count, title }]) => ({ slug, title, count }));

    const avg_response_ms = msCount ? Math.round(totalMs / msCount) : 0;
    const click_through_rate = searches ? Math.round((clicks / searches) * 1000) / 10 : 0;
    const quality_score = Math.min(
      100,
      Math.round(
        (searches ? (1 - zero_result_queries.length / Math.max(searches, 1)) * 0.4 : 0.5) * 40 +
          (avg_response_ms < 1000 ? 30 : avg_response_ms < 2000 ? 15 : 0) +
          click_through_rate * 0.3,
      ),
    );

    return {
      top_queries,
      top_topics,
      zero_result_queries,
      content_gaps: zero_result_queries.slice(0, 10),
      avg_response_ms,
      click_through_rate,
      total_searches: searches,
      quality_score,
    };
  } catch {
    return empty;
  }
}
