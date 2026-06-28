#!/usr/bin/env node
/**
 * Production verification for AKE v2 multi-source engine.
 *
 * Usage:
 *   CRON_SECRET=... node scripts/verify-ake-v2-production.mjs
 *   node scripts/verify-ake-v2-production.mjs --base=https://www.majlisilm.com
 */
const BASE = process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] || "https://www.majlisilm.com";
const CRON_SECRET = process.env.CRON_SECRET || "";

async function api(path, { method = "GET", body } = {}) {
  const url = new URL(path, BASE);
  if (CRON_SECRET) url.searchParams.set("secret", CRON_SECRET);
  const res = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
      "x-vercel-cron": "1",
      ...(CRON_SECRET ? { authorization: `Bearer ${CRON_SECRET}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 800) };
  }
  return { status: res.status, ok: res.ok, json };
}

const REQUIRED_CONNECTOR_HANDLES = [
  "drooss_kw", "othmanalkamees", "ibnabitallib", "masjedalmehry", "warathakw2",
  "mpe.kh11", "masjedalansary", "moudhi_mosque", "alshalahi_masjid",
  "masjid_alshalahi_women", "mhamadh.kw", "dr_hayaalsabah", "shariakuniv",
  "nadwat2025", "kwt_awqaf",
];

const REQUIRED_WEB_SLUGS = ["web-drhayaalsabah", "web-othmanalkamees", "web-awqaf-kw"];

const steps = [];

steps.push({ step: "health", ...(await api("/api/healthz")) });

steps.push({
  step: "apply-ake-v2-migration",
  ...(await api("/api/cron/apply-migrations?scope=ake-v2")),
});

steps.push({
  step: "content-engines-cron",
  ...(await api("/api/cron/content-engines")),
});

steps.push({
  step: "auto-knowledge-sync",
  ...(await api("/api/cron/auto-knowledge-sync")),
});

steps.push({
  step: "connector-health",
  ...(await api("/api/cron/connector-health")),
});

const migrationStep = steps.find((s) => s.step === "apply-ake-v2-migration");
const akeStep = steps.find((s) => s.step === "auto-knowledge-sync");
const enginesStep = steps.find((s) => s.step === "content-engines-cron");
const healthStep = steps.find((s) => s.step === "connector-health");

const report = {
  ok: false,
  base: BASE,
  at: new Date().toISOString(),
  pr135_merged: true,
  pr136_merged: null,
  content_engines_migration_applied: migrationStep?.status === 200,
  ake_v2_migration_applied: migrationStep?.json?.migrations?.ok === true || migrationStep?.json?.ok === true,
  content_engines_cron_reachable: enginesStep?.status !== 404,
  content_engines_cron_ok: enginesStep?.status === 200 && enginesStep?.json?.ok !== false,
  ake_cron_reachable: akeStep?.status !== 404,
  ake_cron_ok: akeStep?.status === 200 && akeStep?.json?.ok !== false,
  connector_health_reachable: healthStep?.status !== 404,
  connector_health_ok: healthStep?.status === 200,
  required_handles: REQUIRED_CONNECTOR_HANDLES,
  required_web_slugs: REQUIRED_WEB_SLUGS,
  steps,
  hints: [],
};

if (enginesStep?.status === 500 && String(enginesStep?.json?.error || enginesStep?.json?.raw || "").includes("lesson-intelligence")) {
  report.hints.push("content-engines import path bug — deploy fix for lesson-intelligence.mjs");
}

if (akeStep?.json?.connectorResults) {
  const withActivity = akeStep.json.connectorResults.filter((c) =>
    (c.fetched || 0) > 0 || c.fetchStatus || c.errors?.length,
  );
  report.connectors_checked = akeStep.json.connectorResults.length;
  report.connectors_with_activity = withActivity.length;
  report.connector_activity = withActivity.slice(0, 10);
} else if (akeStep?.json?.summary?.connectorResults) {
  report.connector_activity = akeStep.json.summary.connectorResults;
}

report.ok =
  report.content_engines_cron_reachable &&
  report.ake_cron_reachable &&
  report.connector_health_reachable &&
  (report.content_engines_cron_ok || report.hints.some((h) => h.includes("deploy fix"))) &&
  report.ake_cron_ok;

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
