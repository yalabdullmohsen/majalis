/**
 * Durable job runners — invoked by /api/cron/job-worker after enqueue.
 * Each runner must respect AbortSignal and finish within the worker deadline.
 * Every ALLOWED_JOB_TYPES entry that can be enqueued MUST have a worker here.
 */

/**
 * @typedef {{ signal?: AbortSignal, cursor?: Record<string, unknown>, metadata?: Record<string, unknown> }} WorkerArgs
 * @typedef {{ done: boolean, continue?: boolean, cursor?: Record<string, unknown> }} WorkerResult
 */

function aborted(signal) {
  return Boolean(signal?.aborted);
}

function throwIfAborted(signal) {
  if (!aborted(signal)) return;
  const err = new Error("aborted");
  err.code = "aborted";
  throw err;
}

/** @type {Record<string, (args: WorkerArgs) => Promise<WorkerResult>>} */
export const JOB_WORKERS = {
  "source-monitor": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runLessonSourceMonitor } = await import("../cms/lesson-source-monitor.mjs");
    const result = await runLessonSourceMonitor({
      dryRun: Boolean(metadata?.dryRun),
      sourceId: metadata?.sourceId || null,
      signal,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok } };
  },
  "lesson-source-monitor": async (args) => JOB_WORKERS["source-monitor"](args),

  "lesson-intelligence": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runLessonIntelligenceEngine } = await import("../cms/lesson-intelligence/index.mjs");
    const result = await runLessonIntelligenceEngine({
      dryRun: Boolean(metadata?.dryRun),
      sourceId: metadata?.sourceId || null,
      runType: "cron",
      signal,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "auto-content-sync": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runAutoContentSync } = await import("../auto-content/auto-content-sync.mjs");
    const result = await runAutoContentSync({ triggerType: "job-worker", skipSchemaCheck: true });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok } };
  },

  "auto-knowledge-sync": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runFullKnowledgeSync } = await import("../auto-knowledge-sync.mjs");
    const result = await runFullKnowledgeSync({
      triggerType: "job-worker",
      checkLinks: metadata?.checkLinks === true,
      maxItems: Number(metadata?.maxItems) || 40,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "knowledge-sync": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runKnowledgeSync } = await import("../knowledge-sync.mjs");
    const result = await runKnowledgeSync({
      triggerType: "job-worker",
      maxItems: Number(metadata?.maxItems) || 15,
      skipPublish: metadata?.skipPublish === true || metadata?.skipPublish === "1",
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "content-scheduler": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runSchedulerJob, JOB_HANDLERS } = await import("../content-production/scheduler.mjs");
    const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
    const admin = getSupabaseAdmin();
    const jobName = String(metadata?.job || cursor?.nextJob || "source-check");
    if (!JOB_HANDLERS[jobName]) {
      return { done: true, continue: false, cursor: { ...cursor, error: "unknown_scheduler_job" } };
    }
    const result = await runSchedulerJob(jobName, admin);
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, job: jobName, ok: result?.ok !== false } };
  },

  "majlis-knowledge-engine": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runMajlisKnowledgeEngine } = await import("../majlis-knowledge-engine/index.mjs");
    const result = await runMajlisKnowledgeEngine({
      mode: metadata?.mode || "full",
      signal,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, mode: metadata?.mode || "full", ok: result?.ok !== false } };
  },

  "ai-agents": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
    const admin = getSupabaseAdmin();
    const { runAgentPipeline } = await import("../ai-agents/index.mjs");
    const pipeline = await runAgentPipeline(admin, {
      skipDiscovery: metadata?.skipDiscovery === true || metadata?.skipDiscovery === "1",
      signal,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: true, pipelineOk: Boolean(pipeline) } };
  },

  "autonomous-platform": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runAutonomousPlatform } = await import("../autonomous-platform/index.mjs");
    const mode = metadata?.mode || "full";
    const result = await runAutonomousPlatform({ mode, signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, mode, ok: result?.ok !== false } };
  },
  "autonomous-platform-recovery": async (args) =>
    JOB_WORKERS["autonomous-platform"]({
      ...args,
      metadata: { ...args.metadata, mode: "recovery" },
    }),

  "autonomous-orchestrator": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runAutonomousOrchestrator } = await import("../autonomous-ai/index.mjs");
    const result = await runAutonomousOrchestrator({
      mode: metadata?.mode || "full",
      triggerType: "job-worker",
      signal,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "islamic-intelligence": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runIslamicIntelligencePlatform } = await import("../islamic-intelligence/index.mjs");
    const result = await runIslamicIntelligencePlatform({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "knowledge-reasoning": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runReasoningCycle } = await import("../reasoning-engine/index.mjs");
    const result = await runReasoningCycle({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "verified-knowledge": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runVerifiedKnowledgeCycle } = await import("../verified-knowledge/index.mjs");
    const result = await runVerifiedKnowledgeCycle({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "scholarly-verification": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runScholarlyVerificationScan } = await import(
      "../scholarly-verification/orchestrator.mjs"
    );
    const result = await runScholarlyVerificationScan({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "platform-bootstrap": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { verifySchema } = await import("../db-migrate.mjs");
    const schema = await verifySchema();
    throwIfAborted(signal);
    return {
      done: true,
      continue: false,
      cursor: { ...cursor, schemaOk: schema?.ok === true, note: "verify_only_no_ddl" },
    };
  },

  "monitor-sources": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { monitorContentSources } = await import("../cms/source-monitor.mjs");
    const result = await monitorContentSources();
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "telegram-processor": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { processExtractionQueue } = await import("../telegram/queue-processor.mjs");
    const result = await processExtractionQueue({
      batchSize: Number(metadata?.batchSize) || 5,
      signal,
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: true, ...result } };
  },

  "process-import-jobs": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { processQueuedImportJobs, runImportJobWatchdog } = await import("../content-import/engine.mjs");
    const watchdog = await runImportJobWatchdog();
    throwIfAborted(signal);
    const result = await processQueuedImportJobs(Number(metadata?.limit) || 3);
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: true, watchdog, result } };
  },

  "check-fiqh-links": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { runFiqhLinkCheck } = await import("../fiqh-link-checker.mjs");
    const result = await runFiqhLinkCheck({ limit: Number(metadata?.limit) || 60 });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false, result } };
  },

  "connector-health": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runConnectorHealthChecks } = await import("../auto-knowledge-sync.mjs");
    const result = await runConnectorHealthChecks();
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false, result } };
  },

  "daily-benefit-rotation": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runDailyBenefitRotation } = await import("./daily-benefit-rotation-runner.mjs");
    const result = await runDailyBenefitRotation();
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false, result } };
  },

  "content-scoring": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runContentScoring } = await import("./content-scoring-runner.mjs");
    const result = await runContentScoring({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "global-reference-review": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
    const { runReviewCycle } = await import("../global-reference/review.mjs");
    const admin = getSupabaseAdmin();
    const cycle = await runReviewCycle(admin, {
      checkLinks: metadata?.links !== "0" && metadata?.checkLinks !== false,
      type: "cron",
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: true, cycle } };
  },

  "researches-daily-import": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runResearchesDailyImport } = await import("./researches-daily-import-runner.mjs");
    const result = await runResearchesDailyImport({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "universities-review": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runUniversitiesReview } = await import("./universities-review-runner.mjs");
    const result = await runUniversitiesReview({ signal });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "sync-data": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runDailyDataSync } = await import("../sync-data.mjs");
    const result = await runDailyDataSync();
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "sync-fiqh-council": async ({ signal, cursor }) => {
    throwIfAborted(signal);
    const { runFiqhCouncilSync } = await import("../fiqh-council-sync.mjs");
    const result = await runFiqhCouncilSync({ triggerType: "job-worker" });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "import-phase2-trial": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const { runPhase2TrialImport } = await import("../content-import/phase2-trial.mjs");
    const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
    const result = await runPhase2TrialImport(appRoot, {
      dryRun: metadata?.dryRun === true || metadata?.dryRun === "1",
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "governance-backup": async ({ signal, cursor, metadata }) => {
    throwIfAborted(signal);
    const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
    const { runGovernanceCycle } = await import("../governance/orchestrator.mjs");
    const admin = getSupabaseAdmin();
    const mode = metadata?.mode || "backup";
    const result = await runGovernanceCycle(admin, {
      backup: mode === "backup" || mode === "full",
      security: mode === "security" || mode === "full",
      quality: mode === "full",
    });
    throwIfAborted(signal);
    return { done: true, continue: false, cursor: { ...cursor, mode, ok: result?.ok !== false } };
  },
};

export function getJobWorker(jobType) {
  return JOB_WORKERS[String(jobType || "")] || null;
}

export function hasJobWorker(jobType) {
  return Boolean(getJobWorker(jobType));
}

export function listRegisteredJobWorkers() {
  return Object.keys(JOB_WORKERS).sort();
}
