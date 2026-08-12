#!/usr/bin/env node
/**
 * End-to-end adhkar import verification (local DB or production API).
 *
 * Usage:
 *   node scripts/verify-production-adhkar-import.mjs
 *   node scripts/verify-production-adhkar-import.mjs --production
 *   node scripts/verify-production-adhkar-import.mjs --production --dry-run
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseContentFile } from "../lib/content-import/parsers.mjs";
import { validateAllRows } from "../lib/content-import/engine.mjs";
import {
  startImportJob,
  stageImportBatch,
  queueImportJob,
  processImportJob,
  getImportJobProgress,
} from "../lib/content-import/engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const production = process.argv.includes("--production");
const dryRun = process.argv.includes("--dry-run");
const PRODUCTION = process.env.MAJALIS_PRODUCTION_URL || "https://majlisilm.com";
const CSV_PATH = join(root, "data/imports/adhkar.csv");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runLocalImport() {
  if (!existsSync(CSV_PATH)) {
    throw new Error(`Missing ${CSV_PATH}`);
  }
  const rows = parseContentFile(CSV_PATH);
  const { allValid } = validateAllRows("adhkar", rows);
  if (!allValid) throw new Error("adhkar.csv validation failed");

  const started = await startImportJob({
    type: "adhkar",
    filename: "adhkar.csv",
    totalRows: rows.length,
    createdBy: "service",
  });
  if (!started.ok) throw new Error(`startImportJob failed: ${started.error} (${started.code})`);

  const staged = await stageImportBatch(started.jobId, rows, 0);
  if (!staged.ok) throw new Error(`stageImportBatch failed: ${staged.error} (${staged.code})`);

  const queued = await queueImportJob(started.jobId);
  if (!queued.ok) throw new Error(`queueImportJob failed: ${queued.error}`);

  const result = await processImportJob(started.jobId, { dryRun });
  if (!result.ok) throw new Error(`processImportJob failed: ${result.error || result.report?.importErrors?.join("; ")}`);

  console.log(`✓ adhkar.csv import ${dryRun ? "(dry-run) " : ""}OK — ${rows.length} rows`);
  return { ok: true, jobId: started.jobId, rows: rows.length, dryRun };
}

async function runProductionApiImport() {
  const token = process.env.ADMIN_IMPORT_JWT || process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.log("⊘ production API import skipped — set ADMIN_IMPORT_JWT (owner session token)");
    return { ok: true, skipped: true };
  }

  const rows = parseContentFile(CSV_PATH);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const base = `${PRODUCTION}/api/admin/content-import`;

  const startRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "start", type: "adhkar", filename: "adhkar.csv", totalRows: rows.length }),
  });
  const started = await startRes.json();
  if (!startRes.ok || !started.ok) {
    throw new Error(`production start failed: ${startRes.status} ${JSON.stringify(started)}`);
  }

  const stageRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "stage", jobId: started.jobId, rows, startIndex: 0 }),
  });
  const staged = await stageRes.json();
  if (!stageRes.ok || !staged.ok) {
    throw new Error(`production stage failed: ${stageRes.status} ${JSON.stringify(staged)}`);
  }

  const commitRes = await fetch(base, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "commit", jobId: started.jobId, dryRun }),
  });
  const committed = await commitRes.json();
  if (!commitRes.ok && commitRes.status !== 202) {
    throw new Error(`production commit failed: ${commitRes.status} ${JSON.stringify(committed)}`);
  }

  if (committed.sync && committed.status === "completed") {
    console.log(`✓ production adhkar.csv sync import OK — job ${started.jobId}`);
    return { ok: true, jobId: started.jobId, rows: rows.length, sync: true };
  }

  if (committed.sync && committed.status === "failed") {
    throw new Error(`production sync import failed: ${JSON.stringify(committed)}`);
  }

  for (let i = 0; i < 120; i++) {
    const kick = i >= 3 ? "&kick=1" : "";
    const progRes = await fetch(`${base}?action=progress&jobId=${started.jobId}${kick}`, { headers });
    const prog = await progRes.json();
    if (prog.job?.status === "completed" || prog.job?.status === "failed") {
      if (prog.job.status === "failed") {
        throw new Error(`production import failed: ${JSON.stringify(prog.job.import_errors)}`);
      }
      console.log(
        `✓ production adhkar.csv import OK — job ${started.jobId} (${prog.job.imported} imported, ${prog.job.progress_pct}%)`,
      );
      return { ok: true, jobId: started.jobId, rows: rows.length };
    }
    await sleep(1000);
  }
  throw new Error("production import timed out waiting for completion");
}

async function main() {
  console.log(`Adhkar import verification (${production ? "production" : "local"})${dryRun ? " [dry-run]" : ""}\n`);

  if (production) {
    const result = await runProductionApiImport();
    if (!result.skipped) {
      process.exit(result.ok ? 0 : 1);
    }
    console.log("Falling back to local dry-run (no ADMIN_IMPORT_JWT)\n");
    await runLocalImport();
    process.exit(0);
  }

  await runLocalImport();
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
