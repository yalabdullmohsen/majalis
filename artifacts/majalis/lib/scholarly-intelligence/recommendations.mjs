/**
 * Personalized recommendations based on user interaction history.
 */

import { recommendRelated } from "../knowledge-engine/recommendations.mjs";
import { matchTopicsToContent, getTopicBySlug } from "./topics.mjs";
import { enrichResult, resolveContentUrl } from "./url-resolver.mjs";
import { rankResults } from "./ranker.mjs";
import { processQuery } from "./query-processor.mjs";

export async function getUserPreferences(admin, userId) {
  if (admin && userId) {
    try {
      const { data } = await admin
        .from("user_search_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        return {
          preferredKinds: data.preferred_kinds || [],
          preferredTopics: data.preferred_topics || [],
          interaction_count: data.interaction_count || 0,
        };
      }
    } catch {
      /* table may not exist yet */
    }
  }

  return { preferredKinds: [], preferredTopics: [], interaction_count: 0 };
}

export async function recordInteraction(admin, { userId, kind, topicSlug, query }) {
  if (!admin) return;

  try {
    const prefs = await getUserPreferences(admin, userId);
    const kinds = new Set(prefs.preferredKinds);
    const topics = new Set(prefs.preferredTopics);

    if (kind) kinds.add(kind);
    if (topicSlug) topics.add(topicSlug);

    if (query) {
      for (const { topic } of matchTopicsToContent(query)) {
        topics.add(topic.slug);
      }
    }

    await admin.from("user_search_preferences").upsert(
      {
        user_id: userId,
        preferred_kinds: [...kinds].slice(-10),
        preferred_topics: [...topics].slice(-15),
        last_interaction_at: new Date().toISOString(),
        interaction_count: (prefs.interaction_count || 0) + 1,
      },
      { onConflict: "user_id" },
    );
  } catch {
    /* best effort */
  }
}

export async function getRelatedContent(admin, { kind, recordId, topicSlug, query, limit = 8, userId }) {
  const prefs = await getUserPreferences(admin, userId);
  let source = null;
  let candidates = [];

  if (admin && recordId) {
    const { data } = await admin
      .from("knowledge_items")
      .select("*")
      .eq("target_record_id", recordId)
      .eq("publish_status", "published")
      .maybeSingle();
    source = data;
  }

  if (admin) {
    const { data } = await admin
      .from("knowledge_items")
      .select("id, content_kind, ai_title, ai_summary, ai_category, ai_topic, ai_scholar, ai_keywords, quality_score, trust_score, verification_status, target_record_id, source_url, updated_at")
      .eq("publish_status", "published")
      .limit(80);

    candidates = data || [];
  }

  let items = [];

  if (source) {
    items = recommendRelated(source, candidates, limit);
  } else if (topicSlug) {
    const topic = getTopicBySlug(topicSlug);
    if (topic) {
      items = candidates
        .filter((c) => {
          const text = [c.ai_title, c.ai_summary, ...(c.ai_keywords || [])].join(" ");
          return matchTopicsToContent(text, c.ai_keywords).some((m) => m.topic.slug === topicSlug);
        })
        .slice(0, limit);
    }
  } else if (query) {
    const queryInfo = processQuery(query);
    items = rankResults(
      candidates.map((c) => enrichResult({ ...c, title: c.ai_title, kind: c.content_kind })),
      queryInfo,
      prefs,
    ).slice(0, limit);
  } else if (kind) {
    items = candidates.filter((c) => c.content_kind === kind).slice(0, limit);
  }

  return {
    items: items.map((i) =>
      enrichResult({
        ...i,
        title: i.ai_title || i.title,
        kind: i.content_kind || i.kind,
        href: resolveContentUrl(i),
      }),
    ),
    algorithm: source ? "content-similarity" : topicSlug ? "topic-match" : query ? "query-rank" : "kind-filter",
    preferredKinds: prefs.preferredKinds,
  };
}
