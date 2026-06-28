#!/usr/bin/env node
/**
 * Phase 8 — Identify and optionally purge test/mock/placeholder content from production tables.
 * Usage:
 *   node scripts/purge-test-content.mjs --dry-run
 *   node scripts/purge-test-content.mjs --apply  (requires DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 */
import { containsBlockedContentMarker } from "../lib/production/content-sanitizer.mjs";

const BLOCKED = [
  /\b(?:e2e|mock|placeholder|dummy|fixture|debug|sample|verification)\b/i,
  /\[import-\d+\]\s*$/i,
  /\[verify-/i,
  /^test[-_\s]/i,
  /\btest data\b/i,
];

const TABLES = [
  { table: "lessons", fields: ["title", "description", "speaker_name"] },
  { table: "fawaid", fields: ["text", "author_name"] },
  { table: "qa_questions", fields: ["question", "answer"] },
  { table: "library_items", fields: ["title", "description"] },
  { table: "scientific_miracles", fields: ["title", "body"] },
  { table: "platform_updates", fields: ["title", "summary", "body"] },
  { table: "knowledge_items", fields: ["raw_title", "raw_body"] },
];

function isBlocked(record, fields) {
  for (const field of fields) {
    const val = record[field];
    if (typeof val === "string" && containsBlockedContentMarker(val)) return { field, value: val.slice(0, 80) };
    for (const re of BLOCKED) {
      if (typeof val === "string" && re.test(val)) return { field, value: val.slice(0, 80) };
    }
  }
  return null;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--apply");

async function main() {
  const { getSupabaseAdmin } = await import("../lib/supabase-admin.mjs");
  const admin = getSupabaseAdmin();

  if (!admin) {
    console.log("⊘ Supabase admin not configured — running local pattern check only");
    ok(true, "Sanitizer patterns loaded");
    for (const re of BLOCKED) {
      console.log(`  Pattern: ${re}`);
    }
    process.exit(0);
  }

  let totalFound = 0;
  let totalDeleted = 0;

  for (const { table, fields } of TABLES) {
    const { data, error } = await admin.from(table).select(`id, ${fields.join(", ")}`).limit(5000);
    if (error) {
      console.log(`⊘ ${table}: ${error.message}`);
      continue;
    }

    const blocked = (data || []).filter((row) => isBlocked(row, fields));
    if (blocked.length === 0) {
      console.log(`✓ ${table}: clean (${data?.length || 0} rows scanned)`);
      continue;
    }

    totalFound += blocked.length;
    console.log(`⚠ ${table}: ${blocked.length} blocked row(s)`);
    for (const row of blocked.slice(0, 5)) {
      const hit = isBlocked(row, fields);
      console.log(`  id=${row.id} field=${hit?.field} value="${hit?.value}"`);
    }

    if (!dryRun) {
      const ids = blocked.map((r) => r.id);
      const { error: delErr } = await admin.from(table).delete().in("id", ids);
      if (delErr) console.error(`  Delete failed: ${delErr.message}`);
      else totalDeleted += ids.length;
    }
  }

  console.log(`\n${dryRun ? "DRY RUN" : "APPLIED"}: found=${totalFound} deleted=${totalDeleted}`);
  process.exit(0);
}

function ok(cond, msg) {
  if (cond) console.log(`✓ ${msg}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
