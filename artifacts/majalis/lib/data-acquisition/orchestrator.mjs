import { randomUUID } from "node:crypto";
import { fetchSource, parseFetched } from "./fetch-parse.mjs";
import { extractFields, normalizeExtracted, classifyContent } from "./extract-normalize.mjs";
import { findDuplicateItem, mergeIntoExisting } from "./dedup.mjs";
import { validateItem } from "./validate-score.mjs";
import {
  listSources, listItems, saveItem, createRun, finishRun,
  addLog, addMergeLog, addReviewQueue, updateSourceStats, seedSourcesIfEmpty,
} from "./store.mjs";
import { PIPELINE_STAGES } from "./types.mjs";

/** Run full pipeline for one source — no stage skipping */
export async function runSourcePipeline(source, { triggerType = "cron", existingItems = null } = {}) {
  const started = Date.now();
  const counters = { fetched: 0, extracted: 0, published: 0, duplicates: 0, rejected: 0, review_queued: 0, errors: 0 };
  const errorLog = [];
  const items = existingItems || await listItems({ limit: 5000 });

  const run = await createRun({
    trigger_type: triggerType,
    run_mode: "source",
    source_id: source.id,
    status: "running",
  });

  await addLog({ level: "info", source_id: source.id, run_id: run.id, message: `Pipeline start: ${source.name}` });

  try {
    // 1 Fetch
    const fetchResult = await fetchSource(source);
    if (!fetchResult.ok) {
      counters.errors++;
      errorLog.push({ stage: "fetch", error: fetchResult.error });
      await updateSourceStats(source.id, { status: "error", last_error: fetchResult.error });
      await finishRun(run.id, { status: "failed", errors: 1, error_log: errorLog, duration_ms: Date.now() - started });
      return { ok: false, counters, error: fetchResult.error };
    }
    counters.fetched = 1;

    // 2 Parse
    const parsed = parseFetched(source, fetchResult);
    if (!parsed.ok) {
      counters.errors++;
      errorLog.push({ stage: "parse", error: parsed.error });
    }
    const records = parsed.records || [];

    for (const record of records) {
      try {
        // 3 Extract
        let item = extractFields(source, record);
        if (!item.title) { counters.rejected++; continue; }
        counters.extracted++;

        // 4 Normalize
        item = normalizeExtracted(item);

        // 5 Classify
        item.content_type = classifyContent(source, item);

        // 6 Dedup
        const dup = findDuplicateItem({ ...item, source_id: source.id }, items);
        if (dup.duplicate) {
          counters.duplicates++;
          const merged = mergeIntoExisting(dup.match, item);
          await saveItem({ ...merged, status: dup.match.status || "merged" });
          await addMergeLog({
            kept_item_id: dup.match.id,
            merged_item_id: null,
            merge_reason: dup.reason,
            similarity_score: dup.score,
          });
          continue;
        }

        // 7 Validate + 8 Score
        const validation = validateItem(source, item);
        item.quality_score = validation.quality_score;
        item.review_reasons = validation.reviewReasons;
        item.needs_review = validation.needs_review;
        item.id = randomUUID();
        item.source_id = source.id;
        item.status = validation.canAutoPublish ? "published" : validation.needs_review ? "review" : "extracted";
        item.pipeline_stage = PIPELINE_STAGES[PIPELINE_STAGES.length - 1];
        item.attribution = source.name;

        if (validation.errors.length) {
          counters.rejected++;
          item.status = "rejected";
          item.review_reasons = [...(item.review_reasons || []), ...validation.errors];
        } else if (item.status === "published") {
          counters.published++;
          item.published_at = new Date().toISOString();
        } else if (item.status === "review") {
          counters.review_queued++;
          await addReviewQueue({ item_id: item.id, reason: item.review_reasons.join(", "), priority: 100 - item.quality_score });
        }

        // 9 Review queue (handled above) + 10 Publish
        const saved = await saveItem(item);
        if (saved.ok) items.unshift(saved.item);
      } catch (err) {
        counters.errors++;
        errorLog.push({ stage: "item", error: err.message });
      }
    }

    await updateSourceStats(source.id, {
      status: "active",
      last_success_at: new Date().toISOString(),
      last_error: null,
      items_extracted_total: (source.items_extracted_total || 0) + counters.extracted,
      items_published_total: (source.items_published_total || 0) + counters.published,
    });

    await finishRun(run.id, {
      status: counters.errors ? "partial" : "completed",
      ...counters,
      duration_ms: Date.now() - started,
      error_log: errorLog,
    });

    return { ok: true, counters, records: records.length };
  } catch (err) {
    await finishRun(run.id, { status: "failed", errors: 1, error_log: [{ error: err.message }], duration_ms: Date.now() - started });
    return { ok: false, error: err.message, counters };
  }
}

export async function runAcquisitionEngine({ mode = "hourly", sourceId = null, triggerType = "cron" } = {}) {
  await seedSourcesIfEmpty();
  const allSources = await listSources({ activeOnly: mode !== "retry" });
  let sources = allSources.filter((s) => s.status === "active" || (mode === "retry" && s.status === "error"));

  if (sourceId) sources = sources.filter((s) => s.id === sourceId || s.slug === sourceId);

  const existingItems = await listItems({ limit: 5000 });
  const totals = { fetched: 0, extracted: 0, published: 0, duplicates: 0, rejected: 0, review_queued: 0, errors: 0, sources: sources.length };

  const run = await createRun({ trigger_type: triggerType, run_mode: mode, status: "running" });
  const started = Date.now();

  for (const source of sources) {
    const result = await runSourcePipeline(source, { triggerType, existingItems });
    if (result.counters) {
      for (const k of Object.keys(totals)) {
        if (k in result.counters) totals[k] += result.counters[k];
      }
    }
    if (!result.ok) totals.errors++;
  }

  await finishRun(run.id, {
    status: totals.errors ? "partial" : "completed",
    fetched: totals.fetched,
    extracted: totals.extracted,
    published: totals.published,
    duplicates: totals.duplicates,
    rejected: totals.rejected,
    review_queued: totals.review_queued,
    errors: totals.errors,
    duration_ms: Date.now() - started,
  });

  return { ok: true, runId: run.id, totals };
}

export async function runDedupCleanup() {
  const items = await listItems({ limit: 10000 });
  let merged = 0;
  const kept = [];
  for (const item of items) {
    const dup = findDuplicateItem(item, kept);
    if (dup.duplicate) {
      merged++;
      await addMergeLog({ kept_item_id: dup.match.id, merged_item_id: item.id, merge_reason: "daily_cleanup", similarity_score: dup.score });
      await saveItem({ ...item, status: "merged", merged_into_id: dup.match.id });
    } else {
      kept.push(item);
    }
  }
  return { merged, total: items.length };
}
