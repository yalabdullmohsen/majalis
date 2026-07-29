/**
 * Durable job runners — invoked by /api/cron/job-worker after enqueue.
 * Each runner should respect AbortSignal and finish within the worker deadline.
 */

/**
 * @typedef {{ signal?: AbortSignal, cursor?: Record<string, unknown>, metadata?: Record<string, unknown> }} WorkerArgs
 * @typedef {{ done: boolean, continue?: boolean, cursor?: Record<string, unknown> }} WorkerResult
 */

/** @type {Record<string, (args: WorkerArgs) => Promise<WorkerResult>>} */
export const JOB_WORKERS = {
  "source-monitor": async ({ signal, cursor, metadata }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runLessonSourceMonitor } = await import("../cms/lesson-source-monitor.mjs");
    const result = await runLessonSourceMonitor({
      dryRun: Boolean(metadata?.dryRun),
      sourceId: metadata?.sourceId || null,
      signal,
    });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok } };
  },
  "lesson-source-monitor": async (args) => JOB_WORKERS["source-monitor"](args),

  "auto-content-sync": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runAutoContentSync } = await import("../auto-content/auto-content-sync.mjs");
    const result = await runAutoContentSync({ triggerType: "job-worker", skipSchemaCheck: true });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok } };
  },

  "content-scheduler": async ({ signal, cursor, metadata }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runSchedulerJob, JOB_HANDLERS } = await import("../content-production/scheduler.mjs");
    const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
    const admin = getSupabaseAdmin();
    const jobName = String(metadata?.job || cursor?.nextJob || "source-check");
    if (!JOB_HANDLERS[jobName]) {
      return { done: true, continue: false, cursor: { ...cursor, error: "unknown_scheduler_job" } };
    }
    const result = await runSchedulerJob(jobName, admin);
    return { done: true, continue: false, cursor: { ...cursor, job: jobName, ok: result?.ok !== false } };
  },

  "majlis-knowledge-engine": async ({ signal, cursor, metadata }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runMajlisKnowledgeEngine } = await import("../majlis-knowledge-engine/index.mjs");
    const result = await runMajlisKnowledgeEngine({
      mode: metadata?.mode || "full",
      signal,
    });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "ai-agents": async ({ signal, cursor, metadata }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { getSupabaseAdmin } = await import("../supabase-admin.mjs");
    const admin = getSupabaseAdmin();
    const { runAgentPipeline } = await import("../ai-agents/index.mjs");
    const pipeline = await runAgentPipeline(admin, {
      skipDiscovery: metadata?.skipDiscovery === true || metadata?.skipDiscovery === "1",
      signal,
    });
    return { done: true, continue: false, cursor: { ...cursor, ok: true, pipelineOk: Boolean(pipeline) } };
  },

  "autonomous-platform": async ({ signal, cursor, metadata }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runAutonomousPlatform } = await import("../autonomous-platform/index.mjs");
    const result = await runAutonomousPlatform({ mode: metadata?.mode || "full", signal });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },
  "autonomous-platform-recovery": async (args) =>
    JOB_WORKERS["autonomous-platform"]({
      ...args,
      metadata: { ...args.metadata, mode: "recovery" },
    }),

  "islamic-intelligence": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runIslamicIntelligencePlatform } = await import("../islamic-intelligence/index.mjs");
    const result = await runIslamicIntelligencePlatform({ signal });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "knowledge-reasoning": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runReasoningCycle } = await import("../reasoning-engine/index.mjs");
    const result = await runReasoningCycle({ signal });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "verified-knowledge": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runVerifiedKnowledgeCycle } = await import("../verified-knowledge/index.mjs");
    const result = await runVerifiedKnowledgeCycle({ signal });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "scholarly-verification": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { runScholarlyVerificationScan } = await import(
      "../scholarly-verification/orchestrator.mjs"
    );
    const result = await runScholarlyVerificationScan({ signal });
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },

  "platform-bootstrap": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { verifySchema } = await import("../db-migrate.mjs");
    const schema = await verifySchema();
    return {
      done: true,
      continue: false,
      cursor: { ...cursor, schemaOk: schema?.ok === true, note: "verify_only_no_ddl" },
    };
  },

  "monitor-sources": async ({ signal, cursor }) => {
    if (signal?.aborted) return { done: false, continue: false, cursor };
    const { monitorContentSources } = await import("../cms/source-monitor.mjs");
    const result = await monitorContentSources();
    return { done: true, continue: false, cursor: { ...cursor, ok: result?.ok !== false } };
  },
};

export function getJobWorker(jobType) {
  return JOB_WORKERS[String(jobType || "")] || null;
}
