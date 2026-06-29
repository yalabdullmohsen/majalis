/**
 * GKE Acquisition Metrics — success/duplicate/validation rates, queue size.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { computeReputation } from "./reputation-engine.mjs";

export function computeRates(source) {
  const imported = source.items_imported || 0;
  if (imported === 0) {
    return {
      success_rate: 0,
      duplicate_rate: 0,
      validation_rate: 0,
      source_reliability: source.reputation_score ?? source.trust_score ?? 0,
    };
  }
  const accepted = source.items_accepted || 0;
  const dupes = source.items_duplicate || 0;
  const rejected = source.items_rejected || 0;
  return {
    success_rate: Math.round((accepted / imported) * 10000) / 100,
    duplicate_rate: Math.round((dupes / imported) * 10000) / 100,
    validation_rate: Math.round(((accepted + rejected) / imported) * 10000) / 100,
    source_reliability: computeReputation(source),
  };
}

export function aggregateDashboardMetrics(sources, shadowItems = []) {
  const active = sources.filter((s) => s.is_active);
  const totalImported = sources.reduce((n, s) => n + (s.items_imported || 0), 0);
  const totalAccepted = sources.reduce((n, s) => n + (s.items_accepted || 0), 0);
  const totalRejected = sources.reduce((n, s) => n + (s.items_rejected || 0), 0);
  const totalDupes = sources.reduce((n, s) => n + (s.items_duplicate || 0), 0);
  const pendingReview = shadowItems.filter((i) => i.status === "pending_review").length;

  const avgProcessing =
    sources.filter((s) => s.avg_processing_ms).reduce((n, s) => n + s.avg_processing_ms, 0) /
      Math.max(1, sources.filter((s) => s.avg_processing_ms).length) || 0;

  return {
    total_sources: sources.length,
    active_sources: active.length,
    total_imported: totalImported,
    total_accepted: totalAccepted,
    total_rejected: totalRejected,
    total_duplicate: totalDupes,
    success_rate: totalImported ? Math.round((totalAccepted / totalImported) * 10000) / 100 : 0,
    duplicate_rate: totalImported ? Math.round((totalDupes / totalImported) * 10000) / 100 : 0,
    validation_rate: totalImported ? Math.round(((totalAccepted + totalRejected) / totalImported) * 10000) / 100 : 0,
    avg_processing_ms: Math.round(avgProcessing),
    queue_size: pendingReview,
    shadow_mode: true,
  };
}

export async function persistDailyMetrics(admin, sources) {
  if (!admin) return { ok: false, skipped: true };
  const today = new Date().toISOString().slice(0, 10);
  const rows = sources.map((s) => {
    const rates = computeRates(s);
    return {
      metric_date: today,
      period: "daily",
      source_id: s.id || null,
      ...rates,
      items_fetched: s.items_imported || 0,
      items_accepted: s.items_accepted || 0,
      items_rejected: s.items_rejected || 0,
      items_duplicate: s.items_duplicate || 0,
      avg_processing_ms: s.avg_processing_ms || null,
    };
  });
  try {
    await admin.from("gke_acquisition_metrics").upsert(rows, {
      onConflict: "metric_date,period,source_id",
      ignoreDuplicates: false,
    });
    return { ok: true, count: rows.length };
  } catch {
    return { ok: false, skipped: true };
  }
}

export async function loadShadowItems(admin, limit = 100) {
  if (!admin) return [];
  try {
    const { data } = await admin
      .from("gke_shadow_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
