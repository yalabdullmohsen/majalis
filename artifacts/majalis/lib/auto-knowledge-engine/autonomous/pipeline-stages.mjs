/**
 * Unified autonomous pipeline stage definitions.
 */

export const AUTONOMOUS_PIPELINE_STAGES = [
  "discover",
  "download",
  "normalize",
  "language_detection",
  "metadata_extraction",
  "duplicate_detection",
  "reference_validation",
  "quality_scoring",
  "authenticity_verification",
  "ai_enrichment",
  "seo_generation",
  "image_selection",
  "classification",
  "tag_generation",
  "publishing",
  "search_indexing",
  "analytics_update",
];

export const CONTENT_TYPE_TARGETS = {
  lesson: { table: "lessons", label: "الدروس" },
  lecture: { table: "lessons", label: "الدروس" },
  course: { table: "lessons", label: "الدروس" },
  book: { table: "library_items", label: "المكتبة" },
  article: { table: "library_items", label: "المكتبة" },
  fatwa: { table: "fatwas", label: "الفتاوى" },
  fiqh_decision: { table: "fiqh_council_items", label: "المجمع الفقهي" },
  sharia_ruling: { table: "sharia_rulings", label: "الأحكام الشرعية" },
  news: { table: "platform_updates", label: "المستجدات" },
  announcement: { table: "platform_updates", label: "المستجدات" },
  miracle: { table: "scientific_miracles", label: "الإعجاز العلمي" },
  fawaid: { table: "fawaid", label: "الفوائد" },
  event: { table: "islamic_events", label: "الفعاليات" },
  qa: { table: "qa_questions", label: "الأسئلة" },
  annual_course: { table: "annual_courses", label: "الدورات" },
  sheikh: { table: "sheikhs", label: "المشايخ" },
};

export async function recordStageRun(admin, { runId, itemExternalId, stage, status, durationMs, metadata }) {
  if (!admin) return;
  try {
    await admin.from("ake_pipeline_stage_runs").insert({
      run_id: runId || null,
      item_external_id: itemExternalId || null,
      stage,
      status: status || "completed",
      duration_ms: durationMs || null,
      metadata: metadata || {},
    });
  } catch {
    /* optional table */
  }
}

export async function runStage(admin, stage, fn, context = {}) {
  const started = Date.now();
  try {
    const result = await fn();
    await recordStageRun(admin, {
      runId: context.runId,
      itemExternalId: context.externalId,
      stage,
      status: "completed",
      durationMs: Date.now() - started,
      metadata: { ok: true },
    });
    return result;
  } catch (err) {
    await recordStageRun(admin, {
      runId: context.runId,
      itemExternalId: context.externalId,
      stage,
      status: "failed",
      durationMs: Date.now() - started,
      metadata: { error: err.message },
    });
    throw err;
  }
}
