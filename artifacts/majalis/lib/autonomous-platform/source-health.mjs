/**
 * Source health checks — Available | Slow | Redirect | Unauthorized | Blocked | Dead
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { extractRssItems } from "../auto-content/auto-content-utils.mjs";
import { logStructured } from "./monitoring.mjs";

const SLOW_MS = 8000;
const FETCH_TIMEOUT = 15000;

export const HEALTH_STATUS = {
  AVAILABLE: "available",
  SLOW: "slow",
  REDIRECT: "redirect",
  UNAUTHORIZED: "unauthorized",
  BLOCKED: "blocked",
  DEAD: "dead",
  UNKNOWN: "unknown",
};

function classifyResponse({ status, latencyMs, redirected, body, error }) {
  if (error) {
    if (String(error).includes("abort") || String(error).includes("timeout")) {
      return { status: HEALTH_STATUS.SLOW, error_message: "timeout" };
    }
    return { status: HEALTH_STATUS.DEAD, error_message: String(error) };
  }
  if (status === 401 || status === 403) {
    const blocked = status === 403;
    return {
      status: blocked ? HEALTH_STATUS.BLOCKED : HEALTH_STATUS.UNAUTHORIZED,
      http_status: status,
      error_message: `HTTP ${status}`,
    };
  }
  if (status >= 300 && status < 400) {
    return { status: HEALTH_STATUS.REDIRECT, http_status: status };
  }
  if (status >= 400 || status === 0) {
    return { status: HEALTH_STATUS.DEAD, http_status: status, error_message: `HTTP ${status}` };
  }
  const isXml = body?.includes("<rss") || body?.includes("<feed") || body?.includes("<?xml");
  const isJson = body?.trim().startsWith("{") || body?.trim().startsWith("[");
  if (!isXml && !isJson && body?.length > 0 && body.includes("<!DOCTYPE")) {
    return { status: HEALTH_STATUS.DEAD, http_status: status, error_message: "html_not_feed" };
  }
  let items = 0;
  if (isXml) items = extractRssItems(body).length;
  if (isJson) {
    try {
      const j = JSON.parse(body);
      if (j.hadiths) items = Object.keys(j.hadiths).length;
      else if (j.chapters) items = j.chapters.length;
      else if (Array.isArray(j)) items = j.length;
      else if (j.data) items = Array.isArray(j.data) ? j.data.length : 1;
    } catch {
      /* ignore */
    }
  }
  if (latencyMs >= SLOW_MS) {
    return { status: HEALTH_STATUS.SLOW, http_status: status, latency_ms: latencyMs, items_found: items };
  }
  return { status: HEALTH_STATUS.AVAILABLE, http_status: status, latency_ms: latencyMs, items_found: items };
}

export async function probeEndpoint(url, opts = {}) {
  const started = Date.now();
  let redirected = false;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(opts.timeoutMs || FETCH_TIMEOUT),
      headers: {
        "User-Agent": "MajlisIlm-AKP/2.0 (+https://majlisilm.com)",
        Accept: "application/rss+xml, application/json, application/xml, text/xml, */*",
      },
      redirect: "follow",
    });
    redirected = res.redirected;
    const body = await res.text();
    const latencyMs = Date.now() - started;
    const result = classifyResponse({ status: res.status, latencyMs, redirected, body });
    return { url, ...result, latency_ms: latencyMs, redirected };
  } catch (err) {
    return {
      url,
      ...classifyResponse({ error: err.message, latencyMs: Date.now() - started }),
      latency_ms: Date.now() - started,
    };
  }
}

export async function checkSourceHealth(source) {
  if (source.source_type === "internal" || source.parser?.startsWith("internal_")) {
    const admin = getSupabaseAdmin();
    const result = {
      url: source.source_url,
      status: admin ? HEALTH_STATUS.AVAILABLE : HEALTH_STATUS.DEAD,
      error_message: admin ? null : "no_admin",
      items_found: 0,
    };
    await recordSourceHealth(source.slug, result, [result]);
    return { slug: source.slug, best: result, probes: [result] };
  }

  const endpoints = [
    source.source_url,
    ...(source.fallback_urls || source.metadata?.fallback_urls || []),
  ].filter(Boolean);

  const results = [];
  for (const url of endpoints) {
    const probe = await probeEndpoint(url);
    results.push(probe);
    if (probe.status === HEALTH_STATUS.AVAILABLE || probe.status === HEALTH_STATUS.SLOW) {
      break;
    }
  }

  const best = results.find((r) => r.status === HEALTH_STATUS.AVAILABLE || r.status === HEALTH_STATUS.SLOW)
    || results[0]
    || { status: HEALTH_STATUS.DEAD, error_message: "no_endpoints" };

  await recordSourceHealth(source.slug, best, results);
  return { slug: source.slug, best, probes: results };
}

export async function recordSourceHealth(sourceSlug, result, allProbes = []) {
  const admin = getSupabaseAdmin();
  const row = {
    source_slug: sourceSlug,
    endpoint_url: result.url || "",
    status: result.status,
    http_status: result.http_status ?? null,
    latency_ms: result.latency_ms ?? null,
    error_message: result.error_message ?? null,
    items_found: result.items_found ?? 0,
    metadata: { probes: allProbes.map((p) => ({ url: p.url, status: p.status, http_status: p.http_status })) },
    checked_at: new Date().toISOString(),
  };

  if (admin) {
    try {
      await admin.from("akp_source_health").insert(row);
    } catch {
      /* table optional until migration */
    }
  }

  await logStructured({
    level: result.status === HEALTH_STATUS.AVAILABLE ? "info" : "warn",
    component: "source_health",
    event: "source_checked",
    message: result.error_message || result.status,
    metadata: { sourceSlug, status: result.status, url: result.url },
  });

  return row;
}

export async function checkAllSourcesHealth(sources) {
  const results = [];
  for (const source of sources) {
    results.push(await checkSourceHealth(source));
  }
  const summary = {
    total: results.length,
    available: results.filter((r) => r.best.status === HEALTH_STATUS.AVAILABLE).length,
    slow: results.filter((r) => r.best.status === HEALTH_STATUS.SLOW).length,
    dead: results.filter((r) => r.best.status === HEALTH_STATUS.DEAD).length,
    blocked: results.filter((r) => r.best.status === HEALTH_STATUS.BLOCKED).length,
    unauthorized: results.filter((r) => r.best.status === HEALTH_STATUS.UNAUTHORIZED).length,
    redirect: results.filter((r) => r.best.status === HEALTH_STATUS.REDIRECT).length,
  };
  return { ok: summary.dead < summary.total, summary, results };
}

export function pickWorkingEndpoint(source, healthResult) {
  const available = healthResult?.probes?.find(
    (p) => p.status === HEALTH_STATUS.AVAILABLE || p.status === HEALTH_STATUS.SLOW,
  );
  return available?.url || source.source_url;
}
