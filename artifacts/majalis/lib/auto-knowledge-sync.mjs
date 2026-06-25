/**
 * Auto Knowledge Engine — sync entry for cron and admin
 */

import {
  runAutoKnowledgeEngine,
  runConnectorHealthChecks,
  getAutoKnowledgeEngineStats,
  archiveStaleContent,
  getPublicRecommendations,
} from "./auto-knowledge-engine/orchestrator.mjs";
import { runKnowledgePipeline } from "./knowledge-engine/pipeline.mjs";
import { runAutoContentSync } from "./auto-content/auto-content-sync.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";

export async function runFullKnowledgeSync(options = {}) {
  const triggerType = options.triggerType || "cron";

  const [akeResult, legacyResult, autoContentResult] = await Promise.allSettled([
    runAutoKnowledgeEngine({ triggerType, checkLinks: options.checkLinks }),
    runKnowledgePipeline({ triggerType, maxItems: options.maxItems || 30 }),
    runAutoContentSync({ triggerType }),
  ]);

  const ake = akeResult.status === "fulfilled" ? akeResult.value : { ok: false, error: akeResult.reason?.message };
  const legacy = legacyResult.status === "fulfilled" ? legacyResult.value : { ok: false };
  const autoContent = autoContentResult.status === "fulfilled" ? autoContentResult.value : { ok: false };

  const stats = await getAutoKnowledgeEngineStats(7);

  return {
    ok: ake.ok !== false || legacy.ok !== false,
    at: new Date().toISOString(),
    autoKnowledgeEngine: ake,
    knowledgePipeline: legacy,
    autoContent,
    stats: stats.stats,
    usingLegacy: stats.usingLegacy,
  };
}

export {
  runAutoKnowledgeEngine,
  runConnectorHealthChecks,
  getAutoKnowledgeEngineStats,
  archiveStaleContent,
  getPublicRecommendations,
};

export async function runWeeklyMaintenance() {
  const admin = getSupabaseAdmin();
  const archive = admin ? await archiveStaleContent(admin, 365) : { archived: 0 };
  const health = await runConnectorHealthChecks();
  return { archive, health };
}
