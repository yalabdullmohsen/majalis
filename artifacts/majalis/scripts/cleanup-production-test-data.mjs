#!/usr/bin/env node
/**
 * Scan production tables for test/demo content and optionally delete.
 *
 * Usage:
 *   node scripts/cleanup-production-test-data.mjs           # dry-run (default)
 *   node scripts/cleanup-production-test-data.mjs --execute # delete matched rows
 */
import { getSupabaseAdmin } from "../lib/supabase-admin.mjs";
import { collectTestContentSignals, isTestContent } from "../lib/production-guard.mjs";

const execute = process.argv.includes("--execute");

const TABLE_SPECS = [
  { table: "lessons", textCols: ["title", "description", "mosque", "speaker_name", "external_key"] },
  { table: "sheikhs", textCols: ["name", "bio", "city"] },
  { table: "fawaid", textCols: ["text", "author_name", "category", "source"] },
  { table: "qa_questions", textCols: ["question", "answer", "reference"] },
  { table: "library_items", textCols: ["title", "description", "author", "content"] },
  { table: "sharia_rulings", textCols: ["title", "body", "summary", "external_key"] },
  { table: "verified_adhkar_items", textCols: ["text", "source_name", "reference"] },
  { table: "verified_hadith_items", textCols: ["text", "title", "source_name"] },
  { table: "akp_stories", textCols: ["title", "body", "summary"] },
  { table: "platform_quiz_questions", textCols: ["question", "answer", "section"] },
  { table: "content_import_jobs", textCols: ["filename", "created_by"] },
  { table: "content_import_staging", textCols: ["status", "error"] },
];

async function scanTable(admin, spec) {
  const { data, error } = await admin.from(spec.table).select("*").limit(5000);
  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") return { table: spec.table, skipped: true, matches: [] };
    throw new Error(`${spec.table}: ${error.message}`);
  }

  const matches = [];
  for (const row of data || []) {
    if (isTestContent(row)) {
      matches.push({
        id: row.id || row.external_key,
        signals: collectTestContentSignals(row).slice(0, 3),
        preview: String(row.title || row.text || row.question || row.name || "").slice(0, 80),
      });
    }
  }
  return { table: spec.table, skipped: false, total: data?.length || 0, matches };
}

async function deleteMatches(admin, spec, matches) {
  let deleted = 0;
  for (const m of matches) {
    if (!m.id) continue;
    const { error } = await admin.from(spec.table).delete().eq("id", m.id);
    if (!error) deleted += 1;
    else if (spec.table === "lessons" && m.id) {
      const { error: ekErr } = await admin.from(spec.table).delete().eq("external_key", m.id);
      if (!ekErr) deleted += 1;
    }
  }
  return deleted;
}

async function main() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.error("✗ SUPABASE_SERVICE_ROLE_KEY required");
    process.exit(1);
  }

  console.log(`Production test-data cleanup (${execute ? "EXECUTE" : "dry-run"})\n`);

  let totalMatches = 0;
  let totalDeleted = 0;

  for (const spec of TABLE_SPECS) {
    const result = await scanTable(admin, spec);
    if (result.skipped) {
      console.log(`⊘ ${spec.table} — table not found`);
      continue;
    }

    console.log(`• ${spec.table}: ${result.matches.length} test/demo rows (of ${result.total})`);
    for (const m of result.matches.slice(0, 5)) {
      console.log(`    - ${m.id}: ${m.preview}`);
    }
    if (result.matches.length > 5) console.log(`    … +${result.matches.length - 5} more`);

    totalMatches += result.matches.length;

    if (execute && result.matches.length) {
      const deleted = await deleteMatches(admin, spec, result.matches);
      totalDeleted += deleted;
      console.log(`    → deleted ${deleted}`);
    }
  }

  console.log(`\nTotal matched: ${totalMatches}`);
  if (execute) {
    console.log(`Total deleted: ${totalDeleted}`);
    console.log(execute && totalMatches > 0 ? "✓ Cleanup executed" : "✓ Nothing to delete");
  } else {
    console.log("Run with --execute to delete matched rows");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
