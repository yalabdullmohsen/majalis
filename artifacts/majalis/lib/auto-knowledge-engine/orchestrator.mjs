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
import { dbCacheGet, dbCacheSet, cacheClear } from "./cache.mjs";
import { OFFICIAL_SOURCES } from "../knowledge-engine/sources-registry.mjs";
import { buildKnowledgeItemRecord, analysisFromKnowledgeRow } from "./knowledge-item-record.mjs";
import { ensureAkeRpcFunctions } from "./rpc-probe.mjs";
import {
  currentMonthKey,
  buildConnectorSyncWindow,
  resolveConnectorImportMode,
  startOfCurrentMonthUtc,
} from "./sync-window.mjs";
import {
  loadGlobalSyncState,
  resolveRunImportMode,
  markConnectorBackfillComplete,
  updateConnectorSyncCursor,
  finalizeRunSyncState,
  shouldCompleteConnectorBackfill,
} from "./sync-state.mjs";

async function ensureSyncSchema(admin) {
  const { error } = await admin.from("ake_sync_state").select("id", { head: true, count: "exact" });
  if (!error) return { ok: true, skipped: true };
  if (!isMissingTableError(error)) return { ok: true, skipped: true };
  try {
    const { applyMigrations } = await import("../db-migrate.mjs");
    return await applyMigrations({
      files: ["auto_knowledge_engine_v14_sync.sql"],
      continueOnError: false,
      trackApplied: true,
    });
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

async function ensureFiqhCouncilTable(admin) {
  const { error } = await admin.from("fiqh_council_items").select("id", { head: true, count: "exact" });
  if (!error || !isMissingTableError(error)) return { ok: true, skipped: true };
  try {
    const { applyMigrations } = await import("../db-migrate.mjs");
    return await applyMigrations({
      files: ["fiqh_council_items_ake_prereq.sql"],
      continueOnError: false,
      trackApplied: true,
    });
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

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

async function loadExistingItems(admin, sourceId = null) {
  let query = admin
    .from("knowledge_items")
    .select("id, content_hash, raw_title, ai_title, external_id, publish_status, raw_url, source_published_at")
    .is("deleted_at", null);

  if (sourceId) {
    query = query.eq("source_id", sourceId);
  }

  const { data } = await query.limit(sourceId ? 10000 : 5000);
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

  const connectorImportMode = resolveConnectorImportMode(
    connectorConfig,
    options.importMode,
    options.monthKey || currentMonthKey(),
  );
  const syncWindow = buildConnectorSyncWindow(connectorConfig, connectorImportMode);
  const maxItemsPerConnector =
    options.maxItemsPerConnector ??
    (options.triggerType === "cron"
      ? connectorImportMode === "backfill"
        ? 10
        : 6
      : 40);

  const syncOptions = {
    importMode: connectorImportMode,
    window: syncWindow,
    limit: maxItemsPerConnector,
    maxItems: maxItemsPerConnector,
    manifestLimit: connectorImportMode === "backfill" ? 200 : 50,
  };

  const stats = {
    fetched: 0,
    rawFetched: 0,
    skippedByDate: 0,
    parsed: 0,
    enriched: 0,
    processed: 0,
    published: 0,
    indexed: 0,
    rejected: 0,
    duplicate: 0,
    review: 0,
    importMode: connectorImportMode,
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
    const fetchResult = await connector.run(syncOptions);
    stats.fetched = fetchResult.items?.length || 0;
    stats.rawFetched = fetchResult.rawCount || stats.fetched;
    stats.skippedByDate = fetchResult.skippedByDate || 0;
    if (fetchResult.error) stats.errors.push(fetchResult.error);

    if (fetchResult.skipped) {
      await updateConnectorHealth(admin, connectorConfig, fetchResult, health);
      return stats;
    }

    const knownHashes = new Set(existingItems.map((i) => i.content_hash).filter(Boolean));
    const newItems = (fetchResult.items || []).filter((item) => {
      const existing = existingItems.find((e) => e.external_id === item.external_id);
      if (!existing) return true;
      return existing.publish_status !== "published";
    });

    const verified = await verifyBatch(newItems, connectorConfig, existingItems, {
      checkLinks: options.checkLinks || false,
    });

    const toProcess = verified.filter((v) => !v.verification.isDuplicate).slice(0, syncOptions.limit);
    stats.duplicate = verified.filter((v) => v.verification.isDuplicate).length;
    stats.parsed = toProcess.filter((v) => v.verification.sourceVerified).length;
    if (stats.duplicate > 0) {
      stats.rejectionReasons.duplicate = stats.duplicate;
    }

    const existingByExternal = new Map(
      existingItems.filter((e) => e.external_id).map((e) => [e.external_id, e]),
    );
    const needsAnalysis = [];
    const retryQueue = [];

    for (const item of toProcess) {
      const existing = existingByExternal.get(item.external_id);
      if (existing?.id && existing.publish_status !== "published") {
        retryQueue.push({ item, existingId: existing.id });
      } else {
        needsAnalysis.push(item);
      }
    }

    const retryAnalyzed = [];
    const retryMissed = [];

    for (const { item, existingId } of retryQueue) {
      const { data: full } = await admin
        .from("knowledge_items")
        .select("*")
        .eq("id", existingId)
        .maybeSingle();
      if (full) {
        retryAnalyzed.push({
          ...item,
          raw_payload: full.raw_payload || item.raw_payload,
          content_kind: full.content_kind || item.content_kind,
          analysis: analysisFromKnowledgeRow(full),
          _existingRow: full,
        });
      } else {
        retryMissed.push(item);
      }
    }

    const analyzed = await analyzeBatch([...needsAnalysis, ...retryMissed], 2);
    const allItems = [...analyzed, ...retryAnalyzed];
    const processed = [];

    for (const item of allItems) {
      const gate = runQualityGate(item, item.analysis, item.verification, connectorConfig);
      const seo = buildSeoPackage(item, item.analysis, routeForKind(item.content_kind, item.external_id));

      const record = buildKnowledgeItemRecord({
        connectorConfig,
        runId,
        item,
        gate,
        seo,
        importMode: connectorImportMode,
      });

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

      let inserted;
      let insErr;
      if (item._existingRow) {
        ({ data: inserted, error: insErr } = await admin
          .from("knowledge_items")
          .update(record)
          .eq("id", item._existingRow.id)
          .select("*")
          .single());
      } else {
        ({ data: inserted, error: insErr } = await admin
          .from("knowledge_items")
          .upsert(record, { onConflict: "source_id,external_id" })
          .select("*")
          .single());
      }

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
      stats.enriched++;
      processed.push({ ...inserted, analysis: item.analysis, gate, seo });

      if (gate.autoPublish && gate.canPublish) {
        const pub = await publishItem(admin, { ...inserted, can_publish: true, verification_status: "verified" }, item.analysis);
        if (pub.published) {
          stats.published++;
          const cmsPublishedAt = inserted.source_published_at || new Date().toISOString();
          await admin.from("knowledge_items").update({
            publish_status: "published",
            pipeline_stage: "published",
            target_table: pub.target_table,
            target_record_id: pub.target_record_id,
            published_at: cmsPublishedAt,
          }).eq("id", inserted.id);

          await indexAndEmbed(admin, inserted);
          stats.indexed++;
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

    await updateConnectorHealth(
      admin,
      connectorConfig,
      { ok: fetchResult.ok !== false, error: fetchResult.error, items: fetchResult.items },
      health,
    );

    if (connectorConfig.id) {
      await admin.from("ake_connectors").update({
        items_published: (connectorConfig.items_published || 0) + stats.published,
      }).eq("id", connectorConfig.id);
    }

    await updateConnectorSyncCursor(admin, connectorConfig, processed.map((p) => ({
      source_published_at: p.source_published_at,
      published_at: p.source_published_at,
    })));

    const monthKey = options.monthKey || currentMonthKey();
    if (shouldCompleteConnectorBackfill(stats, connectorImportMode)) {
      await markConnectorBackfillComplete(admin, connectorConfig, monthKey, stats);
    }

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
  const monthKey = currentMonthKey();

  let runId = null;
  let importMode = options.importMode || "auto";
  let globalState = null;

  try {
    await ensureOfficialSources(admin);
    await ensureFiqhCouncilTable(admin);
    await ensureSyncSchema(admin);

    globalState = await loadGlobalSyncState(admin);
    let connectorsPreview = await loadConnectors(admin);
    if (connectorSlug) connectorsPreview = connectorsPreview.filter((c) => c.slug === connectorSlug);

    importMode = resolveRunImportMode(globalState, connectorsPreview, options);

    const syncWindowFrom =
      importMode === "backfill"
        ? startOfCurrentMonthUtc().toISOString()
        : null;

    const { data: runRow } = await admin
      .from("ake_engine_runs")
      .insert({
        trigger_type: triggerType,
        status: "running",
        import_mode: importMode,
        sync_window_from: syncWindowFrom,
        sync_window_to: new Date().toISOString(),
      })
      .select("id")
      .single();
    runId = runRow?.id || null;
  } catch {
    /* table may not exist */
  }

  let connectors = await loadConnectors(admin);
  if (connectorSlug) connectors = connectors.filter((c) => c.slug === connectorSlug);
  connectors = connectors.slice(0, maxConnectors);

  const totals = {
    importMode,
    monthKey,
    globalBackfillCompleted: globalState?.global_backfill_completed ?? false,
    connectorsTotal: connectors.length,
    connectorsOk: 0,
    connectorsFailed: 0,
    fetched: 0,
    rawFetched: 0,
    skippedByDate: 0,
    parsed: 0,
    enriched: 0,
    processed: 0,
    published: 0,
    indexed: 0,
    rejected: 0,
    duplicate: 0,
    review: 0,
    rejectionReasons: {},
    gateFailures: {},
    connectorResults: [],
    errors: [],
  };

  for (const connectorConfig of connectors) {
    if (connectorConfig.connector_type === "inactive") continue;

    const sourceId = connectorConfig.source_id || await resolveSourceId(admin, connectorConfig.slug);
    const existingItems = await loadExistingItems(admin, sourceId);

    akeLog("orchestrator", {
      action: "start_connector",
      slug: connectorConfig.slug,
      importMode,
    });

    const result = await processConnector(
      admin,
      { ...connectorConfig, source_id: sourceId },
      runId,
      existingItems,
      {
        checkLinks,
        maxItemsPerConnector: options.maxItemsPerConnector,
        triggerType,
        importMode,
        monthKey,
      },
    );

    totals.fetched += result.fetched;
    totals.rawFetched += result.rawFetched || 0;
    totals.skippedByDate += result.skippedByDate || 0;
    totals.parsed += result.parsed || 0;
    totals.enriched += result.enriched || 0;
    totals.processed += result.processed;
    totals.published += result.published;
    totals.indexed += result.indexed || 0;
    totals.rejected += result.rejected;
    totals.duplicate += result.duplicate;
    totals.review += result.review;
    totals.errors.push(...result.errors);
    totals.connectorResults.push({
      slug: connectorConfig.slug,
      importMode: result.importMode,
      ...result,
    });

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
        import_mode: importMode,
        connectors_total: totals.connectorsTotal,
        connectors_ok: totals.connectorsOk,
        connectors_failed: totals.connectorsFailed,
        fetched_count: totals.fetched,
        processed_count: totals.processed,
        published_count: totals.published,
        rejected_count: totals.rejected,
        duplicate_count: totals.duplicate,
        review_count: totals.review,
        enriched_count: totals.enriched,
        indexed_count: totals.indexed,
        skipped_date_count: totals.skippedByDate,
        error_count: totals.errors.length,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
        summary: {
          importMode,
          monthKey,
          errors: totals.errors.slice(0, 10),
          rejectionReasons: totals.rejectionReasons,
          gateFailures: totals.gateFailures,
          connectorResults: totals.connectorResults.map((c) => ({
            slug: c.slug,
            fetched: c.fetched,
            published: c.published,
            importMode: c.importMode,
          })),
        },
      }).eq("id", runId);
    } catch {
      /* ignore */
    }
  }

  await finalizeRunSyncState(admin, globalState, await loadConnectors(admin), { ...totals, runId }, importMode);

  cacheClear("ake:");
  try {
    await admin.from("ake_cache").delete().like("cache_key", "ake:%");
  } catch {
    /* ignore */
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
  const monthStart = startOfCurrentMonthUtc().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: connectorsActive },
    { count: connectorsTotal },
    { data: runs },
    { data: syncState, error: syncStateErr },
    { count: itemsNewToday },
    { count: itemsPublishedToday },
    monthImportedRes,
    monthPublishedRes,
    { count: reviewQueue },
    { count: rejectedCount },
    { count: duplicateCount },
    { data: connectors },
  ] = await Promise.all([
    admin.from("ake_connectors").select("id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("ake_connectors").select("id", { count: "exact", head: true }),
    admin.from("ake_engine_runs").select("id,status,trigger_type,import_mode,published_count,fetched_count,enriched_count,indexed_count,duration_ms,started_at").order("started_at", { ascending: false }).limit(10),
    admin.from("ake_sync_state").select("*").eq("id", "global").maybeSingle(),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("created_at", today),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("published_at", today).eq("publish_status", "published"),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("source_published_at", monthStart),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("source_published_at", monthStart).eq("publish_status", "published"),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("verification_status", "needs_review"),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("verification_status", "rejected"),
    admin.from("knowledge_items").select("id", { count: "exact", head: true }).eq("verification_status", "duplicate"),
    admin.from("ake_connectors").select("slug,name,health_status,backfill_month_key,backfill_completed_at,sync_cursor_at,items_published,is_active").eq("is_active", true),
  ]);

  let monthImported = monthImportedRes.error ? null : (monthImportedRes.count || 0);
  let monthPublished = monthPublishedRes.error ? null : (monthPublishedRes.count || 0);
  if (monthImportedRes.error) {
    const fallback = await admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("created_at", monthStart);
    monthImported = fallback.count || 0;
  }
  if (monthPublishedRes.error) {
    const fallback = await admin.from("knowledge_items").select("id", { count: "exact", head: true }).gte("created_at", monthStart).eq("publish_status", "published");
    monthPublished = fallback.count || 0;
  }

  const monthKey = currentMonthKey();
  const backfillDone = (connectors || []).filter(
    (c) => c.backfill_month_key === monthKey && c.backfill_completed_at,
  ).length;

  return {
    connectors_active: connectorsActive || 0,
    connectors_total: connectorsTotal || 0,
    connectors_healthy: 0,
    items_new_today: itemsNewToday || 0,
    items_published_today: itemsPublishedToday || 0,
    items_review: reviewQueue || 0,
    items_rejected: rejectedCount || 0,
    items_duplicate: duplicateCount || 0,
    runs_recent: runs || [],
    sync_state: syncStateErr ? null : (syncState || null),
    backfill: {
      month_key: monthKey,
      connectors_completed: backfillDone,
      connectors_total: connectorsActive || 0,
      global_completed: syncState?.global_backfill_completed ?? false,
      import_mode: syncState?.global_import_mode ?? "backfill",
      month_imported: monthImported || 0,
      month_published: monthPublished || 0,
      remaining_estimate: Math.max(0, (monthImported || 0) - (monthPublished || 0)),
    },
    connectors_health: (connectors || []).map((c) => ({
      slug: c.slug,
      name: c.name,
      health_status: c.health_status,
      items_published: c.items_published,
      backfill_completed: Boolean(c.backfill_completed_at && c.backfill_month_key === monthKey),
      sync_cursor_at: c.sync_cursor_at,
    })),
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
