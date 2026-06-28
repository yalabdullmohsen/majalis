/**
 * Recommendation Engine — link related content.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { recommendRelated, scoreRelatedness } from "../../knowledge-engine/recommendations.mjs";
import { startEngineRun, finishEngineRun, createRunLogger, auditPublish } from "../run-manager.mjs";

const ENGINE_ID = "recommendations";

const TABLE_MAP = {
  lessons: { table: "lessons", title: "title", category: "category", keywords: null },
  fawaid: { table: "fawaid", title: "text", category: null, keywords: null },
};

export async function run({ runType = "incremental", maxItems = 20 } = {}) {
  const admin = getSupabaseAdmin();
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_parsed: 0,
    items_published: 0,
    errors: 0,
  };

  if (!admin) {
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: "no_admin" });
    return { ok: false, error: "no_admin", stats };
  }

  try {
    const { data: items } = await admin
      .from("knowledge_items")
      .select("id, content_kind, ai_title, ai_summary, ai_category, ai_topic, ai_scholar, ai_keywords, quality_score, trust_score, verification_status, target_record_id, source_url")
      .eq("publish_status", "published")
      .order("updated_at", { ascending: false })
      .limit(maxItems);

    stats.items_fetched = items?.length || 0;

    const { data: allCandidates } = await admin
      .from("knowledge_items")
      .select("id, content_kind, ai_title, ai_summary, ai_category, ai_topic, ai_scholar, ai_keywords, quality_score, trust_score, verification_status, target_record_id, source_url")
      .eq("publish_status", "published")
      .limit(100);

    for (const source of items || []) {
      stats.items_parsed++;
      const related = recommendRelated(source, allCandidates || [], 6);

      for (const target of related) {
        const { error } = await admin.from("content_engine_recommendations").upsert(
          {
            source_table: "knowledge_items",
            source_id: source.id,
            target_table: "knowledge_items",
            target_id: target.id,
            score: target.relevance_score,
            algorithm: "hybrid",
          },
          { onConflict: "source_table,source_id,target_table,target_id" },
        );

        if (!error) {
          stats.items_published++;
          await auditPublish({
            runId,
            engineId: ENGINE_ID,
            targetTable: "content_engine_recommendations",
            targetId: `${source.id}->${target.id}`,
            action: "publish",
            metadata: { score: target.relevance_score },
          });
        }
      }
    }

    await log("recommendation_linking", "info", `Links created: ${stats.items_published}`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt);
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
