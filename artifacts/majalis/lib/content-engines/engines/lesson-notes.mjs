/**
 * Lesson Notes Engine — structured notes for lessons.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { extractLessonNotes } from "../ai-extractors.mjs";
import { enqueueReview } from "../review-queue.mjs";
import { checkFingerprint, registerFingerprint } from "../dedup.mjs";
import { startEngineRun, finishEngineRun, createRunLogger, auditPublish } from "../run-manager.mjs";

const ENGINE_ID = "lesson-notes";

export async function run({ runType = "incremental", maxItems = 8, lessonId } = {}) {
  const admin = getSupabaseAdmin();
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_parsed: 0,
    items_enriched: 0,
    items_duplicate: 0,
    items_rejected: 0,
    items_review: 0,
    items_published: 0,
    errors: 0,
  };

  if (!admin) {
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: "no_admin" });
    return { ok: false, error: "no_admin", stats };
  }

  try {
    let query = admin
      .from("lessons")
      .select("id, title, description, category, source_url, speaker_name, structured_notes, status")
      .eq("status", "approved")
      .is("structured_notes", null)
      .not("description", "is", null)
      .order("updated_at", { ascending: false })
      .limit(maxItems);

    if (lessonId) query = query.eq("id", lessonId);

    const { data: lessons } = await query;
    stats.items_fetched = lessons?.length || 0;

    for (const lesson of lessons || []) {
      const body = lesson.description || "";
      if (body.length < 50) {
        stats.items_rejected++;
        continue;
      }

      if (lesson.structured_notes) {
        stats.items_duplicate++;
        continue;
      }

      stats.items_parsed++;
      const sourceUrl = lesson.source_url || `lesson://${lesson.id}`;

      const dup = await checkFingerprint({ engineId: ENGINE_ID, sourceUrl, body: `notes:${lesson.id}` });
      if (dup.isDuplicate) {
        stats.items_duplicate++;
        continue;
      }

      const extracted = await extractLessonNotes({
        title: lesson.title,
        body,
        sourceUrl,
        sourceName: lesson.speaker_name,
        scholar: lesson.speaker_name,
        category: lesson.category,
      });

      stats.items_enriched++;

      if (!extracted.notes?.main_points?.length) {
        await enqueueReview({
          engineId: ENGINE_ID,
          runId,
          item: { title: lesson.title, source_url: sourceUrl, lesson_id: lesson.id },
          reason: "weak_extraction",
          sourceType: "lesson",
        });
        stats.items_review++;
        continue;
      }

      const status = extracted.needs_review || extracted.confidence < 60 ? "review" : "published";

      await admin.from("content_engine_lesson_notes").upsert(
        {
          run_id: runId,
          lesson_id: lesson.id,
          source_url: sourceUrl,
          main_points: extracted.notes.main_points,
          subtopics: extracted.notes.subtopics,
          practical: extracted.notes.practical,
          quotes: extracted.notes.quotes,
          follow_up: extracted.notes.follow_up,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "lesson_id" },
      );

      if (status === "published") {
        await admin
          .from("lessons")
          .update({ structured_notes: extracted.notes, updated_at: new Date().toISOString() })
          .eq("id", lesson.id);

        await registerFingerprint({
          engineId: ENGINE_ID,
          sourceUrl,
          body: `notes:${lesson.id}`,
          targetTable: "lessons",
          targetId: lesson.id,
        });

        await auditPublish({
          runId,
          engineId: ENGINE_ID,
          targetTable: "content_engine_lesson_notes",
          targetId: lesson.id,
          sourceUrl,
        });

        stats.items_published++;
      } else {
        stats.items_review++;
      }
    }

    await log("publish_or_review", "info", `Notes: published=${stats.items_published}`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt);
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
