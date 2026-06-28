import {
  AUTO_PUBLISH_CONFIDENCE,
  DAILY_TARGET,
  MIN_VERIFY_CONFIDENCE,
  REJECT_REASONS,
  TIME_BUDGET_MS,
  BATCH_PARALLEL,
} from "./config.mjs";
import { buildDailyPlan, todayKey } from "./categories.mjs";
import { generateCandidate, verifyCandidate } from "./ai-generate.mjs";
import { checkDuplicate, registerCandidate, loadDedupIndex } from "./dedup.mjs";
import { validateStructure, qualityFilter, resolvePipelineStatus } from "./validate.mjs";
import {
  getOrCreateJob,
  updateJob,
  logEvent,
  logFailure,
  insertApprovedQuestion,
  countPublishedQuestions,
  ensureGenerationSchema,
} from "./store.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

async function processSlot(admin, job, slot, stats) {
  const gen = await generateCandidate(slot);
  stats.generated += 1;

  if (!gen.ok) {
    stats.rejected += 1;
    await logFailure(admin, {
      job_id: job.id,
      category_slug: slot.category_slug,
      reason_code: REJECT_REASONS.AI_ERROR,
      reason_detail: gen.error,
    });
    return;
  }

  const candidate = gen.candidate;
  const struct = validateStructure(candidate);
  if (!struct.ok) {
    stats.rejected += 1;
    await logFailure(admin, {
      job_id: job.id,
      category_slug: slot.category_slug,
      reason_code: REJECT_REASONS.VALIDATION,
      reason_detail: struct.errors.join(", "),
      candidate,
    });
    return;
  }

  const dup = await checkDuplicate(candidate, admin);
  if (dup.duplicate) {
    stats.duplicates += 1;
    stats.rejected += 1;
    await logFailure(admin, {
      job_id: job.id,
      category_slug: slot.category_slug,
      reason_code: REJECT_REASONS.DUPLICATE,
      reason_detail: dup.reason,
      candidate,
    });
    return;
  }

  const verification = await verifyCandidate(candidate);
  if (!verification.ok || verification.confidence < MIN_VERIFY_CONFIDENCE) {
    stats.rejected += 1;
    await logFailure(admin, {
      job_id: job.id,
      category_slug: slot.category_slug,
      reason_code: REJECT_REASONS.LOW_CONFIDENCE,
      reason_detail: `confidence=${verification.confidence}`,
      candidate,
    });
    return;
  }

  const quality = qualityFilter(candidate, verification);
  if (!quality.ok) {
    stats.rejected += 1;
    await logFailure(admin, {
      job_id: job.id,
      category_slug: slot.category_slug,
      reason_code: REJECT_REASONS.QUALITY,
      reason_detail: quality.reasons.join(", "),
      candidate,
    });
    return;
  }

  const statusFields = resolvePipelineStatus(verification.confidence, AUTO_PUBLISH_CONFIDENCE);

  const inserted = await insertApprovedQuestion(admin, candidate, {
    job_id: job.id,
    content_hash: dup.hash,
    confidence: verification.confidence,
    embedding: dup.embedding,
    ...statusFields,
    difficulty: slot.difficulty,
  });

  registerCandidate(candidate, dup.hash, dup.embedding);
  stats.approved += 1;
  stats.confidenceSum += verification.confidence;
  stats.categoryCounts[slot.category_slug] = (stats.categoryCounts[slot.category_slug] || 0) + 1;
  stats.difficultyCounts[slot.difficulty] = (stats.difficultyCounts[slot.difficulty] || 0) + 1;

  await logEvent(admin, {
    job_id: job.id,
    question_id: inserted.id,
    category_slug: slot.category_slug,
    stage: "stored",
    status: "success",
    message: statusFields.pipeline_status,
    confidence: verification.confidence,
  });
}

export async function runDailyGeneration(options = {}) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY required" };
  }

  const schemaOk = await ensureGenerationSchema(admin);
  if (!schemaOk) {
    return {
      ok: false,
      error: "question_generation tables missing — apply question_generation_v1.sql",
      hint: "GET /api/cron/apply-migrations?scope=question-generation",
    };
  }

  const dayKey = options.dayKey || todayKey();
  const targetCount = options.targetCount || DAILY_TARGET;
  const force = options.force === true;

  const jobResult = await getOrCreateJob(admin, { dayKey, targetCount, force });
  if (jobResult.skipped) {
    return { ok: true, skipped: true, reason: jobResult.reason, job: jobResult.job };
  }

  const job = jobResult.job;
  const plan = buildDailyPlan(targetCount, dayKey);
  const cursor = job.resume_cursor || 0;
  const stats = {
    generated: job.generated_count || 0,
    approved: job.approved_count || 0,
    rejected: job.rejected_count || 0,
    duplicates: job.duplicate_count || 0,
    confidenceSum: 0,
    categoryCounts: {},
    difficultyCounts: {},
  };

  await updateJob(admin, job.id, {
    status: "running",
    started_at: job.started_at || new Date().toISOString(),
    categories: plan.map((p) => p.category_slug),
  });

  await loadDedupIndex(admin);

  let slotIndex = cursor;
  const deadline = started + (options.timeBudgetMs || TIME_BUDGET_MS);

  while (slotIndex < plan.length && Date.now() < deadline) {
    const batch = plan.slice(slotIndex, slotIndex + BATCH_PARALLEL);
    await Promise.all(batch.map((slot) => processSlot(admin, job, slot, stats).catch(async (err) => {
      stats.rejected += 1;
      await logFailure(admin, {
        job_id: job.id,
        category_slug: slot.category_slug,
        reason_code: REJECT_REASONS.AI_ERROR,
        reason_detail: err.message,
      });
    })));
    slotIndex += batch.length;

    await updateJob(admin, job.id, {
      resume_cursor: slotIndex,
      generated_count: stats.generated,
      approved_count: stats.approved,
      rejected_count: stats.rejected,
      duplicate_count: stats.duplicates,
    });
  }

  const completed = slotIndex >= plan.length;
  const dbTotal = await countPublishedQuestions(admin);
  const executionMs = Date.now() - started;
  const avgConfidence = stats.approved ? stats.confidenceSum / stats.approved : 0;

  await updateJob(admin, job.id, {
    status: completed ? "completed" : "partial",
    completed_at: completed ? new Date().toISOString() : null,
    generated_count: stats.generated,
    approved_count: stats.approved,
    rejected_count: stats.rejected,
    duplicate_count: stats.duplicates,
    resume_cursor: slotIndex,
  });

  const report = {
    day_key: dayKey,
    generated: stats.generated,
    approved: stats.approved,
    rejected: stats.rejected,
    duplicates: stats.duplicates,
    categories: stats.categoryCounts,
    avg_confidence: avgConfidence,
    execution_ms: executionMs,
    db_total: dbTotal,
    completed,
    slots_processed: slotIndex,
    target: targetCount,
  };

  await saveDailyReport(admin, job.id, report);

  return { ok: true, job_id: job.id, completed, report };
}

async function saveDailyReport(admin, jobId, report) {
  const duplicateRate = report.generated ? report.duplicates / report.generated : 0;
  try {
    await admin.from("daily_generation_reports").upsert(
      {
        job_id: jobId,
        day_key: report.day_key,
        generated: report.generated,
        approved: report.approved,
        rejected: report.rejected,
        duplicates: report.duplicates,
        categories: report.categories,
        avg_confidence: report.avg_confidence,
        execution_ms: report.execution_ms,
        db_total: report.db_total,
        report,
      },
      { onConflict: "day_key" },
    );

    await admin.from("question_generation_metrics").upsert(
      {
        day_key: report.day_key,
        total_generated: report.generated,
        total_approved: report.approved,
        total_rejected: report.rejected,
        total_duplicates: report.duplicates,
        avg_confidence: report.avg_confidence,
        duplicate_rate: duplicateRate,
        category_distribution: report.categories,
        execution_ms: report.execution_ms,
        db_total_questions: report.db_total,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "day_key" },
    );
  } catch {
    /* tables optional until migration */
  }
}

export async function getGenerationDashboard(admin) {
  if (!admin) return { ok: false, error: "no_admin" };

  const dayKey = todayKey();
  const [
    { data: todayReport },
    { data: recentReports },
    { count: totalPublished },
    { data: recentFailures },
    { data: activeJob },
  ] = await Promise.all([
    admin.from("daily_generation_reports").select("*").eq("day_key", dayKey).maybeSingle(),
    admin.from("daily_generation_reports").select("*").order("day_key", { ascending: false }).limit(14),
    admin.from("sin_jeem_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
    admin.from("question_generation_failures").select("*").order("created_at", { ascending: false }).limit(10),
    admin.from("question_generation_jobs").select("*").eq("day_key", dayKey).maybeSingle(),
  ]);

  const { data: metrics } = await admin
    .from("question_generation_metrics")
    .select("*")
    .order("day_key", { ascending: false })
    .limit(30);

  return {
    ok: true,
    today: todayReport,
    active_job: activeJob,
    total_published: totalPublished || 0,
    recent_reports: recentReports || [],
    metrics: metrics || [],
    recent_failures: recentFailures || [],
  };
}
