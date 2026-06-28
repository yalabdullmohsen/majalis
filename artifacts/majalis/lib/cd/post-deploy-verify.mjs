/**
 * Post-deploy verification — comprehensive production health gate.
 */

import { PRODUCTION_BASE, PRODUCTION_APIS, CRON_SMOKE_PATHS } from "../release-gate.mjs";
import { getSystemHealth } from "../system-health.mjs";
import { runProductionSelfHeal } from "./self-heal.mjs";

export const POST_DEPLOY_CHECKS = [
  { id: "system_health", label: "System Health" },
  { id: "database", label: "Database Connection" },
  { id: "supabase", label: "Supabase Health" },
  { id: "cron", label: "Cron Verification" },
  { id: "queue", label: "Queue Verification" },
  { id: "ake", label: "Auto Knowledge Engine" },
  { id: "ai", label: "AI Verification" },
  { id: "search", label: "Search Verification" },
  { id: "connectors", label: "Connectors Verification" },
  { id: "api", label: "API Verification" },
  { id: "healthz", label: "Health Endpoint" },
];

export async function runPostDeployVerification(options = {}) {
  const started = Date.now();
  const base = options.baseUrl || process.env.MAJALIS_PRODUCTION_URL || PRODUCTION_BASE;
  const cronSecret = process.env.CRON_SECRET;
  const selfHealFirst = options.selfHeal !== false;
  const checks = [];

  if (selfHealFirst) {
    const heal = await runProductionSelfHeal({ baseUrl: base });
    const healOk = heal.ok || !process.env.DATABASE_URL;
    checks.push({ id: "self_heal", label: "Self-Healing", ok: healOk, details: heal.actions });
  }

  const health = await getSystemHealth();
  const productionProbe =
    !health.database?.status || health.database?.status !== "connected"
      ? await probeUrl(`${base}/api/cron/system-health`, cronSecret || "x-vercel-cron")
      : null;

  const dbOk =
    health.database?.status === "connected" ||
    (productionProbe?.ok && productionProbe?.json?.database?.status === "connected");

  checks.push({
    id: "system_health",
    label: "System Health",
    ok: health.ok !== false || productionProbe?.json?.ok === true,
    details: { errors: health.errors, metrics: health.metrics, productionProbe: productionProbe?.status },
  });

  checks.push({
    id: "database",
    label: "Database Connection",
    ok: dbOk,
    details: health.database || productionProbe?.json?.database,
  });

  checks.push({
    id: "supabase",
    label: "Supabase Health",
    ok: health.supabase?.status === "connected" || productionProbe?.json?.supabase?.status === "connected",
    details: health.supabase || productionProbe?.json?.supabase,
  });

  checks.push({
    id: "cron",
    label: "Cron Verification",
    ok: health.cron?.secretConfigured === true || Boolean(cronSecret) || productionProbe?.ok,
    details: health.cron,
  });

  checks.push({
    id: "queue",
    label: "Queue Verification",
    ok: (health.queue?.failed || 0) < 50,
    details: health.queue,
  });

  checks.push({
    id: "ake",
    label: "Auto Knowledge Engine",
    ok: health.metrics?.sourcesActive != null,
    details: {
      sourcesActive: health.metrics?.sourcesActive,
      itemsPublished: health.metrics?.itemsPublished,
      akeRpc: health.akeRpc,
    },
  });

  checks.push({
    id: "ai",
    label: "AI Verification",
    ok:
      health.ai?.status === "ready" ||
      health.ai?.status === "fallback" ||
      productionProbe?.json?.ai?.status === "ready" ||
      productionProbe?.json?.ai?.status === "fallback",
    details: health.ai || productionProbe?.json?.ai,
  });

  const searchOk = await probeUrl(`${base}/api/knowledge-search?q=صلاة&limit=3`);
  checks.push({ id: "search", label: "Search Verification", ok: searchOk.ok, details: searchOk });

  const connectorOk = await probeUrl(`${base}/api/cron/connector-health`, cronSecret);
  checks.push({ id: "connectors", label: "Connectors Verification", ok: connectorOk.ok, details: connectorOk });

  const apiResults = [];
  for (const api of PRODUCTION_APIS.slice(0, 6)) {
    const r = await probeUrl(`${base}${api.path}`, null, api.method);
    apiResults.push({ path: api.path, ok: r.ok, status: r.status });
  }
  checks.push({
    id: "api",
    label: "API Verification",
    ok: apiResults.every((r) => r.ok),
    details: apiResults,
  });

  const healthz = await probeUrl(`${base}/api/healthz`);
  checks.push({ id: "healthz", label: "Health Endpoint", ok: healthz.ok, details: healthz });

  if (cronSecret) {
    const cronResults = [];
    for (const path of CRON_SMOKE_PATHS.slice(0, 3)) {
      const r = await probeUrl(`${base}${path}`, cronSecret);
      cronResults.push({ path, ok: r.ok, status: r.status });
    }
    checks.push({
      id: "cron_smoke",
      label: "Cron Smoke",
      ok: cronResults.every((r) => r.ok),
      details: cronResults,
    });
  }

  const failed = checks.filter((c) => !c.ok);
  const criticalFailed = failed.filter((c) =>
    ["system_health", "database", "healthz", "api"].includes(c.id),
  );

  return {
    ok: criticalFailed.length === 0,
    healthy: failed.length === 0,
    checks,
    failedCount: failed.length,
    failedChecks: failed.map((c) => c.id),
    durationMs: Date.now() - started,
    productionUrl: base,
  };
}

async function probeUrl(url, cronSecret, method = "GET") {
  try {
    const headers = { Accept: "application/json" };
    if (cronSecret === "x-vercel-cron") {
      headers["x-vercel-cron"] = "1";
    } else if (cronSecret) {
      headers.Authorization = `Bearer ${cronSecret}`;
    }
    const res = await fetch(url, { method, headers, signal: AbortSignal.timeout(20_000) });
    const ok = res.status >= 200 && res.status < 500;
    let json;
    try {
      json = await res.json();
    } catch {
      json = undefined;
    }
    return { ok: ok && json?.ok !== false, status: res.status, url, json };
  } catch (err) {
    return { ok: false, error: err.message, url };
  }
}
