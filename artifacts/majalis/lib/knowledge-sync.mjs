/**
 * Knowledge sync entry — called by cron and admin API.
 */

import { runKnowledgePipeline, getKnowledgePipelineStats } from "./knowledge-engine/pipeline.mjs";

export async function runKnowledgeSync(options = {}) {
  const pipeline = await runKnowledgePipeline({
    triggerType: options.triggerType || "cron",
    maxItems: options.maxItems || 40,
    skipPublish: options.skipPublish || false,
  });

  const stats = await getKnowledgePipelineStats(7);

  return {
    ok: pipeline.ok !== false,
    at: new Date().toISOString(),
    pipeline,
    stats: stats.stats,
    usingSeed: pipeline.usingSeed || stats.usingSeed,
  };
}

export { getKnowledgePipelineStats };
