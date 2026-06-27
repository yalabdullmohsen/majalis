#!/usr/bin/env node
/**
 * Async import job tests — validates queue/process flow at scale (dry-run, no Supabase required).
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  startImportJob,
  stageImportBatch,
  queueImportJob,
  processImportJob,
  validateAllRows,
} from "../lib/content-import/engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fixturesDir = join(root, "data/imports/test-fixtures");

const SIZES = [100, 1000, 10_000, 100_000];

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

function makeBenefitRows(n) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    rows.push({ text: `فائدة تجريبية رقم ${i + 1} — ${crypto.randomUUID().slice(0, 8)}` });
  }
  return rows;
}

function writeCsv(rows, path) {
  const lines = ["text", ...rows.map((r) => `"${String(r.text).replace(/"/g, '""')}"`)];
  writeFileSync(path, lines.join("\n"), "utf8");
}

async function testAsyncJobDryRun(rowCount) {
  const rows = makeBenefitRows(rowCount);
  const label = `${rowCount} rows`;

  const { validRows, allValid } = validateAllRows("benefits", rows);
  assert(allValid, `${label}: all rows valid`);
  assert(validRows.length === rowCount, `${label}: valid count`);

  const started = await startImportJob({
    type: "benefits",
    filename: `benefits-${rowCount}.csv`,
    totalRows: rowCount,
  });
  assert(started.ok && started.jobId, `${label}: job started`);

  const jobId = started.jobId;
  const batchSize = 2000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const staged = await stageImportBatch(jobId, batch, i);
    assert(staged.ok, `${label}: staged batch at ${i}`);
  }

  const queued = await queueImportJob(jobId);
  assert(queued.ok && queued.status === "queued", `${label}: queued`);

  const result = await processImportJob(jobId, { dryRun: true });
  assert(result.ok, `${label}: dry-run process ok`);
  assert(result.report?.stats?.read === rowCount, `${label}: read count`);
  assert(result.report?.stats?.imported === rowCount, `${label}: imported count`);
  assert(result.timings?.validation_ms != null, `${label}: validation timing logged`);
  assert(result.timings?.total_ms != null, `${label}: total timing logged`);

  console.log(
    `✓ ${label}: validation=${result.timings.validation_ms}ms db=${result.timings.database_ms}ms total=${result.timings.total_ms}ms`,
  );
}

async function main() {
  if (!existsSync(fixturesDir)) mkdirSync(fixturesDir, { recursive: true });

  for (const n of SIZES) {
    const rows = makeBenefitRows(n);
    writeCsv(rows, join(fixturesDir, `benefits-${n}.csv`));
  }
  console.log(`Generated CSV fixtures in ${fixturesDir}\n`);

  for (const n of SIZES) {
    await testAsyncJobDryRun(n);
  }

  console.log(`\nAsync import tests: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
