#!/usr/bin/env node
/**
import "dotenv/config";
 * Production readiness verification — run after Vercel env vars are configured.
 * Usage: node scripts/production-verify.mjs [--base=https://majlisilm.com]
 *
 * Loads `.env.local` from the majalis app root when present.
 * When server secrets are unavailable locally, runs remote HTTP smoke tests against --base.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRateLimit, isRedisRateLimitConfigured } from "../lib/rate-limit.mjs";
import { verifySchema, applyMigrations } from "../lib/db-migrate.mjs";
import { runRestoreTest } from "../lib/governance/backup.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { getEnvStatus } from "../lib/env-config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "..");

const REQUIRED_ENV = [
  "CRON_SECRET",
  "ADMIN_API_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];

const CRON_ROUTES = [
  "/api/cron/bootstrap-database",
  "/api/cron/apply-migrations",
  "/api/cron/auto-content-sync",
  "/api/cron/auto-knowledge-sync",
  { path: "/api/cron/ai-agents", query: "?mode=health", note: "full pipeline may 504 on serverless — health probe only" },
  "/api/cron/governance-backup",
];

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://localhost:3000";

function loadDotEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnvFile(join(APP_ROOT, ".env.local"));
loadDotEnvFile(join(APP_ROOT, ".env.production.local"));

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { res, json, text };
}

function isServerlessCrash(status, text) {
  return status === 500 && /FUNCTION_INVOCATION_FAILED|A server error has occurred/i.test(text);
}

async function checkEnv() {
  section("1. Vercel / Production Environment");
  const missing = [];
  for (const key of REQUIRED_ENV) {
    const ok = Boolean(process.env[key]?.trim());
    console.log(`${ok ? "✓" : "✗"} ${key}`);
    if (!ok) missing.push(key);
  }
  const envStatus = getEnvStatus();
  console.log("Supabase URL:", envStatus.SUPABASE_URL ? "configured" : "missing");
  return { ok: missing.length === 0, missing };
}

async function testRateLimit() {
  section("2. Upstash Rate Limiting");
  const configured = isRedisRateLimitConfigured();
  console.log("Redis configured:", configured);

  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV;
  const testKey = `verify:${Date.now()}`;

  const normal = await checkRateLimit(testKey, { windowMs: 60_000, max: 5 });
  console.log("Normal request:", normal.backend, "allowed:", normal.allowed, "remaining:", normal.remaining);

  let exceeded = normal;
  for (let i = 0; i < 10; i++) {
    exceeded = await checkRateLimit(testKey, { windowMs: 60_000, max: 5 });
  }
  console.log("After burst:", exceeded.backend, "allowed:", exceeded.allowed);

  if (isProd && normal.backend === "memory") {
    return { ok: false, error: "in-memory used in production — forbidden" };
  }
  if (isProd && !configured) {
    return { ok: false, error: "Upstash not configured in production" };
  }
  if (configured && normal.backend !== "upstash") {
    return { ok: false, error: `Expected upstash backend, got ${normal.backend}` };
  }
  return { ok: configured ? normal.backend === "upstash" : true, normal, exceeded };
}

async function testMigrations() {
  section("3. Supabase Migrations");
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "Supabase admin not configured" };
  }

  let verify = await verifySchema();
  if (!verify.ok) {
    console.log("Schema incomplete — applying migrations...");
    const applied = await applyMigrations({ continueOnError: false });
    console.log("Apply result:", applied.ok, applied.error || "");
    verify = await verifySchema();
  }

  for (const [table, status] of Object.entries(verify.checks || {})) {
    console.log(`${status === "ok" ? "✓" : "✗"} ${table}: ${status}`);
  }
  return { ok: verify.ok, checks: verify.checks };
}

async function testCronRoutesRemote() {
  section("4. Cron Jobs");
  const secret = process.env.CRON_SECRET;
  const results = [];

  for (const entry of CRON_ROUTES) {
    const path = typeof entry === "string" ? entry : entry.path;
    const query = typeof entry === "string" ? "" : entry.query || "";
    const note = typeof entry === "string" ? "" : entry.note || "";
    try {
      const headers = secret
        ? { Authorization: `Bearer ${secret}` }
        : { "x-vercel-cron": "1" };
      const { res, json, text } = await fetchJson(`${base}${path}${query}`, { headers });
      const crashed = isServerlessCrash(res.status, text);
      const timedOut = res.status === 504;
      const ok = res.status === 200;
      const suffix = crashed ? " (serverless crash)" : timedOut ? " (gateway timeout)" : note ? ` (${note})` : "";
      console.log(`${ok ? "✓" : "✗"} ${path}${query} → HTTP ${res.status}${suffix}`);
      if (!ok) console.log("  ", json.error || json.message || text.slice(0, 150));
      results.push({
        path: `${path}${query}`,
        status: res.status,
        ok,
        note: note || undefined,
        error: json.error || json.message || (crashed ? "FUNCTION_INVOCATION_FAILED" : timedOut ? "GATEWAY_TIMEOUT" : undefined),
      });
    } catch (err) {
      console.log(`✗ ${path} → ${err.message}`);
      results.push({ path, status: 0, ok: false, error: err.message });
    }
  }

  if (!secret) {
    console.log("Note: CRON_SECRET not available locally — using x-vercel-cron header for production cron auth.");
  }

  return { ok: results.every((r) => r.ok), results, authenticated: Boolean(secret) };
}

async function testBackupRestore() {
  section("5. Backup / Restore");
  const admin = getSupabaseAdmin();
  const restore = await runRestoreTest(admin, { exportFirst: true });
  console.log("Restore test:", restore.status, "ok:", restore.ok);
  return { ok: restore.ok, restore };
}

async function testRemoteProduction() {
  section("6. Remote Production HTTP");
  const checks = [];

  async function check(name, url, validate, options = {}) {
    try {
      const { res, json, text } = await fetchJson(url, options);
      const crashed = isServerlessCrash(res.status, text);
      const ok = !crashed && validate(res, json, text);
      console.log(`${ok ? "✓" : "✗"} ${name} → HTTP ${res.status}`);
      if (!ok) console.log("  ", json.error || json.message || json.raw || text.slice(0, 120));
      checks.push({ name, ok, status: res.status, error: json.error || json.message });
      return ok;
    } catch (err) {
      console.log(`✗ ${name} → ${err.message}`);
      checks.push({ name, ok: false, status: 0, error: err.message });
      return false;
    }
  }

  await check("Homepage", `${base}/`, (res, _json, text) => res.status === 200 && /المجلس|majlis/i.test(text));
  await check("API healthz", `${base}/api/healthz`, (res, json) => res.status === 200 && json.ok === true);
  await check("Prayer times", `${base}/api/prayer-times?city=Riyadh`, (res, json) => res.status === 200 && (json.ok === true || json.city || json.times));
  await check(
    "Search",
    `${base}/api/intelligent-search?q=الصلاة&limit=3`,
    (res, json) => res.status === 200 && Array.isArray(json.results ?? json.items ?? json.hits),
  );
  await check(
    "Auto Content",
    `${base}/api/auto-content?limit=3`,
    (res, json) => res.status === 200 && (json.ok === true || Array.isArray(json.items ?? json.feed)),
  );

  const adminSecret = process.env.ADMIN_API_SECRET;
  if (adminSecret) {
    const adminHeaders = { Authorization: `Bearer ${adminSecret}` };
    await check(
      "AI Agents dashboard",
      `${base}/api/admin/ai-agents?action=dashboard`,
      (res, json) => res.status === 200 && json.ok === true,
      { headers: adminHeaders },
    );
    await check(
      "Governance dashboard",
      `${base}/api/admin/governance?action=dashboard`,
      (res, json) => res.status === 200 && json.ok === true,
      { headers: adminHeaders },
    );
    await check(
      "Governance RBAC roles",
      `${base}/api/admin/governance?action=roles`,
      (res, json) => res.status === 200 && (json.roles || json.ok === true),
      { headers: adminHeaders },
    );
  } else {
    await check(
      "AI Agents auth gate",
      `${base}/api/admin/ai-agents?action=dashboard`,
      (res) => res.status === 401,
    );
    await check(
      "Governance auth gate",
      `${base}/api/admin/governance?action=dashboard`,
      (res) => res.status === 401,
    );
  }

  const upstashHeaderCheck = await fetch(`${base}/api/assistant/health`);
  const backend = upstashHeaderCheck.headers.get("x-ratelimit-backend");
  if (backend) {
    const ok = backend === "upstash" || backend === "redis";
    console.log(`${ok ? "✓" : "✗"} Upstash header on API → ${backend}`);
    checks.push({ name: "Upstash header", ok, status: upstashHeaderCheck.status, backend });
  }

  for (const [name, path, body] of [
    ["Assistant rate limit", "/api/assistant", { message: "verify" }],
    ["Transcribe rate limit", "/api/transcribe", { audio: "" }],
  ]) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const backendHeader = (res.headers.get("x-ratelimit-backend") || "").toLowerCase();
      const ok = backendHeader === "upstash" || backendHeader === "redis";
      console.log(
        `${ok ? "✓" : "✗"} ${name} → HTTP ${res.status}${backendHeader ? ` (backend: ${backendHeader})` : ""}`,
      );
      if (!ok) console.log("  ", text.slice(0, 120));
      checks.push({ name, ok, status: res.status, backend: backendHeader });
    } catch (err) {
      console.log(`✗ ${name} → ${err.message}`);
      checks.push({ name, ok: false, status: 0, error: err.message });
    }
  }

  return { ok: checks.every((c) => c.ok), checks };
}

async function main() {
  console.log("Production Verification — base:", base);
  const report = { at: new Date().toISOString(), base };

  report.env = await checkEnv();
  report.remote = await testRemoteProduction();

  const hasLocalSecrets = report.env.ok;

  if (hasLocalSecrets) {
    report.rateLimit = await testRateLimit();
    report.migrations = await testMigrations();
    report.cron = await testCronRoutesRemote();
    report.backup = await testBackupRestore();

    report.ready =
      report.remote.ok &&
      report.rateLimit.ok &&
      report.migrations.ok &&
      report.cron.ok &&
      report.backup.ok;
  } else {
    console.log("\n⚠ Local server secrets missing — running remote production checks only.");
    console.log("Missing:", report.env.missing.join(", "));
    report.cron = await testCronRoutesRemote();
    report.rateLimit = {
      ok: report.remote.checks.some(
        (c) =>
          (c.name === "Assistant rate limit" || c.name === "Transcribe rate limit") &&
          (c.backend === "upstash" || c.backend === "redis"),
      ),
      skipped: false,
    };
    const cronOk = report.cron.results.filter((r) => r.status === 200);
    report.migrations = {
      ok: cronOk.some((r) => r.path.includes("apply-migrations")),
      skipped: !cronOk.some((r) => r.path.includes("apply-migrations")),
    };
    report.backup = {
      ok: cronOk.some((r) => r.path.includes("governance-backup")),
      skipped: !cronOk.some((r) => r.path.includes("governance-backup")),
    };

    report.ready =
      report.remote.ok &&
      report.cron.ok &&
      report.rateLimit.ok;
  }

  section("Summary");
  console.log("Remote HTTP:", report.remote.ok ? "OK" : "FAIL");
  console.log("Upstash:", report.rateLimit?.ok ? "OK" : report.rateLimit?.skipped ? "REMOTE/SKIP" : "FAIL");
  console.log("Migrations:", report.migrations?.ok ? "OK" : report.migrations?.skipped ? "REMOTE/SKIP" : "FAIL");
  console.log("Cron:", report.cron.ok ? "OK" : "FAIL");
  console.log("Backup/Restore:", report.backup?.ok ? "OK" : report.backup?.skipped ? "REMOTE/SKIP" : "FAIL");
  console.log("Production ready:", report.ready ? "YES" : "NO");

  process.exit(report.ready ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
