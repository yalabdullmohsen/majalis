/**
 * AKP v3 — Self Healing (retry, backoff, failover, alerts).
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { createAlert } from "../monitoring.mjs";
import { QUEUE_DEFAULTS } from "../config.mjs";

export async function logSelfHealingEvent(event) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.log(JSON.stringify({ tag: "akp:self-healing", ...event }));
    return;
  }
  try {
    await admin.from("akp_self_healing_events").insert({
      event_type: event.eventType,
      component: event.component,
      source_id: event.sourceId || null,
      action_taken: event.actionTaken,
      success: event.success !== false,
      attempt: event.attempt ?? 1,
      error: event.error || null,
      metadata: event.metadata || {},
    });
  } catch {
    /* optional table */
  }
}

function backoffMs(attempt) {
  return Math.min(QUEUE_DEFAULTS.retryDelayMs * 2 ** (attempt - 1), 120_000);
}

export async function healWithRetry(fn, { maxAttempts = 3, component = "akp", metadata = {} } = {}) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (result?.ok !== false) {
        if (attempt > 1) {
          await logSelfHealingEvent({
            eventType: "retry_success",
            component,
            actionTaken: `retry_attempt_${attempt}`,
            success: true,
            attempt,
            metadata,
          });
        }
        return result;
      }
      lastError = result?.error || "operation_failed";
    } catch (err) {
      lastError = String(err.message || err);
    }

    if (attempt < maxAttempts) {
      await logSelfHealingEvent({
        eventType: "retry",
        component,
        actionTaken: `backoff_${backoffMs(attempt)}ms`,
        success: false,
        attempt,
        error: lastError,
        metadata,
      });
      await sleep(backoffMs(attempt));
    }
  }

  await logSelfHealingEvent({
    eventType: "retry_exhausted",
    component,
    actionTaken: "move_to_alert",
    success: false,
    attempt: maxAttempts,
    error: lastError,
    metadata,
  });

  await createAlert({
    severity: "error",
    component,
    title: "فشل بعد إعادة المحاولة",
    message: lastError,
    metadata,
  });

  return { ok: false, error: lastError, attempts: maxAttempts };
}

export async function failoverSource(failedSourceId) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const { data: failed } = await admin.from("akp_content_sources").select("*").eq("id", failedSourceId).maybeSingle();
  if (!failed) return { ok: false, error: "source_not_found" };

  let fallbackId = failed.fallback_source_id;
  if (!fallbackId) {
    const { data: alt } = await admin
      .from("akp_content_sources")
      .select("id, name, slug")
      .eq("active", true)
      .contains("content_types", failed.content_types?.[0] ? [failed.content_types[0]] : [])
      .neq("id", failedSourceId)
      .order("health_score", { ascending: false })
      .limit(1)
      .maybeSingle();
    fallbackId = alt?.id;
  }

  if (!fallbackId) {
    await createAlert({
      severity: "warning",
      component: "self-healing",
      title: `لا يوجد مصدر بديل: ${failed.name}`,
      message: failed.last_error || "fetch_failed",
    });
    return { ok: false, error: "no_fallback" };
  }

  await logSelfHealingEvent({
    eventType: "source_failover",
    component: "self-healing",
    sourceId: failedSourceId,
    actionTaken: `failover_to_${fallbackId}`,
    success: true,
    metadata: { failedSlug: failed.slug },
  });

  return { ok: true, failedSourceId, fallbackSourceId: fallbackId };
}

export async function healDeadLetterJobs({ limit = 10 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, retried: 0 };

  const { data: jobs } = await admin
    .from("akp_dead_letter_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  let retried = 0;
  for (const job of jobs || []) {
    if ((job.retry_count || 0) >= QUEUE_DEFAULTS.maxRetries) continue;
    await logSelfHealingEvent({
      eventType: "dlq_retry",
      component: job.queue_name || "akp",
      actionTaken: "requeue",
      success: true,
      attempt: (job.retry_count || 0) + 1,
      metadata: { jobType: job.job_type, dlqId: job.id },
    });
    retried += 1;
  }

  return { ok: true, retried };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
