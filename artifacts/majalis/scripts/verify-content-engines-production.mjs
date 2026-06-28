#!/usr/bin/env node
/**
 * Production verification for Phase 7 content engines.
 *
 * Usage:
 *   CRON_SECRET=... node scripts/verify-content-engines-production.mjs
 *   node scripts/verify-content-engines-production.mjs --base=https://www.majlisilm.com
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
      ...(CRON_SECRET ? { authorization: `Bearer ${CRON_SECRET}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

const steps = [];

steps.push({ step: "health", ...(await api("/api/healthz")) });

steps.push({
  step: "apply-migration",
  ...(await api("/api/cron/apply-migrations?scope=content-engines")),
});

steps.push({
  step: "run-engines-cron",
  ...(await api("/api/cron/content-engines")),
});

const migrationOk = steps.find((s) => s.step === "apply-migration")?.status === 200;
const enginesOk = steps.find((s) => s.step === "run-engines-cron")?.status === 200;

const report = {
  ok: migrationOk && enginesOk,
  base: BASE,
  steps,
  hint: !CRON_SECRET ? "Set CRON_SECRET for authenticated cron calls" : undefined,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
