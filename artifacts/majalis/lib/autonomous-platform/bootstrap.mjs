/**
 * Bootstrap — seed sources, first MKE run, queue jobs, decisions.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { enqueueJob, processQueue } from "../majlis-knowledge-engine/queue.mjs";
import { runMajlisKnowledgeEngine } from "../majlis-knowledge-engine/orchestrator.mjs";
import { seedContentSourcesFromJson, syncSourcesToMkePlugins } from "./sources.mjs";
import { runContentPipeline } from "./pipelines/index.mjs";
import { logStructured } from "./monitoring.mjs";
import { PLATFORM_VERSION } from "./config.mjs";

export async function ensurePlatformBootstrap(opts = {}) {
  const admin = getSupabaseAdmin();
  const report = {
    platformVersion: PLATFORM_VERSION,
    sourcesSeeded: 0,
    mkeSynced: 0,
    firstRun: null,
    queueJobs: 0,
    decisions: 0,
    pipelineRuns: 0,
    errors: [],
  };

  const seed = await seedContentSourcesFromJson();
  report.sourcesSeeded = seed.seeded;
  if (seed.errors?.length) report.errors.push(...seed.errors);

  const sync = await syncSourcesToMkePlugins();
  report.mkeSynced = sync.synced || 0;

  if (admin) {
    try {
      const { count: runCount } = await admin.from("mke_runs").select("id", { count: "exact", head: true });
      if (!runCount || opts.forceRun) {
        const mkeResult = await runMajlisKnowledgeEngine({
          mode: opts.mkeMode || "queue",
          triggerType: "bootstrap",
        });
        report.firstRun = mkeResult;
      }
    } catch (err) {
      report.errors.push({ step: "mke_run", error: String(err.message || err) });
    }

    try {
      const { count: jobCount } = await admin.from("mke_queue_jobs").select("id", { count: "exact", head: true });
      if (!jobCount || opts.forceQueue) {
        await enqueueJob({ jobType: "seo_refresh", payload: { bootstrap: true }, priority: 8 });
        await enqueueJob({ jobType: "graph_link", payload: { bootstrap: true }, priority: 5 });
        report.queueJobs += 2;
        const queue = await processQueue({ batchSize: 5 });
        report.queueProcessed = queue;
      } else {
        report.queueJobs = jobCount;
      }
    } catch (err) {
      report.errors.push({ step: "queue", error: String(err.message || err) });
    }

    try {
      const { count: decisionCount } = await admin.from("mke_decisions").select("id", { count: "exact", head: true });
      report.decisions = decisionCount || 0;

      if (!decisionCount || opts.forcePipeline) {
        const pipelineResult = await runContentPipeline("benefits", {
          triggerType: "bootstrap",
          maxItems: 3,
          forcePublish: false,
        });
        report.pipelineRuns += 1;
        report.bootstrapPipeline = pipelineResult;
      }
    } catch (err) {
      report.errors.push({ step: "pipeline", error: String(err.message || err) });
    }
  }

  await logStructured({
    level: "info",
    component: "bootstrap",
    event: "platform_bootstrap_complete",
    metadata: report,
  });

  return {
    ok: report.errors.length === 0,
    ...report,
  };
}

export async function probePlatformTables() {
  const admin = getSupabaseAdmin();
  const tables = [
    "akp_content_sources",
    "akp_content_fingerprints",
    "akp_review_queue",
    "akp_dead_letter_jobs",
    "akp_retry_queue",
    "akp_source_health",
    "akp_duplicate_history",
    "akp_pipeline_runs",
    "mke_runs",
    "mke_queue_jobs",
    "mke_decisions",
    "mke_quality_reports",
    "mke_source_plugins",
  ];

  const out = {};
  for (const table of tables) {
    if (!admin) {
      out[table] = false;
      continue;
    }
    try {
      const { error } = await admin.from(table).select("id").limit(1);
      out[table] = !error;
    } catch {
      out[table] = false;
    }
  }
  return out;
}
