import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { todayKey } from "./categories.mjs";

export async function getOrCreateJob(admin, { dayKey = todayKey(), targetCount = 50, force = false } = {}) {
  const { data: existing } = await admin
    .from("question_generation_jobs")
    .select("*")
    .eq("day_key", dayKey)
    .maybeSingle();

  if (existing && !force) {
    if (existing.status === "completed") {
      return { ok: true, job: existing, skipped: true, reason: "already_completed" };
    }
    return { ok: true, job: existing, resumed: existing.status === "running" || existing.status === "partial" };
  }

  if (existing && force) {
    await admin.from("question_generation_jobs").delete().eq("id", existing.id);
  }

  const { data, error } = await admin
    .from("question_generation_jobs")
    .insert({
      day_key: dayKey,
      status: "queued",
      target_count: targetCount,
      categories: [],
      config: { force },
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { ok: true, job: data };
}

export async function updateJob(admin, jobId, patch) {
  const { error } = await admin
    .from("question_generation_jobs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

export async function logEvent(admin, { job_id, question_id, category_slug, stage, status, message, payload, confidence }) {
  try {
    await admin.from("question_generation_logs").insert({
      job_id,
      question_id,
      category_slug,
      stage,
      status,
      message,
      payload,
      confidence,
    });
  } catch {
    /* table may not exist yet */
  }
}

export async function logFailure(admin, { job_id, category_slug, reason_code, reason_detail, candidate }) {
  try {
    await admin.from("question_generation_failures").insert({
      job_id,
      category_slug,
      reason_code,
      reason_detail,
      candidate,
    });
  } catch {
    /* optional */
  }
}

export async function resolveCategoryId(admin, slug) {
  const { data } = await admin.from("sin_jeem_categories").select("id").eq("slug", slug).maybeSingle();
  return data?.id || null;
}

export async function insertApprovedQuestion(admin, candidate, meta) {
  const category_id = await resolveCategoryId(admin, candidate.category_slug);
  const row = {
    category_id,
    question_type: "multiple_choice",
    question: candidate.question.trim(),
    options: candidate.options,
    correct_index: candidate.correct_index,
    correct_answer: candidate.correct_answer || candidate.options?.[candidate.correct_index],
    explanation: candidate.explanation,
    difficulty: candidate.difficulty || "متوسط",
    keywords: candidate.tags || [],
    tags: candidate.tags || [],
    source_type: candidate.source_type,
    source: candidate.source_type,
    source_reference: candidate.source_reference,
    content_hash: meta.content_hash,
    ai_confidence: meta.confidence,
    generation_job_id: meta.job_id,
    pipeline_status: meta.pipeline_status,
    status: meta.status,
    review_status: meta.review_status,
    embedding: meta.embedding || null,
    points: meta.difficulty === "متقدم" ? 15 : meta.difficulty === "متوسط" ? 10 : 5,
  };

  const { data, error } = await admin.from("sin_jeem_questions").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function countPublishedQuestions(admin) {
  const { count } = await admin
    .from("sin_jeem_questions")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  return count || 0;
}

export async function ensureGenerationSchema(admin) {
  const { error } = await admin.from("question_generation_jobs").select("id").limit(1);
  return !error || !/does not exist|PGRST205|42P01/i.test(error.message || "");
}
