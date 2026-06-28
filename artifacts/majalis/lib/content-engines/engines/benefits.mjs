/**
 * Benefits Extraction Engine — from published lessons/articles → fawaid.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { extractBenefitsFromSource } from "../ai-extractors.mjs";
import { scoreBenefit } from "../quality-gate.mjs";
import { checkFingerprint, registerFingerprint } from "../dedup.mjs";
import { enqueueReview } from "../review-queue.mjs";
import { startEngineRun, finishEngineRun, createRunLogger, auditPublish } from "../run-manager.mjs";
import { publishToTarget } from "../../content-production/publisher.mjs";
import { isInCurrentMonth } from "../sync-window.mjs";
import { CRON_BUDGET_MS, cronMaxItems, budgetExceeded } from "../budget.mjs";

const ENGINE_ID = "benefits";

export async function run({ runType = "incremental", maxItems = 10, lessonId, budgetMs = CRON_BUDGET_MS } = {}) {
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
      .select("id, title, description, category, source_url, speaker_name, status, created_at, updated_at")
      .eq("status", "approved")
      .order("updated_at", { ascending: false })
      .limit(cronMaxItems(runType, maxItems, 2));

    if (lessonId) query = query.eq("id", lessonId);

    const { data: lessons } = await query;
    stats.items_fetched = lessons?.length || 0;

    if (!lessons?.length) {
      await finishEngineRun(runId, ENGINE_ID, stats, startedAt, {
        report: { outcome: "no_content", message: "no_approved_lessons" },
      });
      return { ok: true, engineId: ENGINE_ID, runId, stats, outcome: "no_content", message: "no_approved_lessons" };
    }

    for (const lesson of lessons) {
      if (budgetExceeded(startedAt, budgetMs)) break;
      const body = lesson.description || lesson.title || "";
      if (!body || body.length < 30) {
        stats.items_rejected++;
        continue;
      }

      stats.items_parsed++;

      const sourceUrl = lesson.source_url || `lesson://${lesson.id}`;
      const dup = await checkFingerprint({ engineId: ENGINE_ID, sourceUrl, body: `benefits:${lesson.id}` });
      if (dup.isDuplicate) {
        stats.items_duplicate++;
        continue;
      }

      const extracted = await extractBenefitsFromSource({
        title: lesson.title,
        body,
        sourceUrl,
        sourceName: lesson.speaker_name || "المجلس العلمي",
        scholar: lesson.speaker_name,
      });

      stats.items_enriched++;

      if (!extracted.benefits?.length) {
        await log("outcome", "info", "no_content", {
          metadata: { outcome: "no_content", lessonId: lesson.id, reason: "no_benefits_extracted" },
        });
        continue;
      }

      for (const benefit of extracted.benefits) {
        const quality = scoreBenefit(benefit.text);
        if (quality < 60) {
          stats.items_rejected++;
          continue;
        }

        const benefitDup = await checkFingerprint({
          engineId: ENGINE_ID,
          sourceUrl,
          body: benefit.text,
        });
        if (benefitDup.isDuplicate) {
          stats.items_duplicate++;
          continue;
        }

        if (extracted.needs_review || quality < 70) {
          await admin.from("content_engine_generated_benefits").upsert(
            {
              run_id: runId,
              source_type: "lesson",
              source_id: lesson.id,
              source_url: sourceUrl,
              text: benefit.text,
              author_name: benefit.author_name,
              category: lesson.category,
              quality_score: quality,
              status: "review",
            },
            { onConflict: "source_url,text" },
          );
          await enqueueReview({
            engineId: ENGINE_ID,
            runId,
            item: { text: benefit.text, source_url: sourceUrl },
            reason: "low_quality",
            sourceType: "lesson",
          });
          stats.items_review++;
          continue;
        }

        const pub = await publishToTarget(admin, "fawaid", {
          text: benefit.text,
          author_name: benefit.author_name,
          source_url: sourceUrl,
          source_name: lesson.speaker_name || "المجلس العلمي",
          metadata: { lesson_id: lesson.id, engine: ENGINE_ID },
        });

        await admin.from("content_engine_generated_benefits").upsert(
          {
            run_id: runId,
            source_type: "lesson",
            source_id: lesson.id,
            source_url: sourceUrl,
            text: benefit.text,
            author_name: benefit.author_name,
            category: lesson.category,
            quality_score: quality,
            fawaid_id: pub.targetId,
            status: "published",
          },
          { onConflict: "source_url,text" },
        );

        await registerFingerprint({
          engineId: ENGINE_ID,
          sourceUrl,
          body: benefit.text,
          targetTable: "fawaid",
          targetId: pub.targetId,
        });

        await auditPublish({
          runId,
          engineId: ENGINE_ID,
          targetTable: "fawaid",
          targetId: pub.targetId,
          sourceUrl,
          metadata: { lesson_id: lesson.id },
        });

        stats.items_published++;
      }

      await registerFingerprint({
        engineId: ENGINE_ID,
        sourceUrl,
        body: `benefits:${lesson.id}`,
        targetTable: "lessons",
        targetId: lesson.id,
      });
    }

    await log("publish_or_review", "info", `Benefits: published=${stats.items_published} review=${stats.items_review}`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt);
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
