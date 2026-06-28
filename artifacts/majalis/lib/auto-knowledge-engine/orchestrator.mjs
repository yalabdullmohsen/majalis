/**
 * Auto Knowledge Engine — Main Orchestrator
 * Independent connectors · Queue · Retry · Auto-publish · Monitoring
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";
import { analyzeBatch } from "../knowledge-engine/ai-analyzer.mjs";
import { publishItem } from "../knowledge-engine/publisher.mjs";
import { indexAndEmbed } from "../knowledge-engine/indexer.mjs";
import { recommendRelated } from "../knowledge-engine/recommendations.mjs";
import { createConnector } from "./connectors/index.mjs";
import { verifyBatch, verifyUrlAlive } from "./verification.mjs";
import { runQualityGate } from "./quality-gate.mjs";
import { buildSeoPackage, routeForKind, persistSeoCache } from "./seo-engine.mjs";
import { akeLog, auditLog } from "./monitoring.mjs";
import { dbCacheGet, dbCacheSet } from "./cache.mjs";
import { OFFICIAL_SOURCES } from "../knowledge-engine/sources-registry.mjs";
import { ensureAkeRpcFunctions } from "./rpc-probe.mjs";

async function ensureOfficialSources(admin) {
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

async function loadConnectors(admin) {
  const cacheKey = "ake:connectors:active";
  const cached = await dbCacheGet(admin, cacheKey);
  if (cached) return cached;

  const { data, error } = await admin
    .from("ake_connectors")
    .select("*")
    .eq("is_active", true)
    .order("trust_level", { ascending: false });

  if (error && isMissingTableError(error)) {
    return OFFICIAL_SOURCES.map((s) => ({
      slug: s.slug,
      name: s.name,
      connector_type: s.manifest_file ? "manifest" : s.seed_only ? "seed" : s.rss_url ? "rss" : "inactive",
      official_url: s.official_url,
      feed_url: s.rss_url,
      trust_level: s.trust_level,
      allowed_kinds: s.allowed_kinds,
      auto_publish: true,
      is_active: s.is_active !== false,
      api_config: s.manifest_file ? { manifest_file: s.manifest_file } : {},
    }));
  }

  const connectors = data || [];
  await dbCacheSet(admin, cacheKey, connectors, 120_000);
  return connectors;
}

async function loadExistingItems(admin) {
  const { data } = await admin
    .from("knowledge_items")
    .select("id, content_hash, raw_title, ai_title, external_id, publish_status")
    .is("deleted_at", null)
    .limit(5000);
  return data || [];
}

async function updateConnectorHealth(admin, connector, result, health) {
  if (!admin || !connector.id) return;
  try {
    await admin.from("ake_connectors").update({
      health_status: health?.healthy ? "healthy" : result.ok ? "degraded" : "down",
      last_health_check: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      last_success_at: result.ok ? new Date().toISOString() : connector.last_success_at,
      last_error: result.error || null,
      items_total: (connector.items_total || 0) + (result.items?.length || 0),
      updated_at: new Date().toISOString(),
    }).eq("id", connector.id);
  } catch {
    /* ignore */
  }
}

async function resolveSourceId(admin, slug) {
  const { data } = await admin
    .from("knowledge_official_sources")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id || null;
}

async function processConnector(admin, connectorConfig, runId, existingItems, options) {
  const connector = createConnector(connectorConfig);
  const sourceId = connectorConfig.source_id || await resolveSourceId(admin, connectorConfig.slug);
  connectorConfig = { ...connectorConfig, source_id: sourceId };
  const stats = {
    fetched: 0,
    parsed: 0,
    processed: 0,
    published: 0,
    rejected: 0,
    duplicate: 0,
    review: 0,
    rejectionReasons: {},
    gateFailures: {},
    errors: [],
  };

  function noteRejection(reason) {
    stats.rejected++;
    stats.rejectionReasons[reason] = (stats.rejectionReasons[reason] || 0) + 1;
  }

  function noteGateFailure(failedChecks) {
    for (const check of failedChecks || []) {
      stats.gateFailures[check] = (stats.gateFailures[check] || 0) + 1;
    }
  }

  try {
    const health = await connector.healthCheck();
    const fetchResult = await connector.run();
    stats.fetched = fetchResult.items?.length || 0;

    if (fetchResult.skipped) {
      await updateConnectorHealth(admin, connectorConfig, fetchResult, health);
      return stats;
    }

    const knownHashes = new Set(existingItems.map((i) => i.content_hash).filter(Boolean));
    const newItems = (fetchResult.items || []).filter((item) => {
      const key = `${item.external_id}`;
      return !existingItems.some((e) => e.external_id === key);
    });

    const verified = await verifyBatch(newItems, connectorConfig, existingItems, {
      checkLinks: options.checkLinks || false,
    });

    const maxItemsPerConnector = options.maxItemsPerConnector ?? (options.triggerType === "cron" ? 5 : 30);
    const toAnalyze = verified.filter((v) => !v.verification.isDuplicate).slice(0, maxItemsPerConnector);
    stats.duplicate = verified.filter((v) => v.verification.isDuplicate).length;
    stats.parsed = toAnalyze.filter((v) => v.verification.sourceVerified).length;
    if (stats.duplicate > 0) {
      stats.rejectionReasons.duplicate = stats.duplicate;
    }

    const analyzed = await analyzeBatch(toAnalyze, 2);
    const processed = [];

    for (const item of analyzed) {
      const gate = runQualityGate(item, item.analysis, item.verification, connectorConfig);
      const seo = buildSeoPackage(item, item.analysis, routeForKind(item.content_kind, item.external_id));

      const record = {
        source_id: connectorConfig.source_id || null,
        pipeline_run_id: runId,
        external_id: item.external_id,
        content_kind: item.content_kind,
        raw_url: item.raw_url,
        raw_title: item.raw_title,
        raw_body: item.raw_body,
        raw_payload: item.raw_payload || {},
        content_hash: item.verification.contentHash,
        source_attribution: item.source_attribution,
        source_url: item.raw_url,
        ...item.analysis,
        seo_title: seo.title,
        seo_description: seo.description,
        og_description: seo.og_description,
        twitter_description: seo.twitter_description,
        structured_data: seo.json_ld,
        quality_score: gate.quality_score,
        completeness_score: gate.completeness_score,
        trust_score: item.verification.trustScore,
        verification_status: gate.verificationStatus,
        publish_status: gate.autoPublish && gate.canPublish ? "pending" : "pending",
        pipeline_stage: gate.autoPublish ? "ready_to_publish" : "analyzed",
        duplicate_of: item.verification.duplicateOf,
        duplicate_score: item.verification.duplicateScore,
        can_publish: gate.canPublish,
        version: 1,
        updated_at: new Date().toISOString(),
      };

      if (item.verification.isDuplicate) {
        stats.duplicate++;
        continue;
      }

      if (!gate.passed && !gate.canPublish) {
        noteRejection("quality_gate");
        noteGateFailure(gate.failedChecks);
      } else if (!gate.passed) {
        noteGateFailure(gate.failedChecks);
      }

      const { data: inserted, error: insErr } = await admin
        .from("knowledge_items")
        .upsert(record, { onConflict: "source_id,external_id" })
        .select("*")
        .single();

      if (insErr) {
        stats.errors.push(insErr.message);
        await auditLog(admin, {
          runId,
          connectorId: connectorConfig.id,
          action: "insert_failed",
          status: "error",
          message: insErr.message,
          entityId: item.external_id,
        });
        continue;
      }

      stats.processed++;
      processed.push({ ...inserted, analysis: item.analysis, gate, seo });

      if (gate.autoPublish && gate.canPublish) {
        const pub = await publishItem(admin, { ...inserted, can_publish: true, verification_status: "verified" }, item.analysis);
        if (pub.published) {
          stats.published++;
          await admin.from("knowledge_items").update({
            publish_status: "published",
            pipeline_stage: "published",
            target_table: pub.target_table,
            target_record_id: pub.target_record_id,
            published_at: new Date().toISOString(),
          }).eq("id", inserted.id);

          await indexAndEmbed(admin, inserted);
          await persistSeoCache(admin, `${pub.target_table}:${pub.target_record_id}`, seo);
        } else {
          stats.review++;
          noteRejection(pub.reason || "publish_failed");
          await auditLog(admin, {
            runId,
            connectorId: connectorConfig.id,
            action: "publish_skipped",
            status: "warning",
            message: pub.reason || "publish_failed",
            entityId: item.external_id,
            details: { failedChecks: gate.failedChecks, table: pub.table },
          });
        }
      } else {
        stats.review++;
        if (!gate.autoPublish) {
          noteRejection(gate.autoPublish === false ? "auto_publish_disabled" : "quality_gate_review");
        }
      }
    }

    await updateConnectorHealth(admin, connectorConfig, { ok: true, items: fetchResult.items }, health);

    await auditLog(admin, {
      runId,
      connectorId: connectorConfig.id,
      action: "connector_sync",
      status: "success",
      message: `${connector.slug}: ${stats.published} published, ${stats.review} review`,
      details: stats,
    });
  } catch (err) {
    stats.errors.push(err.message);
    await updateConnectorHealth(admin, connectorConfig, { ok: false, error: err.message }, { healthy: false });
    await auditLog(admin, {
      runId,
      connectorId: connectorConfig.id,
      action: "connector_sync",
      status: "error",
      message: err.message,
    });
  }

  return stats;
}

export async function runAutoKnowledgeEngine(options = {}) {
  const started = Date.now();
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "Supabase not configured" };
  }

  const triggerType = options.triggerType || "cron";
  const maxConnectors = options.maxConnectors || 20;
  const checkLinks = options.checkLinks || false;
  const connectorSlug = options.connectorSlug || null;

  let runId = null;
  try {
    await ensureOfficialSources(admin);

    const { data: runRow } = await admin
      .from("ake_engine_runs")
      .insert({ trigger_type: triggerType, status: "running" })
      .select("id")
      .single();
    runId = runRow?.id || null;
  } catch {
    /* table may not exist */
  }

  let connectors = await loadConnectors(admin);
  if (connectorSlug) connectors = connectors.filter((c) => c.slug === connectorSlug);
  connectors = connectors.slice(0, maxConnectors);

  const existingItems = await loadExistingItems(admin);

  const totals = {
    connectorsTotal: connectors.length,
    connectorsOk: 0,
    connectorsFailed: 0,
    fetched: 0,
    parsed: 0,
    processed: 0,
    published: 0,
    rejected: 0,
    duplicate: 0,
    review: 0,
    rejectionReasons: {},
    gateFailures: {},
    errors: [],
  };

  for (const connectorConfig of connectors) {
    if (connectorConfig.connector_type === "inactive") continue;

    akeLog("orchestrator", { action: "start_connector", slug: connectorConfig.slug });
    const result = await processConnector(admin, connectorConfig, runId, existingItems, {
      checkLinks,
      maxItemsPerConnector: options.maxItemsPerConnector,
      triggerType,
    });

    totals.fetched += result.fetched;
    totals.parsed += result.parsed || 0;
    totals.processed += result.processed;
    totals.published += result.published;
    totals.rejected += result.rejected;
    totals.duplicate += result.duplicate;
    totals.review += result.review;
    totals.errors.push(...result.errors);
    for (const [k, v] of Object.entries(result.rejectionReasons || {})) {
      totals.rejectionReasons[k] = (totals.rejectionReasons[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(result.gateFailures || {})) {
      totals.gateFailures[k] = (totals.gateFailures[k] || 0) + v;
    }

    if (result.errors.length === 0 || result.processed > 0) totals.connectorsOk++;
    else totals.connectorsFailed++;
  }

  const durationMs = Date.now() - started;

  if (runId) {
    try {
      await admin.from("ake_engine_runs").update({
        status: totals.connectorsFailed > 0 && totals.connectorsOk === 0 ? "failed" : "completed",
        connectors_total: totals.connectorsTotal,
        connectors_ok: totals.connectorsOk,
        connectors_failed: totals.connectorsFailed,
        fetched_count: totals.fetched,
        processed_count: totals.processed,
        published_count: totals.published,
        rejected_count: totals.rejected,
        duplicate_count: totals.duplicate,
        review_count: totals.review,
        error_count: totals.errors.length,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
        summary: {
          errors: totals.errors.slice(0, 10),
          rejectionReasons: totals.rejectionReasons,
          gateFailures: totals.gateFailures,
        },
      }).eq("id", runId);
    } catch {
      /* ignore */
    }
  }

  try {
    await admin.from("ake_statistics").upsert({
      snapshot_date: new Date().toISOString().slice(0, 10),
      connectors_active: totals.connectorsTotal,
      connectors_healthy: totals.connectorsOk,
      items_new: totals.processed,
      items_published: totals.published,
      items_rejected: totals.rejected,
      items_review: totals.review,
      avg_duration_ms: durationMs,
      details: totals,
    }, { onConflict: "snapshot_date" });
  } catch {
    /* ignore */
  }

  return {
    ok: true,
    runId,
    ...totals,
    durationMs,
  };
}

export async function runConnectorHealthChecks() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "Supabase not configured" };

  const connectors = await loadConnectors(admin);
  const results = [];

  for (const config of connectors) {
    const connector = createConnector(config);
    const health = await connector.healthCheck();
    let brokenLinks = 0;

    if (config.id) {
      await admin.from("ake_connectors").update({
        health_status: health.healthy ? "healthy" : "down",
        last_health_check: health.checkedAt,
        updated_at: new Date().toISOString(),
      }).eq("id", config.id);
    }

    results.push({ slug: config.slug, ...health, brokenLinks });
  }

  return { ok: true, results, checked: results.length };
}

export async function getAutoKnowledgeEngineStats(days = 7) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, stats: null };

  const cacheKey = `ake:stats:${days}`;
  const cached = await dbCacheGet(admin, cacheKey);
  if (cached && !cached._fallback) return { ok: true, stats: cached, usingLegacy: false };

  let { data, error } = await admin.rpc("ake_engine_stats", { p_days: days });
  if (error) {
    const repair = await ensureAkeRpcFunctions().catch(() => null);
    if (repair?.ok) {
      ({ data, error } = await admin.rpc("ake_engine_stats", { p_days: days }));
    }
  }

  const { error: tableProbe } = await admin.from("ake_connectors").select("id", { count: "exact", head: true });
  const v13TablesPresent = !tableProbe || !isMissingTableError(tableProbe);

  if (error) {
    if (v13TablesPresent) {
      const fallback = await buildAkeStatsFallback(admin, days);
      return { ok: true, stats: fallback, usingLegacy: false, rpcError: error.message };
    }
    if (isMissingTableError(error)) {
      const { getKnowledgePipelineStats } = await import("../knowledge-engine/pipeline.mjs");
      const legacy = await getKnowledgePipelineStats(days);
      return { ok: true, stats: legacy.stats, usingLegacy: true };
    }
    return { ok: false, error: error.message, usingLegacy: !v13TablesPresent };
  }

  await dbCacheSet(admin, cacheKey, data, 60_000);
  return { ok: true, stats: data, usingLegacy: false };
}

async function buildAkeStatsFallback(admin, days) {
  const [{ count: connectorsActive }, { count: connectorsTotal }, { data: runs }] = await Promise.all([
    admin.from("ake_connectors").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("ake_connectors").select("id", { count: "exact", head: true }),
    admin.from("ake_engine_runs").select("id,status,trigger_type,published_count,fetched_count,duration_ms,started_at").order("started_at", { ascending: false }).limit(10),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const { count: itemsNewToday } = await admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("created_at", today);
  const { count: itemsPublishedToday } = await admin
    .from("knowledge_items")
    .select("id", { count: "exact", head: true })
    .gte("published_at", today)
    .eq("publish_status", "published");

  return {
    connectors_active: connectorsActive || 0,
    connectors_total: connectorsTotal || 0,
    connectors_healthy: 0,
    items_new_today: itemsNewToday || 0,
    items_published_today: itemsPublishedToday || 0,
    runs_recent: runs || [],
    _fallback: true,
    _note: "ake_engine_stats RPC unavailable — run GRANT on function or re-apply auto_knowledge_engine_v13.sql",
  };
}

export async function getPublicRecommendations(admin, { kind, recordId, limit = 8 }) {
  let source = null;
  if (recordId) {
    const { data } = await admin.from("knowledge_items").select("*").eq("target_record_id", recordId).eq("publish_status", "published").maybeSingle();
    source = data;
  }

  const { data: candidates } = await admin
    .from("knowledge_items")
    .select("id, content_kind, ai_title, ai_summary, ai_category, ai_topic, ai_scholar, ai_keywords, quality_score, trust_score, verification_status, target_record_id, source_url, raw_url")
    .eq("publish_status", "published")
    .is("deleted_at", null)
    .limit(100);

  if (!source && kind) {
    source = (candidates || []).find((c) => c.content_kind === kind);
  }
  if (!source) return { items: [], algorithm: "none" };

  const items = recommendRelated(source, candidates || [], limit);
  return {
    items: items.map((i) => ({
      id: i.id,
      title: i.ai_title,
      summary: i.ai_summary,
      category: i.ai_category,
      kind: i.content_kind,
      score: i.relevance_score,
      url: i.source_url || i.raw_url,
      record_id: i.target_record_id,
    })),
    algorithm: "hybrid_v2",
    source_title: source.ai_title,
  };
}

export async function archiveStaleContent(admin, daysOld = 365) {
  const cutoff = new Date(Date.now() - daysOld * 86_400_000).toISOString();
  const { data } = await admin
    .from("knowledge_items")
    .update({ archived_at: new Date().toISOString(), publish_status: "archived" })
    .eq("publish_status", "published")
    .lt("published_at", cutoff)
    .is("archived_at", null)
    .select("id");
  return { archived: (data || []).length };
}
