/**
 * Async queue — retry logic, rate limiting, real job handlers (v2).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { QUEUE_DEFAULTS } from "./config.mjs";
import { analyzeImageV2 } from "./vision-intelligence-v2.mjs";
import { linkPublishedLesson } from "./graph-linker.mjs";
import { notifyLessonPublished } from "./notification-platform.mjs";
import { indexLessonForSearch } from "./search-intelligence.mjs";
import { markSeoRefresh } from "../cms/seo-refresh.mjs";

export async function enqueueJob({ jobType, payload, priority = 5, maxRetries = QUEUE_DEFAULTS.maxRetries }) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing", local: true };

  try {
    const { data, error } = await admin
      .from("mke_queue_jobs")
      .insert({
        job_type: jobType,
        payload: payload || {},
        priority,
        max_retries: maxRetries,
        status: "pending",
        next_run_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, jobId: data.id };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

export async function processQueue({ batchSize = QUEUE_DEFAULTS.batchSize, runId } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, processed: 0, error: "supabase_admin_missing" };

  const now = new Date().toISOString();
  let q;
  try {
    q = await admin
      .from("mke_queue_jobs")
      .select("*")
      .in("status", ["pending", "retry"])
      .lte("next_run_at", now)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(batchSize);
  } catch {
    return { ok: true, processed: 0, skipped: true };
  }

  const jobs = q.data || [];
  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    await admin.from("mke_queue_jobs").update({ status: "running", started_at: now }).eq("id", job.id);

    try {
      const result = await executeJob(job, { runId });
      await admin.from("mke_queue_jobs").update({
        status: "completed",
        result: result || {},
        finished_at: new Date().toISOString(),
      }).eq("id", job.id);
      processed += 1;
    } catch (err) {
      const retries = (job.retry_count || 0) + 1;
      const maxRetries = job.max_retries ?? QUEUE_DEFAULTS.maxRetries;
      const status = retries >= maxRetries ? "failed" : "retry";
      const nextRun = new Date(Date.now() + QUEUE_DEFAULTS.retryDelayMs * retries).toISOString();

      await admin.from("mke_queue_jobs").update({
        status,
        retry_count: retries,
        last_error: String(err.message || err),
        next_run_at: status === "retry" ? nextRun : null,
        finished_at: status === "failed" ? new Date().toISOString() : null,
      }).eq("id", job.id);

      if (status === "failed") failed += 1;
    }
  }

  return { ok: true, processed, failed, pending: jobs.length - processed - failed };
}

async function executeJob(job, { runId }) {
  const payload = job.payload || {};

  switch (job.job_type) {
    case "notify_subscribers": {
      const lesson = payload.lesson || { id: payload.lessonId, title: payload.title };
      return notifyLessonPublished({ lesson, source: payload.source, userIds: payload.userIds });
    }
    case "vision_analyze": {
      if (!payload.imageBase64) return { ok: false, error: "missing_image" };
      const buffer = Buffer.from(payload.imageBase64, "base64");
      return analyzeImageV2({
        imageBuffer: buffer,
        mimeType: payload.mimeType || "image/jpeg",
        caption: payload.caption,
        sourceUrl: payload.sourceUrl,
        source: payload.source,
      });
    }
    case "graph_link": {
      if (!payload.lessonId) return { ok: false, error: "missing_lesson_id" };
      return linkPublishedLesson({
        lessonId: payload.lessonId,
        parsed: payload.parsed || {},
        source: payload.source,
        runId,
      });
    }
    case "seo_refresh": {
      await markSeoRefresh();
      return { ok: true, endpoints: ["/sitemap.xml", "/feed.xml"] };
    }
    case "search_index": {
      return indexLessonForSearch(payload.lesson || { id: payload.lessonId });
    }
    default:
      return { ok: true, skipped: true, jobType: job.job_type };
  }
}

export async function getQueueStats() {
  const admin = getSupabaseAdmin();
  if (!admin) return { pending: 0, running: 0, failed: 0 };

  const counts = { pending: 0, running: 0, failed: 0, completed: 0, retry: 0 };
  for (const status of Object.keys(counts)) {
    try {
      const { count } = await admin
        .from("mke_queue_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      counts[status] = count || 0;
    } catch {
      /* optional table */
    }
  }
  return counts;
}
