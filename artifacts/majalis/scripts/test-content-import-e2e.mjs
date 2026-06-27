#!/usr/bin/env node
/**
 * Content import visibility e2e — verifies import pipeline + dashboard counters + public adhkar data.
 *
 * Usage:
 *   node scripts/test-content-import-e2e.mjs
 *   node scripts/test-content-import-e2e.mjs --production
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parseContentFile } from "../lib/content-import/parsers.mjs";
import {
  startImportJob,
  stageImportBatch,
  queueImportJob,
  processImportJob,
  validateAllRows,
} from "../lib/content-import/engine.mjs";
import { resolveContentType } from "../lib/content-import/registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const production = process.argv.includes("--production");
const PRODUCTION = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";
const ADHKAR_CSV_PATH = join(root, "data/imports/adhkar.csv");
const FAWAID_CSV_PATH = join(root, "data/imports/fawaid_500.csv");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${msg}`);
}

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function countTable(sb, table, filter = null) {
  let q = sb.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error?.code === "PGRST205") return null;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function testImportCsvPipeline({ label, type, csvPath, table }) {
  if (!existsSync(csvPath)) throw new Error(`Missing ${csvPath}`);

  const rows = parseContentFile(csvPath);
  const { allValid, validationErrors } = validateAllRows(type, rows);
  assert(allValid, `${label} validates${validationErrors[0] ? `: ${validationErrors[0]}` : ""}`);
  assert(rows.length >= 2, `${label} has ${rows.length} rows`);

  const typeDef = resolveContentType(type);
  assert(typeDef?.table === table, `${type} target table is ${table}`);

  const started = await startImportJob({
    type,
    filename: csvPath.split("/").pop() || `${type}.csv`,
    totalRows: rows.length,
    createdBy: "e2e-test",
  });
  assert(started.ok && started.jobId, `${label}: startImportJob creates job`);

  const staged = await stageImportBatch(started.jobId, rows, 0);
  assert(staged.ok, `${label}: stageImportBatch persists rows`);

  const queued = await queueImportJob(started.jobId);
  assert(queued.ok, `${label}: queueImportJob succeeds`);

  const result = await processImportJob(started.jobId, { dryRun: true });
  assert(result.ok, `${label}: processImportJob dry-run ok`);
  assert(result.report?.stats?.imported === rows.length, `${label}: dry-run imported ${rows.length} rows`);
  return started.jobId;
}

async function testLocalImportPipeline() {
  console.log("\n1) Local import pipeline (dry-run)");
  await testImportCsvPipeline({
    label: "adhkar.csv",
    type: "adhkar",
    csvPath: ADHKAR_CSV_PATH,
    table: "verified_adhkar_items",
  });
  await testImportCsvPipeline({
    label: "fawaid_500.csv",
    type: "benefits",
    csvPath: FAWAID_CSV_PATH,
    table: "fawaid",
  });
}

async function testSupabaseRowCounts() {
  console.log("\n2) Supabase row counts");
  const sb = getSupabase();
  if (!sb) {
    console.log("  ⊘ skipped — no VITE_SUPABASE_URL / key");
    return;
  }

  const jobs = await countTable(sb, "content_import_jobs");
  const staging = await countTable(sb, "content_import_staging");
  const adhkar = await countTable(sb, "verified_adhkar_items", (q) => q.is("deleted_at", null));
  const cmsIndex = await countTable(sb, "cms_content_index");

  if (jobs !== null) assert(jobs >= 0, `content_import_jobs count = ${jobs}`);
  else console.log("  ⊘ content_import_jobs table not found");

  if (staging !== null) assert(staging >= 0, `content_import_staging count = ${staging}`);
  else console.log("  ⊘ content_import_staging table not found");

  if (adhkar !== null) {
    assert(adhkar >= 0, `verified_adhkar_items count = ${adhkar}`);
    if (production && adhkar === 0) {
      console.warn("  ⚠ production verified_adhkar_items is 0 — import may not have committed");
    }
  } else {
    console.log("  ⊘ verified_adhkar_items table not found");
  }

  if (cmsIndex === null) {
    console.log("  ⊘ cms_content_index not deployed (expected on production — using fallback counters)");
  }

  if (jobs !== null && adhkar !== null && production) {
    assert(jobs > 0 || adhkar > 0, "production has import jobs or verified adhkar rows");
  }
}

async function testDashboardCounterLogic() {
  console.log("\n3) Dashboard counter logic");
  const sb = getSupabase();
  if (!sb) {
    console.log("  ⊘ skipped — no Supabase client");
    return;
  }

  const [cmsIndex, contentJobs, legacyJobs, adhkar] = await Promise.all([
    countTable(sb, "cms_content_index"),
    countTable(sb, "content_import_jobs"),
    countTable(sb, "import_jobs"),
    countTable(sb, "verified_adhkar_items", (q) => q.is("deleted_at", null)),
  ]);

  const importJobsTotal =
    contentJobs !== null ? contentJobs : legacyJobs !== null ? legacyJobs : 0;
  const indexTotal =
    cmsIndex !== null && cmsIndex > 0
      ? cmsIndex
      : adhkar !== null && adhkar > 0
        ? adhkar
        : cmsIndex ?? adhkar ?? 0;

  assert(importJobsTotal >= 0, `importJobsTotal = ${importJobsTotal}`);
  assert(indexTotal >= 0, `indexTotal (fallback) = ${indexTotal}`);

  if (production && contentJobs !== null) {
    assert(contentJobs > 0, "production content_import_jobs > 0");
  }
  if (production && adhkar !== null) {
    assert(adhkar > 0, "production verified_adhkar_items > 0");
  }
}

async function testPublicAdhkarSmoke() {
  console.log("\n4) Public /adhkar smoke");
  const base = production ? PRODUCTION : `http://127.0.0.1:${process.env.PORT || 24216}`;
  const url = `${base}/adhkar`;

  try {
    const res = await fetch(url, { redirect: "follow" });
    assert(res.ok, `GET ${url} → ${res.status}`);
    const html = await res.text();
    assert(html.includes("الأذكار") || html.includes("adhkar"), "page contains adhkar content marker");
  } catch (err) {
    if (!production) {
      console.log(`  ⊘ skipped local fetch (${err.message}) — start dev server to test`);
      return;
    }
    throw err;
  }

  const sb = getSupabase();
  if (sb && production) {
    const { data, error } = await sb
      .from("verified_adhkar_items")
      .select("id, text")
      .is("deleted_at", null)
      .neq("verification_status", "rejected")
      .limit(1);
    assert(!error, "can read verified_adhkar_items for public page");
    if (data?.length) {
      assert(data[0].text?.length > 0, "verified adhkar row has text");
    }
  }
}

async function main() {
  console.log(`Content import e2e (${production ? "production" : "local"})`);

  await testLocalImportPipeline();
  await testSupabaseRowCounts();
  await testDashboardCounterLogic();
  await testPublicAdhkarSmoke();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
