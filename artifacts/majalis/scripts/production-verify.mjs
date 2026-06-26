#!/usr/bin/env node
/**
 * Production readiness verification — run after Vercel env vars are configured.
 * Usage: node scripts/production-verify.mjs [--base=https://majlisilm.com]
 */

import { checkRateLimit, isRedisRateLimitConfigured } from "../lib/rate-limit.mjs";
import { verifySchema, applyMigrations } from "../lib/db-migrate.mjs";
import { runRestoreTest } from "../lib/governance/backup.mjs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { getEnvStatus } from "../lib/env-config.mjs";

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
  "/api/cron/ai-agents",
  "/api/cron/governance-backup",
];

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://localhost:3000";

function section(title) {
  console.log(`\n=== ${title} ===`);
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
  return { ok: true, normal, exceeded };
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

  const failed = Object.entries(verify.checks || {}).filter(([, v]) => v !== "ok");
  for (const [table, status] of Object.entries(verify.checks || {})) {
    console.log(`${status === "ok" ? "✓" : "✗"} ${table}: ${status}`);
  }
  return { ok: verify.ok, failed, checks: verify.checks };
}

async function testCronRoutes() {
  section("4. Cron Jobs");
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { ok: false, error: "CRON_SECRET missing — cannot test cron routes" };
  }

  const results = [];
  for (const path of CRON_ROUTES) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const body = await res.text();
      let json;
      try { json = JSON.parse(body); } catch { json = { raw: body.slice(0, 200) }; }
      const ok = res.status === 200;
      console.log(`${ok ? "✓" : "✗"} ${path} → HTTP ${res.status}`);
      if (!ok) console.log("  ", json.error || json.message || body.slice(0, 150));
      results.push({ path, status: res.status, ok, error: json.error || json.message });
    } catch (err) {
      console.log(`✗ ${path} → ${err.message}`);
      results.push({ path, status: 0, ok: false, error: err.message });
    }
  }
  return { ok: results.every((r) => r.ok), results };
}

async function testBackupRestore() {
  section("5. Backup / Restore");
  const admin = getSupabaseAdmin();
  const restore = await runRestoreTest(admin, { exportFirst: true });
  console.log("Restore test:", restore.status, "ok:", restore.ok);
  return { ok: restore.ok, restore };
}

async function main() {
  console.log("Production Verification — base:", base);
  const report = { at: new Date().toISOString(), base };

  report.env = await checkEnv();
  if (!report.env.ok) {
    console.log("\n⛔ BLOCKED: Missing env vars:", report.env.missing.join(", "));
    console.log("Configure these in Vercel Production before continuing.");
    process.exit(1);
  }

  report.rateLimit = await testRateLimit();
  report.migrations = await testMigrations();
  report.cron = await testCronRoutes();
  report.backup = await testBackupRestore();

  report.ready =
    report.env.ok &&
    report.rateLimit.ok &&
    report.migrations.ok &&
    report.cron.ok &&
    report.backup.ok;

  section("Summary");
  console.log("Upstash:", report.rateLimit.ok ? "OK" : "FAIL");
  console.log("Migrations:", report.migrations.ok ? "OK" : "FAIL");
  console.log("Cron (all 200):", report.cron.ok ? "OK" : "FAIL");
  console.log("Backup/Restore:", report.backup.ok ? "OK" : "FAIL");
  console.log("Production ready:", report.ready ? "YES" : "NO");

  process.exit(report.ready ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
