/**
 * Reasoning Engine dashboard metrics.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getRelationStats } from "../global-reference/relations.mjs";

export async function getReasoningDashboard(admin) {
  admin = admin ?? getSupabaseAdmin();

  let stats = {};
  if (admin) {
    try {
      const { data } = await admin.rpc("reasoning_engine_stats");
      stats = data || {};
    } catch {
      /* RPC may not exist yet */
    }
  }

  const relations = await getRelationStats(admin);

  let topTopics = [];
  let recentQueries = [];
  let openIssues = 0;

  if (admin) {
    try {
      const { count } = await admin
        .from("reasoning_quality_issues")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      openIssues = count ?? 0;
    } catch {
      /* table may not exist */
    }

    try {
      const { data } = await admin
        .from("reasoning_query_logs")
        .select("query, confidence_score, citation_count, answered, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      recentQueries = data ?? [];
    } catch {
      /* */
    }

    try {
      const { data: rels } = await admin
        .from("content_relations")
        .select("relation_type")
        .limit(2000);
      const byType = {};
      for (const r of rels ?? []) {
        byType[r.relation_type] = (byType[r.relation_type] || 0) + 1;
      }
      topTopics = Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([type, count]) => ({ type, count }));
    } catch {
      /* */
    }
  }

  return {
    ok: true,
    at: new Date().toISOString(),
    entities: {
      refs: stats.refs_count ?? 0,
      verified: stats.verified_refs ?? 0,
      adhkar: stats.adhkar_count ?? 0,
      hadith: stats.hadith_count ?? 0,
    },
    graph: {
      relations: stats.relations_count ?? relations.total ?? 0,
      relation_types: topTopics,
    },
    queries: {
      last_24h: stats.queries_24h ?? 0,
      answered_24h: stats.answered_24h ?? 0,
      avg_confidence_7d: stats.avg_confidence_7d ?? null,
      recent: recentQueries,
    },
    quality: {
      open_issues: openIssues || stats.open_issues || 0,
    },
  };
}

export async function getTopLinkedEntities(admin, limit = 10) {
  if (!admin) return [];
  try {
    const { data: edges } = await admin.from("content_relations").select("from_ref_id, to_ref_id").limit(3000);
    const counts = new Map();
    for (const e of edges ?? []) {
      counts.set(e.from_ref_id, (counts.get(e.from_ref_id) || 0) + 1);
      counts.set(e.to_ref_id, (counts.get(e.to_ref_id) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([ref_id, link_count]) => ({ ref_id, link_count }));
  } catch {
    return [];
  }
}
