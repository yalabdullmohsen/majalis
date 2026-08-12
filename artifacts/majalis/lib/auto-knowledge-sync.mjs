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
  const isCron = triggerType === "cron";

  const tasks = [
    runAutoKnowledgeEngine({
      triggerType,
      checkLinks: options.checkLinks,
      maxConnectors: isCron ? 5 : (options.maxConnectors || 20),
    }),
    runKnowledgePipeline({
      triggerType,
      maxItems: options.maxItems || (isCron ? 10 : 30),
    }),
  ];

  // Auto content has its own cron (/api/cron/auto-content-sync) — skip in composite cron to avoid timeout
  if (!isCron || options.includeAutoContent) {
    tasks.push(runAutoContentSync({ triggerType, skipSchemaCheck: isCron }));
  }

  const settled = await Promise.allSettled(tasks);
  const akeResult = settled[0];
  const legacyResult = settled[1];
  const autoContentResult = settled[2];

  const ake = akeResult.status === "fulfilled" ? akeResult.value : { ok: false, error: akeResult.reason?.message };
  const legacy = legacyResult.status === "fulfilled" ? legacyResult.value : { ok: false, error: legacyResult.reason?.message };
  const autoContent = autoContentResult
    ? (autoContentResult.status === "fulfilled" ? autoContentResult.value : { ok: false, skipped: false, error: autoContentResult.reason?.message })
    : { ok: true, skipped: true, reason: "Dedicated /api/cron/auto-content-sync handles content in cron mode" };

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
