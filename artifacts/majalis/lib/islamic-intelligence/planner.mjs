/**
 * AI Content Planner — gap analysis and editorial work plans.
 */

import crypto from "node:crypto";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getSearchAnalytics } from "../scholarly-intelligence/analytics.mjs";
import { ISLAMIC_TOPICS, matchTopicsToContent } from "../scholarly-intelligence/topics.mjs";
import { getRelationStats } from "../global-reference/relations.mjs";

export async function runContentPlanner(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const days = opts.days || 30;

  const [searchAnalytics, relationStats] = await Promise.all([
    getSearchAnalytics(admin, days),
    getRelationStats(admin),
  ]);

  const topicCoverage = new Map();
  for (const topic of ISLAMIC_TOPICS) {
    topicCoverage.set(topic.slug, { topic, contentCount: 0, searchDemand: 0 });
  }

  for (const { slug, count } of searchAnalytics.top_topics || []) {
    const entry = topicCoverage.get(slug);
    if (entry) entry.searchDemand = count;
  }

  if (admin) {
    try {
      const { data: refs } = await admin.from("global_content_refs").select("title, content_kind").limit(500);
      for (const ref of refs || []) {
        const matches = matchTopicsToContent(ref.title || "", []);
        for (const { topic } of matches) {
          const entry = topicCoverage.get(topic.slug);
          if (entry) entry.contentCount++;
        }
      }
    } catch {
      /* refs optional */
    }
  }

  const gaps = [...topicCoverage.values()]
    .map(({ topic, contentCount, searchDemand }) => ({
      topic_slug: topic.slug,
      topic_title: topic.title,
      content_count: contentCount,
      search_demand: searchDemand,
      gap_score: searchDemand * 2 - contentCount,
      priority: searchDemand > 5 && contentCount < 3 ? "high" : searchDemand > 2 && contentCount < 2 ? "medium" : "low",
    }))
    .filter((g) => g.gap_score > 0 || g.search_demand > 0)
    .sort((a, b) => b.gap_score - a.gap_score)
    .slice(0, 20);

  const zeroResultTopics = (searchAnalytics.zero_result_queries || []).slice(0, 10).map((q) => ({
    query: q.query,
    search_count: q.count,
    action: "إنشاء محتوى جديد أو ربط محتوى موجود",
    priority: q.count > 3 ? "high" : "medium",
  }));

  const workPlan = [
    ...gaps.filter((g) => g.priority === "high").map((g) => ({
      task: `إثراء موضوع: ${g.topic_title}`,
      type: "enrich_topic",
      topic_slug: g.topic_slug,
      priority: "high",
      reason: `${g.search_demand} بحث، ${g.content_count} محتوى فقط`,
      estimated_impact: "high",
    })),
    ...zeroResultTopics.map((z) => ({
      task: `تغطية بحث: "${z.query}"`,
      type: "cover_search_gap",
      query: z.query,
      priority: z.priority,
      reason: `${z.search_count} بحث بدون نتائج`,
      estimated_impact: "high",
    })),
    {
      task: "ربط العناصر غير المرتبطة",
      type: "build_relations",
      priority: relationStats.total < 100 ? "high" : "medium",
      reason: `${relationStats.total || 0} علاقة حالياً`,
      estimated_impact: "medium",
    },
  ].slice(0, 15);

  const plan = {
    id: runId,
    agent: "content_planner",
    generated_at: new Date().toISOString(),
    period_days: days,
    content_gaps: gaps,
    zero_result_queries: zeroResultTopics,
    top_searched: searchAnalytics.top_queries?.slice(0, 10) || [],
    work_plan: workPlan,
    summary: {
      high_priority_tasks: workPlan.filter((t) => t.priority === "high").length,
      topics_needing_enrichment: gaps.filter((g) => g.priority === "high").length,
      search_gaps: zeroResultTopics.length,
    },
  };

  if (admin) {
    try {
      await admin.from("intelligence_content_plans").upsert(
        {
          id: runId,
          period_start: new Date(Date.now() - days * 86400000).toISOString().slice(0, 10),
          period_end: new Date().toISOString().slice(0, 10),
          plan,
          status: "active",
        },
        { onConflict: "period_start" },
      );
    } catch {
      /* table may not exist */
    }
  }

  return plan;
}
