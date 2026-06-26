/**
 * Content Discovery Agent — fetches new content from trusted official sources.
 */

import { syncTrustedSources, getTrustedSourcesDashboard } from "../trusted-sources/index.mjs";
import { runAutoContentSync } from "../auto-content/auto-content-sync.mjs";
import { logAgentRun, logAgentError } from "./audit.mjs";

export async function runContentDiscoveryAgent(admin, opts = {}) {
  const started = Date.now();
  const result = {
    agent: "content_discovery",
    status: "running",
    sources_synced: 0,
    items_discovered: 0,
    errors: [],
  };

  try {
    const syncResult = await syncTrustedSources(admin, { probe: opts.probe !== false });
    result.sources_synced = syncResult.synced || 0;
    result.sources = syncResult.sources?.length || 0;

    if (opts.runSync !== false) {
      const sync = await runAutoContentSync({
        triggerType: "ai_agent_discovery",
        skipSchemaCheck: opts.skipSchemaCheck,
      });
      result.items_discovered = sync?.imported || sync?.stats?.imported || 0;
      result.skipped = sync?.skipped || sync?.stats?.skipped || 0;
      result.sync_run_id = sync?.runId;
    }

    result.status = "completed";
    result.duration_ms = Date.now() - started;

    await logAgentRun(admin, {
      agentId: "content_discovery",
      outcome: "success",
      metadata: result,
    });
  } catch (err) {
    result.status = "failed";
    result.errors.push(String(err.message || err));
    result.duration_ms = Date.now() - started;
    await logAgentError(admin, "content_discovery", err, result);
  }

  return result;
}

export async function getDiscoveryStats(admin) {
  const dashboard = await getTrustedSourcesDashboard(admin);
  return {
    active_sources: dashboard.filter((s) => s.is_active).length,
    total_sources: dashboard.length,
    total_imported: dashboard.reduce((sum, s) => sum + (s.imported_count || 0), 0),
  };
}
