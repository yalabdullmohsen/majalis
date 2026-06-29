/**
 * AKP v3 — Source Health Monitoring.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { extractRssItems } from "../../auto-content/auto-content-utils.mjs";
import { createAlert } from "../monitoring.mjs";
import { logSelfHealingEvent, failoverSource } from "./self-healing.mjs";

export const HEALTH_DISABLE_THRESHOLD = 60;

const FETCH_TIMEOUT = 20_000;

export async function fetchWithMetrics(url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "MajlisIlm-AKP/3.0 (+https://www.majlisilm.com)" },
    });
    const body = await res.text();
    return {
      ok: res.ok,
      httpStatus: res.status,
      responseMs: Date.now() - started,
      body,
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: 0,
      responseMs: Date.now() - started,
      error: String(err.message || err),
      body: "",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function computeHealthScore(metrics) {
  const {
    httpStatus = 0,
    responseMs = 10_000,
    itemsFound = 0,
    qualityScore = 70,
    errorRatePct = 0,
    hoursSinceSuccess = 0,
  } = metrics;

  let score = 0;

  if (httpStatus >= 200 && httpStatus < 300) score += 25;
  else if (httpStatus >= 300 && httpStatus < 400) score += 15;

  if (responseMs < 2000) score += 20;
  else if (responseMs < 5000) score += 15;
  else if (responseMs < 10_000) score += 8;
  else score += 3;

  score += Math.min(15, itemsFound > 0 ? 10 + Math.min(5, itemsFound) : 0);
  score += Math.round(Math.min(20, qualityScore / 5));
  score += Math.round(Math.max(0, 20 * (1 - errorRatePct / 100)));

  if (hoursSinceSuccess > 48) score -= 15;
  else if (hoursSinceSuccess > 24) score -= 8;
  else if (hoursSinceSuccess > 6) score -= 3;

  return Math.max(0, Math.min(100, score));
}

export async function testSourceFetch(url, sourceType = "rss") {
  const fetched = await fetchWithMetrics(url);
  let itemsFound = 0;
  let qualityScore = 50;

  if (fetched.ok && fetched.body) {
    if (sourceType === "rss" || sourceType === "atom" || sourceType === "feed") {
      try {
        const items = extractRssItems(fetched.body);
        itemsFound = items?.length || 0;
        qualityScore = itemsFound ? Math.min(100, 60 + itemsFound * 2) : 40;
      } catch {
        qualityScore = 30;
      }
    } else {
      itemsFound = fetched.body.length > 500 ? 1 : 0;
      qualityScore = itemsFound ? 65 : 35;
    }
  }

  const healthScore = computeHealthScore({
    httpStatus: fetched.httpStatus,
    responseMs: fetched.responseMs,
    itemsFound,
    qualityScore,
    errorRatePct: fetched.ok ? 0 : 100,
  });

  return {
    ok: fetched.ok,
    httpStatus: fetched.httpStatus,
    responseMs: fetched.responseMs,
    itemsFound,
    qualityScore,
    healthScore,
    error: fetched.error || null,
  };
}

export async function recordHealthSnapshot(sourceId, metrics) {
  const admin = getSupabaseAdmin();
  if (!admin || !sourceId) return;

  await admin.from("akp_source_health_snapshots").insert({
    source_id: sourceId,
    health_score: metrics.healthScore,
    http_status: metrics.httpStatus,
    response_ms: metrics.responseMs,
    items_found: metrics.itemsFound ?? 0,
    quality_score: metrics.qualityScore,
    error_rate_pct: metrics.errorRatePct ?? 0,
    metadata: metrics.metadata || {},
  });
}

export async function evaluateSourceHealth(source) {
  const test = await testSourceFetch(source.source_url, source.source_type);
  const healthScore = test.healthScore;

  const admin = getSupabaseAdmin();
  if (admin && source.id) {
    const patch = {
      health_score: healthScore,
      last_http_status: test.httpStatus,
      last_response_ms: test.responseMs,
      items_extracted_last: test.itemsFound,
      health_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (healthScore < HEALTH_DISABLE_THRESHOLD && source.active) {
      patch.active = false;
      patch.auto_disabled_at = new Date().toISOString();
      patch.auto_disable_reason = `health_score_${healthScore}_below_${HEALTH_DISABLE_THRESHOLD}`;

      await createAlert({
        severity: "error",
        component: "source-health",
        title: `تعطيل مصدر: ${source.name}`,
        message: `Health Score=${healthScore} — تم التعطيل التلقائي`,
        metadata: { sourceId: source.id, slug: source.slug },
      });

      await logSelfHealingEvent({
        eventType: "source_auto_disable",
        component: "health-monitor",
        sourceId: source.id,
        actionTaken: "disabled_source",
        success: true,
        metadata: { healthScore },
      });

      await failoverSource(source.id);
    }

    await admin.from("akp_content_sources").update(patch).eq("id", source.id);
    await recordHealthSnapshot(source.id, {
      healthScore,
      httpStatus: test.httpStatus,
      responseMs: test.responseMs,
      itemsFound: test.itemsFound,
      qualityScore: test.qualityScore,
    });
  }

  return { ...test, healthScore, autoDisabled: healthScore < HEALTH_DISABLE_THRESHOLD };
}

export async function runHealthMonitoringCycle({ limit = 20 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const { data: sources } = await admin
    .from("akp_content_sources")
    .select("*")
    .eq("active", true)
    .order("health_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  const results = [];
  for (const source of sources || []) {
    results.push({
      id: source.id,
      slug: source.slug,
      ...(await evaluateSourceHealth(source)),
    });
  }

  return { ok: true, checked: results.length, results };
}
