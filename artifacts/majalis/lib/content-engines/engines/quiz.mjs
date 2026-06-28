/**
 * Quiz Generation Engine — from lessons → platform_quiz_questions.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { extractQuizFromSource } from "../ai-extractors.mjs";
import { scoreQuizQuestion } from "../quality-gate.mjs";
import { checkFingerprint, registerFingerprint } from "../dedup.mjs";
import { enqueueReview } from "../review-queue.mjs";
import { startEngineRun, finishEngineRun, createRunLogger, auditPublish } from "../run-manager.mjs";
import { publishToTarget } from "../../content-production/publisher.mjs";
import { CRON_BUDGET_MS, cronMaxItems, budgetExceeded } from "../budget.mjs";

const ENGINE_ID = "quiz";

export async function run({ runType = "incremental", maxItems = 8, lessonId, budgetMs = CRON_BUDGET_MS } = {}) {
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
      .select("id, title, description, category, source_url, speaker_name, status")
      .eq("status", "approved")
      .not("description", "is", null)
      .order("updated_at", { ascending: false })
      .limit(cronMaxItems(runType, maxItems, 2));

    if (lessonId) query = query.eq("id", lessonId);

    const { data: lessons } = await query;
    stats.items_fetched = lessons?.length || 0;

    for (const lesson of lessons || []) {
      if (budgetExceeded(startedAt, budgetMs)) break;
      const body = lesson.description || "";
      if (body.length < 80) {
        stats.items_rejected++;
        continue;
      }

      stats.items_parsed++;
      const sourceUrl = lesson.source_url || `lesson://${lesson.id}`;

      const dup = await checkFingerprint({ engineId: ENGINE_ID, sourceUrl, body: `quiz:${lesson.id}` });
      if (dup.isDuplicate) {
        stats.items_duplicate++;
        continue;
      }

      const extracted = await extractQuizFromSource({
        title: lesson.title,
        body,
        sourceUrl,
        sourceName: lesson.speaker_name || "المجلس العلمي",
        category: lesson.category,
      });

      stats.items_enriched++;

      if (!extracted.questions?.length) {
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

      for (const q of extracted.questions) {
        const quality = scoreQuizQuestion(q);
        if (quality < 60) {
          stats.items_rejected++;
          continue;
        }

        const qDup = await checkFingerprint({ engineId: ENGINE_ID, sourceUrl, body: q.question });
        if (qDup.isDuplicate) {
          stats.items_duplicate++;
          continue;
        }

        const externalKey = `ce-quiz-${lesson.id}-${Buffer.from(q.question).toString("base64url").slice(0, 24)}`;

        if (extracted.needs_review || quality < 75) {
          await admin.from("content_engine_generated_questions").upsert(
            {
              run_id: runId,
              source_type: "lesson",
              source_id: lesson.id,
              source_url: sourceUrl,
              question: q.question,
              options: q.options,
              correct_index: q.correct_index,
              category: q.category,
              difficulty: q.difficulty,
              status: "review",
            },
            { onConflict: "source_url,question" },
          );
          stats.items_review++;
          continue;
        }

        const pub = await publishToTarget(admin, "questions", {
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          category: q.category,
          difficulty: q.difficulty,
          source_url: sourceUrl,
          source_name: lesson.speaker_name || "المجلس العلمي",
          external_key: externalKey,
          metadata: { lesson_id: lesson.id, engine: ENGINE_ID },
        });

        await admin.from("content_engine_generated_questions").upsert(
          {
            run_id: runId,
            source_type: "lesson",
            source_id: lesson.id,
            source_url: sourceUrl,
            question: q.question,
            options: q.options,
            correct_index: q.correct_index,
            category: q.category,
            difficulty: q.difficulty,
            quiz_id: pub.targetId,
            status: "published",
          },
          { onConflict: "source_url,question" },
        );

        await registerFingerprint({
          engineId: ENGINE_ID,
          sourceUrl,
          body: q.question,
          targetTable: "platform_quiz_questions",
          targetId: pub.targetId,
        });

        await auditPublish({
          runId,
          engineId: ENGINE_ID,
          targetTable: "platform_quiz_questions",
          targetId: pub.targetId,
          sourceUrl,
        });

        stats.items_published++;
      }

      await registerFingerprint({
        engineId: ENGINE_ID,
        sourceUrl,
        body: `quiz:${lesson.id}`,
        targetTable: "lessons",
        targetId: lesson.id,
      });
    }

    await log("publish_or_review", "info", `Quiz: published=${stats.items_published}`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt);
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
