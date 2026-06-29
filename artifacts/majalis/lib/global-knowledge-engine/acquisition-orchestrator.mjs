/**
 * GKE Data Acquisition Orchestrator — shadow-mode ingestion for enabled integration phases.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { GKE_INTEGRATION_PHASES, GKE_SHADOW_MODE } from "./config.mjs";
import { getTrustedSourcesSeed, findTrustedSourceBySlug } from "./trusted-sources/registry.mjs";
import { listSources, syncSourcesToDatabase } from "./layers/source-registry.mjs";
import { processShadowItem, isShadowMode, getShadowModeConfig } from "./shadow-mode.mjs";
import { computeReputation, applyReputationDelta } from "./reputation-engine.mjs";
import {
  aggregateDashboardMetrics,
  loadShadowItems,
  persistDailyMetrics,
} from "./acquisition-metrics.mjs";

function isKindEnabled(kind) {
  const phase = GKE_INTEGRATION_PHASES.find((p) => p.content_kind === kind);
  return phase?.enabled === true;
}

/** Simulate fetch from source — real connector integration in Phase 3. */
async function fetchFromSource(source) {
  const enabledKinds = source.content_types.filter((k) => isKindEnabled(k));
  if (!enabledKinds.length) {
    return { ok: true, items: [], message: "no_enabled_integration_phase" };
  }

  const kind = enabledKinds[0];
  const items = [
    {
      external_key: `gke:${source.slug}:${Date.now()}`,
      source_id: source.slug,
      content_kind: kind,
      title: `عنصر shadow من ${source.name}`,
      body: `محتوى مستورد في وضع Shadow من ${source.source_url}`,
      metadata: { source_url: source.source_url, shadow: true },
    },
  ];
  return { ok: true, items, fetched: items.length };
}

export async function runShadowAcquisitionForSource(slug) {
  const source = findTrustedSourceBySlug(slug);
  if (!source) return { ok: false, error: "source_not_found" };
  if (!source.is_active) return { ok: false, error: "source_inactive" };

  const start = Date.now();
  const fetchResult = await fetchFromSource(source);
  const results = [];
  let accepted = 0;
  let rejected = 0;
  let dupes = 0;

  for (const item of fetchResult.items || []) {
    const shadow = await processShadowItem(item, { source_id: source.slug });
    results.push(shadow);
    if (shadow.status === "duplicate") dupes++;
    else if (shadow.status === "rejected") rejected++;
    else accepted++;
    await persistShadowItem(item, shadow, source);
  }

  const updatedSource = {
    ...source,
    items_imported: (source.items_imported || 0) + (fetchResult.fetched || 0),
    items_accepted: (source.items_accepted || 0) + accepted,
    items_rejected: (source.items_rejected || 0) + rejected,
    items_duplicate: (source.items_duplicate || 0) + dupes,
    last_sync_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
  };
  updatedSource.reputation_score = computeReputation(updatedSource);

  return {
    ok: true,
    mode: "shadow",
    source: source.slug,
    fetched: fetchResult.fetched || 0,
    accepted,
    rejected,
    duplicate: dupes,
    results,
    duration_ms: Date.now() - start,
    reputation_score: updatedSource.reputation_score,
  };
}

async function persistShadowItem(item, shadow, source) {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin.from("gke_shadow_items").upsert(
      {
        external_key: item.external_key,
        content_kind: item.content_kind,
        title: item.title,
        body: item.body,
        quality_score: shadow.quality_score,
        is_duplicate: shadow.is_duplicate,
        status: shadow.status,
        source_url: source.source_url,
        raw_payload: { shadow: true, source_slug: source.slug },
        processing_ms: shadow.processing_ms,
      },
      { onConflict: "external_key" },
    );
  } catch {
    /* table optional until migration */
  }
}

export async function getAcquisitionDashboard() {
  const { data: sources } = await listSources({ activeOnly: false });
  const admin = getSupabaseAdmin();
  const shadowItems = await loadShadowItems(admin, 200);
  const metrics = aggregateDashboardMetrics(sources, shadowItems);

  const { getBestSources, getWorstSources, getMostActiveSources } = await import("./reputation-engine.mjs");

  return {
    ok: true,
    shadow_mode: getShadowModeConfig(),
    integration_phases: GKE_INTEGRATION_PHASES,
    metrics,
    best_sources: getBestSources(sources, 5),
    worst_sources: getWorstSources(sources, 5),
    most_active: getMostActiveSources(sources, 5),
    recent_shadow_items: shadowItems.slice(0, 20),
    recent_errors: sources.filter((s) => s.last_error).map((s) => ({ slug: s.slug, error: s.last_error })),
    production_ready: checkProductionReadiness(sources, metrics),
  };
}

export function checkProductionReadiness(sources, metrics) {
  const hasFixtures = sources.some((s) => s.source_url?.includes("example.com"));
  const allTrusted = sources.every((s) => s.is_official && s.trust_score >= 70);
  return {
    ready: false,
    shadow_mode_required: GKE_SHADOW_MODE,
    criteria: {
      no_fixtures: !hasFixtures,
      all_trusted: allTrusted,
      high_success_rate: metrics.success_rate >= 80,
      low_duplicate_rate: metrics.duplicate_rate <= 10,
      low_error_rate: metrics.total_rejected / Math.max(1, metrics.total_imported) <= 0.15,
      shadow_testing_complete: false,
      note: "يتطلب أسبوعين Shadow Mode على مصادر حقيقية قبل الربط الإنتاجي",
    },
  };
}

export async function initializeAcquisition() {
  await syncSourcesToDatabase();
  const { data } = await listSources();
  const admin = getSupabaseAdmin();
  await persistDailyMetrics(admin, data);
  return { ok: true, sources: data.length, shadow_mode: isShadowMode() };
}

export { runShadowAcquisitionForSource as runShadowSync };
