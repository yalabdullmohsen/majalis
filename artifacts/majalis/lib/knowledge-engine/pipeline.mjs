/**
 * Knowledge Pipeline — orchestrates full crawl → analyze → verify → dedup → publish → index flow.
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";
import { OFFICIAL_SOURCES } from "./sources-registry.mjs";
import { crawlAllSources, hashContent } from "./crawler.mjs";
import { analyzeBatch } from "./ai-analyzer.mjs";
import {
  verifySource,
  scoreQuality,
  detectDuplicates,
  contentHash,
} from "./quality.mjs";
import { publishBatch } from "./publisher.mjs";
import { indexAndEmbed } from "./indexer.mjs";

function log(scope, data) {
  console.info(`[knowledge-pipeline:${scope}]`, JSON.stringify({ at: new Date().toISOString(), ...data }));
}

async function ensureSources(admin) {
  for (const src of OFFICIAL_SOURCES) {
    await admin.from("knowledge_official_sources").upsert(
      {
        slug: src.slug,
        name: src.name,
        country: src.country,
        entity_type: src.entity_type,
        official_url: src.official_url,
        rss_url: src.rss_url || null,
        trust_level: src.trust_level,
        allowed_kinds: src.allowed_kinds,
        crawl_interval_h: src.crawl_interval_h,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    );
  }
}

async function loadExistingHashes(admin) {
  const { data } = await admin
    .from("knowledge_items")
    .select("content_hash, raw_title, ai_title, id");
  return {
    hashes: new Set((data || []).map((r) => r.content_hash).filter(Boolean)),
    items: data || [],
  };
}

async function loadSourceMap(admin) {
  const { data } = await admin.from("knowledge_official_sources").select("*");
  const map = {};
  for (const row of data || []) map[row.slug] = row;
  return map;
}

export async function runKnowledgePipeline(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, message: "Supabase admin غير مهيأ", usingSeed: true };
  }

  const triggerType = options.triggerType || "cron";
  const maxItems = options.maxItems || 30;
  const skipPublish = options.skipPublish || false;

  let runId = null;
  try {
    await ensureSources(admin);

    const { data: runRow, error: runErr } = await admin
      .from("knowledge_pipeline_runs")
      .insert({ trigger_type: triggerType, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();

    if (runErr && isMissingTableError(runErr)) {
      return runKnowledgePipelineSeedOnly(options);
    }
    if (runErr) throw runErr;
    runId = runRow.id;

    const sourceMap = await loadSourceMap(admin);
    const { hashes, items: existingItems } = await loadExistingHashes(admin);

    const { items: crawled, errors: crawlErrors } = await crawlAllSources(
      OFFICIAL_SOURCES.filter((s) => s.is_active !== false),
      hashes,
    );

    const toProcess = crawled.slice(0, maxItems);
    log("crawled", { count: toProcess.length, errors: crawlErrors.length });

    const analyzed = await analyzeBatch(toProcess, 2);
    const processed = [];

    for (const item of analyzed) {
      const source = sourceMap[item.source_slug] || {};
      const verification = verifySource(item, source);
      const quality = scoreQuality(item, item.analysis, verification);
      const h = item.content_hash || contentHash(item.raw_title, item.raw_body, item.raw_url);
      const dup = detectDuplicates({ ...item, content_hash: h, ai_title: item.analysis?.ai_title }, existingItems);

      const record = {
        source_id: source.id || null,
        pipeline_run_id: runId,
        external_id: item.external_id,
        content_kind: item.content_kind,
        raw_url: item.raw_url,
        raw_title: item.raw_title,
        raw_body: item.raw_body,
        raw_payload: item.raw_payload || {},
        content_hash: h,
        source_attribution: item.source_attribution,
        source_url: item.raw_url || item.source_url,
        ...item.analysis,
        quality_score: quality.quality_score,
        completeness_score: quality.completeness_score,
        trust_score: quality.trust_score,
        verification_status: dup.isDuplicate ? "duplicate" : quality.verification_status,
        publish_status: dup.isDuplicate ? "rejected" : "pending",
        pipeline_stage: dup.isDuplicate ? "rejected" : "analyzed",
        duplicate_of: dup.duplicate_of,
        duplicate_score: dup.duplicate_score,
        can_publish: quality.can_publish && !dup.isDuplicate,
        updated_at: new Date().toISOString(),
      };

      if (item.analysis?.needs_human_review) {
        record.verification_status = "needs_review";
        record.can_publish = false;
      }

      const { data: inserted, error: insErr } = await admin
        .from("knowledge_items")
        .upsert(record, { onConflict: "source_id,external_id" })
        .select("*")
        .single();

      if (insErr) {
        log("insert-error", { error: insErr.message, external_id: item.external_id });
        continue;
      }

      processed.push({ ...inserted, analysis: item.analysis });
      existingItems.push(inserted);
    }

    let publishResult = { published: 0, review: 0, failed: 0 };
    if (!skipPublish) {
      const publishable = processed.filter((p) => p.can_publish);
      publishResult = await publishBatch(admin, publishable);

      for (const p of publishable) {
        const pub = publishResult.details.find((d) => d.id === p.external_id);
        if (pub?.published) {
          await admin.from("knowledge_items").update({
            publish_status: "published",
            pipeline_stage: "published",
            target_table: pub.target_table,
            target_record_id: pub.target_record_id,
            published_at: new Date().toISOString(),
          }).eq("id", p.id);

          await indexAndEmbed(admin, p);
        }
      }
    }

    const reviewCount = processed.filter((p) => p.verification_status === "needs_review").length;
    const dupCount = processed.filter((p) => p.verification_status === "duplicate").length;

    await admin.from("knowledge_pipeline_runs").update({
      status: crawlErrors.length ? "partial" : "completed",
      finished_at: new Date().toISOString(),
      fetched_count: toProcess.length,
      analyzed_count: processed.length,
      published_count: publishResult.published,
      rejected_count: publishResult.failed,
      duplicate_count: dupCount,
      review_count: reviewCount,
      error_count: crawlErrors.length,
      summary: { crawlErrors: crawlErrors.slice(0, 5), publishResult },
    }).eq("id", runId);

    for (const src of OFFICIAL_SOURCES) {
      if (sourceMap[src.slug]) {
        await admin.from("knowledge_official_sources").update({
          last_crawled_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          items_fetched: toProcess.filter((i) => i.source_slug === src.slug).length,
        }).eq("slug", src.slug);
      }
    }

    return {
      ok: true,
      run_id: runId,
      fetched: toProcess.length,
      analyzed: processed.length,
      published: publishResult.published,
      review: reviewCount,
      duplicates: dupCount,
      rejected: publishResult.failed,
      errors: crawlErrors,
    };
  } catch (err) {
    log("fatal", { error: String(err.message || err) });
    if (runId) {
      await admin.from("knowledge_pipeline_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_log: [{ error: String(err.message || err) }],
      }).eq("id", runId);
    }
    if (isMissingTableError(err)) {
      return runKnowledgePipelineSeedOnly(options);
    }
    return { ok: false, message: String(err.message || err) };
  }
}

/** Fallback when DB tables not migrated yet — processes seeds in-memory */
async function runKnowledgePipelineSeedOnly(options = {}) {
  const { items: crawled } = await crawlAllSources(
    OFFICIAL_SOURCES.filter((s) => s.seed_only),
    new Set(),
  );
  const analyzed = await analyzeBatch(crawled.slice(0, options.maxItems || 20), 2);
  let published = 0;
  let review = 0;
  for (const item of analyzed) {
    const verification = verifySource(item, { trust_level: 5 });
    const quality = scoreQuality(item, item.analysis, verification);
    if (quality.can_publish) published++;
    else review++;
  }
  return {
    ok: true,
    usingSeed: true,
    message: "جداول knowledge_engine_v12 غير موجودة — تمت المعالجة في الذاكرة فقط",
    fetched: crawled.length,
    analyzed: analyzed.length,
    published,
    review,
    duplicates: 0,
    rejected: 0,
  };
}

export async function getKnowledgePipelineStats(days = 7) {
  const admin = getSupabaseAdmin();
  if (!admin) return { usingSeed: true, stats: null };

  const { data, error } = await admin.rpc("knowledge_pipeline_stats", { days });
  if (error) {
    if (isMissingTableError(error)) return { usingSeed: true, stats: null };
    return { error: error.message, stats: null };
  }
  return { stats: data, usingSeed: false };
}
