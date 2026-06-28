/**
 * Publishing analytics — daily/weekly/monthly snapshots and growth metrics.
 */

import { getSupabaseAdmin } from "../../supabase-admin.mjs";

function periodKey(type, date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  switch (type) {
    case "hourly": return d.toISOString().slice(0, 13);
    case "weekly": {
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
    }
    case "monthly": return d.toISOString().slice(0, 7);
    default: return d.toISOString().slice(0, 10);
  }
}

function periodStart(type) {
  const now = new Date();
  switch (type) {
    case "hourly": return new Date(now.getTime() - 3_600_000).toISOString();
    case "weekly": return new Date(now.getTime() - 7 * 86400000).toISOString();
    case "monthly": return new Date(now.getTime() - 30 * 86400000).toISOString();
    default: return new Date(now.getTime() - 86400000).toISOString();
  }
}

export async function collectPublishingMetrics(admin = getSupabaseAdmin(), periodType = "daily") {
  if (!admin) return null;

  const since = periodStart(periodType);
  const key = periodKey(periodType);

  const [
    { data: cycles },
    { data: knowledgeItems },
    { count: duplicateCount },
  ] = await Promise.all([
    admin.from("ake_cycle_metrics").select("*").gte("created_at", since),
    admin.from("knowledge_items").select("ai_category, ai_confidence, connector_slug, publish_status, created_at, updated_at")
      .gte("created_at", since).limit(5000),
    admin.from("knowledge_items").select("id", { count: "exact", head: true })
      .eq("verification_status", "duplicate").gte("updated_at", since),
  ]);

  const fetched = (cycles || []).reduce((s, c) => s + (c.fetched || 0), 0);
  const published = (cycles || []).reduce((s, c) => s + (c.published || 0), 0);
  const rejected = (cycles || []).reduce((s, c) => s + (c.rejected || 0), 0);
  const duplicate = duplicateCount || (cycles || []).reduce((s, c) => s + (c.duplicate || 0), 0);

  const categories = {};
  const sources = {};
  let confidenceSum = 0;
  let confidenceCount = 0;

  for (const item of knowledgeItems || []) {
    const cat = item.ai_category || "عام";
    categories[cat] = (categories[cat] || 0) + 1;
    const src = item.connector_slug || "unknown";
    sources[src] = (sources[src] || 0) + 1;
    if (item.ai_confidence) {
      confidenceSum += Number(item.ai_confidence);
      confidenceCount++;
    }
  }

  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topSources = Object.entries(sources)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([slug, count]) => ({ slug, count }));

  const connectorActivity = (cycles || []).reduce((acc, c) => {
    const slug = c.connector_slug || "unknown";
    acc[slug] = (acc[slug] || 0) + (c.published || 0);
    return acc;
  }, {});

  const topConnectors = Object.entries(connectorActivity)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([slug, published]) => ({ slug, published }));

  const prevKey = periodKey(periodType, new Date(Date.now() - (
    periodType === "monthly" ? 30 : periodType === "weekly" ? 7 : 1
  ) * 86400000));

  let growthPct = 0;
  try {
    const { data: prev } = await admin
      .from("ake_publishing_analytics")
      .select("items_published")
      .eq("period_type", periodType)
      .eq("period_key", prevKey)
      .maybeSingle();
    if (prev?.items_published > 0) {
      growthPct = Math.round(((published - prev.items_published) / prev.items_published) * 1000) / 10;
    }
  } catch { /* ignore */ }

  return {
    period_type: periodType,
    period_key: key,
    items_discovered: fetched,
    items_parsed: fetched - rejected,
    items_published: published,
    items_rejected: rejected,
    items_duplicate: duplicate,
    avg_processing_ms: 0,
    avg_ai_confidence: confidenceCount ? Math.round(confidenceSum / confidenceCount) : 0,
    top_categories: topCategories,
    top_sources: topSources,
    top_connectors: topConnectors,
    growth_pct: growthPct,
  };
}

export async function snapshotPublishingAnalytics(admin = getSupabaseAdmin(), periodType = "daily") {
  const metrics = await collectPublishingMetrics(admin, periodType);
  if (!metrics || !admin) return { ok: false, metrics };

  try {
    await admin.from("ake_publishing_analytics").upsert(metrics, {
      onConflict: "period_type,period_key",
    });
    return { ok: true, metrics };
  } catch {
    return { ok: true, metrics, persisted: false };
  }
}

export async function getAnalyticsDashboard(admin = getSupabaseAdmin()) {
  if (!admin) return { daily: null, weekly: null, monthly: null };

  const [daily, weekly, monthly] = await Promise.all([
    collectPublishingMetrics(admin, "daily"),
    collectPublishingMetrics(admin, "weekly"),
    collectPublishingMetrics(admin, "monthly"),
  ]);

  let history = [];
  try {
    const { data } = await admin
      .from("ake_publishing_analytics")
      .select("*")
      .eq("period_type", "daily")
      .order("period_key", { ascending: false })
      .limit(30);
    history = data || [];
  } catch { /* ignore */ }

  return { daily, weekly, monthly, history };
}
