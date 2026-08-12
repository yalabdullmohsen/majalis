/**
 * Knowledge sync entry — called by cron and admin API.
 */

import { runFullKnowledgeSync, getAutoKnowledgeEngineStats } from "./auto-knowledge-sync.mjs";

export async function runKnowledgeSync(options = {}) {
  const pipeline = await runFullKnowledgeSync({
    triggerType: options.triggerType || "cron",
    maxItems: options.maxItems || 40,
    skipPublish: options.skipPublish || false,
  });

  const stats = await getAutoKnowledgeEngineStats(7);

  return {
    ok: pipeline.ok !== false,
    at: new Date().toISOString(),
    pipeline,
    stats: stats.stats,
    usingSeed: pipeline.usingLegacy || stats.usingLegacy,
  };
}

export { getAutoKnowledgeEngineStats as getKnowledgePipelineStats };
