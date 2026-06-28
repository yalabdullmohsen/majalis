#!/usr/bin/env node
/**
 * Restore real Kuwait lessons from canonical import file (no trial/demo data).
 *
 * Usage:
 *   node scripts/restore-real-lessons.mjs --dry-run
 *   node scripts/restore-real-lessons.mjs --execute
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { runContentImportRows } from "../lib/content-import/engine.mjs";
import { isTestContent } from "../lib/production-guard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const execute = process.argv.includes("--execute");
const dryRun = !execute;
const LESSONS_FILE = join(root, "data/import/02-kuwait-lessons.json");

async function removeTrialLessons(admin) {
  const { data } = await admin.from("lessons").select("id, title, external_key, mosque").limit(5000);
  const trial = (data || []).filter((row) => isTestContent(row));
  console.log(`Found ${trial.length} trial/demo lessons to remove`);
  if (!execute) return trial.length;

  let deleted = 0;
  for (const row of trial) {
    const { error } = await admin.from("lessons").delete().eq("id", row.id);
    if (!error) deleted += 1;
  }
  console.log(`Deleted ${deleted} trial lessons`);
  return deleted;
}

async function main() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("✗ SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }

  console.log(`Restore real lessons (${dryRun ? "dry-run" : "execute"})\n`);

  const raw = JSON.parse(readFileSync(LESSONS_FILE, "utf8"));
  const clean = raw
    .filter((row) => !isTestContent(row))
    .map((row) => ({
      ...row,
      source_url: row.source_url || "https://www.majlisilm.com/lessons",
    }));
  console.log(`Source: ${LESSONS_FILE} — ${clean.length} real lessons (${raw.length - clean.length} skipped)`);

  await removeTrialLessons(admin);

  const report = await runContentImportRows({
    type: "lessons",
    rows: clean,
    dryRun,
    source: LESSONS_FILE,
  });

  console.log(`Import: read=${report.stats?.read} imported=${report.stats?.imported} skipped=${report.stats?.skipped}`);
  if (!report.ok) {
    console.error("Import errors:", report.validationErrors || report.errors);
    process.exit(1);
  }

  const { count } = await admin
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  console.log(`\nApproved lessons in DB: ${count ?? "?"}`);
  console.log(dryRun ? "Run with --execute to apply" : "✓ Real lessons restored");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
