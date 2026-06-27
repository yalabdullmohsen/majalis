#!/usr/bin/env node
/**
 * Unit tests for Vercel-safe content import engine (no filesystem on import path).
 */
import { parseCsvString, parseJsonString, parseContentString } from "../lib/content-import/parsers.mjs";
import { validateAllRows } from "../lib/content-import/engine.mjs";
import { mapRowToPayload } from "../lib/content-import/mappers.mjs";
import { dedupeRows } from "../lib/content-import/dedupe.mjs";
import { resolveContentType, CONTENT_TYPES } from "../lib/content-import/registry.mjs";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    return;
  }
  failed++;
  console.error(`✗ ${msg}`);
}

const pendingTests = [];

function test(name, fn) {
  pendingTests.push(
    (async () => {
      try {
        await fn();
        console.log(`✓ ${name}`);
      } catch (err) {
        failed++;
        console.error(`✗ ${name}: ${err.message}`);
      }
    })(),
  );
}

test("registry includes required production types", () => {
  for (const t of ["lessons", "questions", "adhkar", "books", "benefits", "rulings"]) {
    assert(resolveContentType(t), `missing type ${t}`);
    assert(CONTENT_TYPES.includes(t), `CONTENT_TYPES missing ${t}`);
  }
});

test("parse CSV in memory", () => {
  const csv = "title,description,category,source_url,sheikh_name,mosque\nدرس,وصف,فقه,https://x.com,شيخ,مسجد";
  const rows = parseCsvString(csv);
  assert(rows.length === 1, "expected 1 row");
  assert(rows[0].title === "درس", "title parsed");
});

test("parse JSON in memory", () => {
  const rows = parseJsonString('[{"text":"فائدة"}]');
  assert(rows.length === 1 && rows[0].text === "فائدة", "json row");
});

test("parseContentString detects csv by filename", () => {
  const rows = parseContentString("a,b\n1,2", "test.csv");
  assert(rows.length === 1, "csv via filename");
});

test("validation rejects invalid lesson row", () => {
  const { validationErrors, allValid } = validateAllRows("lessons", [{ title: "only title" }]);
  assert(!allValid, "should fail validation");
  assert(validationErrors.length > 0, "should have errors");
});

test("validation accepts valid benefit row", () => {
  const { allValid } = validateAllRows("benefits", [{ text: "فائدة نافعة" }]);
  assert(allValid, "benefit should pass");
});

test("validation accepts valid ruling row", () => {
  const { allValid } = validateAllRows("rulings", [{ title: "حكم", category: "صلاة", body: "الجواب" }]);
  assert(allValid, "ruling should pass");
});

test("dedupe removes duplicate rows in file", () => {
  const rows = [{ text: "x" }, { text: "x" }];
  const { unique, duplicates } = dedupeRows(rows, "benefits");
  assert(unique.length === 1, "one unique");
  assert(duplicates.length === 1, "one duplicate");
});

test("mapper produces adhkar payload with category_id", () => {
  const payload = mapRowToPayload("adhkar", {
    text: "سبحان الله",
    category: "صباح",
    count: 3,
    source: "مسلم",
  });
  assert(payload.category_id?.startsWith("adh-"), "category_id mapped");
  assert(payload.text === "سبحان الله", "text preserved");
});

test("validation accepts adhkar row with count column", () => {
  const { allValid } = validateAllRows("adhkar", [
    { text: "سبحان الله", category: "صباح", count: 1, source: "مسلم" },
  ]);
  assert(allValid, "adhkar with count should pass");
});

test("validation accepts adhkar row with repeat_count alias", () => {
  const { allValid } = validateAllRows("adhkar", [
    { text: "الحمد لله", category: "مساء", repeat_count: 3, source_name: "البخاري" },
  ]);
  assert(allValid, "adhkar with repeat_count should pass");
});

test("validation rejects adhkar row missing count and repeat_count", () => {
  const { allValid, validationErrors } = validateAllRows("adhkar", [
    { text: "لا إله إلا الله", category: "صباح", source: "مسلم" },
  ]);
  assert(!allValid, "should fail without count");
  assert(validationErrors.some((e) => e.includes("count")), "error mentions count");
});

test("mapper maps repeat_count to count in adhkar payload", () => {
  const payload = mapRowToPayload("adhkar", {
    text: "الحمد لله",
    categoryId: "adh-morning",
    repeat_count: 7,
    source_name: "مسلم",
  });
  assert(payload.count === 7, "repeat_count mapped to count");
  assert(payload.category_id === "adh-morning", "categoryId preserved");
});

test("production import modules do not reference staged filesystem paths", () => {
  const files = [
    "lib/content-import/engine.mjs",
    "lib/content-import/bulk-importer.mjs",
    "lib/content-import/import-worker.mjs",
    "lib/api-handlers/admin/content-import.js",
  ];
  for (const rel of files) {
    const src = readFileSync(join(root, rel), "utf8");
    assert(!src.includes("importToStaged"), `${rel} must not import staged`);
    assert(!src.includes("writeFileSync"), `${rel} must not write files`);
    assert(!src.includes("data/imports/staged"), `${rel} must not use staged path`);
  }
});

test("content-import API uses async job flow with sync commit for small jobs", () => {
  const src = readFileSync(join(root, "lib/api-handlers/admin/content-import.js"), "utf8");
  assert(src.includes("use_async_job_flow"), "inline import must be disabled");
  assert(src.includes("queueImportJob"), "must queue async jobs");
  assert(src.includes("processImportJob"), "must process jobs on commit");
  assert(src.includes("IMPORT_SYNC_ROW_THRESHOLD"), "sync threshold for small files");
  assert(!src.includes("runContentImportRows"), "must not run inline sync import in API");
});

test("import watchdog constants and terminal statuses", async () => {
  const { IMPORT_WATCHDOG_MS, TERMINAL_JOB_STATUSES, ACTIVE_JOB_STATUSES } = await import(
    "../lib/content-import/import-jobs.mjs"
  );
  assert(IMPORT_WATCHDOG_MS === 60_000, "watchdog is 60s");
  assert(TERMINAL_JOB_STATUSES.has("completed"), "completed terminal");
  assert(TERMINAL_JOB_STATUSES.has("failed"), "failed terminal");
  assert(TERMINAL_JOB_STATUSES.has("cancelled"), "cancelled terminal");
  assert(ACTIVE_JOB_STATUSES.includes("queued"), "queued is active");
});

test("platform bootstrap compat migration exists", () => {
  const compat = join(root, "supabase/platform_bootstrap_compat_v1.sql");
  assert(existsSync(compat), "platform_bootstrap_compat_v1.sql exists");
  const sql = readFileSync(compat, "utf8");
  assert(sql.includes("admin_audit_logs"), "compat fixes admin_audit_logs");
  assert(sql.includes("schema_migrations"), "compat upgrades schema_migrations");
  assert(sql.includes("table_name"), "compat adds table_name column");
});

test("process-import-jobs cron runs watchdog", () => {
  const src = readFileSync(join(root, "lib/api-handlers/cron/process-import-jobs.js"), "utf8");
  assert(src.includes("runImportJobWatchdog"), "cron must run watchdog");
  assert(src.includes("processQueuedImportJobs"), "cron must process queue");
});

test("staging aborts when job id is not persisted", async () => {
  const { stageImportRows } = await import("../lib/content-import/import-jobs.mjs");
  const fakeJobId = "00000000-0000-4000-8000-000000000099";
  const staged = await stageImportRows(fakeJobId, [{ text: "x" }], 0);
  const adminConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (adminConfigured) {
    assert(!staged.ok, "staging must fail for non-existent job when admin configured");
    assert(staged.code === "job_not_persisted" || staged.code === "job_lookup_failed", "staging error code");
  } else {
    assert(!staged.ok && staged.code === "job_not_found", "memory mode rejects unknown job");
  }
});

test("startImportJob returns error when createImportJob fails", async () => {
  const { startImportJob } = await import("../lib/content-import/engine.mjs");
  const bad = await startImportJob({ type: "not-a-real-type", filename: "x.csv", totalRows: 1 });
  assert(!bad.ok && bad.code === "unsupported_type", "unsupported type rejected");
});

test("async job queue and dry-run process benefits", async () => {
  const { startImportJob, stageImportBatch, queueImportJob, processImportJob } = await import(
    "../lib/content-import/engine.mjs"
  );
  const rows = [{ text: "فائدة async" }, { text: "فائدة ثانية" }];
  const started = await startImportJob({ type: "benefits", filename: "t.csv", totalRows: 2 });
  assert(started.ok && started.jobId, "job started");
  const staged = await stageImportBatch(started.jobId, rows, 0);
  assert(staged.ok, "staged");
  const queued = await queueImportJob(started.jobId);
  assert(queued.ok, "queued");
  const result = await processImportJob(started.jobId, { dryRun: true });
  assert(result.ok, "processed dry-run");
  assert(result.report?.stats?.imported === 2, "imported 2");
});

await Promise.all(pendingTests);

console.log(`\nContent Import Engine tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
