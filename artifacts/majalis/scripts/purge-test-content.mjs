#!/usr/bin/env node
/**
 * Purge test/mock/quiz misclassified content from production tables.
 * Usage:
 *   node scripts/purge-test-content.mjs --dry-run
 *   node scripts/purge-test-content.mjs --apply
 */
import { containsBlockedContentMarker } from "../lib/production/content-sanitizer.mjs";
import { shouldPurgeFawaidRow, fawaidRowToQaCandidate } from "../lib/production/fawaid-cleanup.mjs";

const BLOCKED = [
  /\b(?:e2e|mock|placeholder|dummy|fixture|debug|sample|verification)\b/i,
  /\[import-\d+\]\s*$/i,
  /\[verify-/i,
  /^test[-_\s]/i,
  /\btest data\b/i,
];

const TABLES = [
  { table: "lessons", fields: ["title", "description", "speaker_name"] },
  { table: "fawaid", fields: ["text", "author_name"], custom: "fawaid" },
  { table: "qa_questions", fields: ["question", "answer"] },
  { table: "library_items", fields: ["title", "description"] },
  { table: "scientific_miracles", fields: ["title", "body"] },
  { table: "platform_updates", fields: ["title", "summary", "body"] },
  { table: "knowledge_items", fields: ["raw_title", "raw_body"] },
  { table: "content_engine_review_queue", fields: ["title", "body", "summary"] },
];

function isBlocked(record, fields, custom) {
  if (custom === "fawaid" && shouldPurgeFawaidRow(record)) {
    return { field: "text", value: String(record.text || "").slice(0, 80) };
  }
  for (const field of fields) {
    const val = record[field];
    if (typeof val === "string" && containsBlockedContentMarker(val)) {
      return { field, value: val.slice(0, 80) };
    }
    for (const re of BLOCKED) {
      if (typeof val === "string" && re.test(val)) return { field, value: val.slice(0, 80) };
    }
  }
  return null;
}

async function fetchAll(admin, table, fields) {
  const rows = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await admin
      .from(table)
      .select(`id, ${fields.join(", ")}`)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

const dryRun = process.argv.includes("--dry-run") || !process.argv.includes("--apply");

async function main() {
  const { getSupabaseAdmin } = await import("../lib/supabase-admin.mjs");
  const admin = getSupabaseAdmin();

  if (!admin) {
    console.error("✗ Supabase admin not configured — set SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL");
    process.exit(1);
  }

  let totalFound = 0;
  let totalDeleted = 0;
  let qaMigrated = 0;

  for (const { table, fields, custom } of TABLES) {
    let data;
    try {
      data = await fetchAll(admin, table, fields);
    } catch (err) {
      console.log(`⊘ ${table}: ${err.message}`);
      continue;
    }

    const blocked = data.filter((row) => isBlocked(row, fields, custom));
    if (blocked.length === 0) {
      console.log(`✓ ${table}: clean (${data.length} rows scanned)`);
      continue;
    }

    totalFound += blocked.length;
    console.log(`⚠ ${table}: ${blocked.length} blocked row(s) of ${data.length}`);
    for (const row of blocked.slice(0, 3)) {
      const hit = isBlocked(row, fields, custom);
      console.log(`  id=${row.id} field=${hit?.field} value="${hit?.value}"`);
    }

    if (!dryRun && table === "fawaid") {
      for (const row of blocked) {
        const qa = fawaidRowToQaCandidate(row);
        if (qa) {
          const { error: qaErr } = await admin.from("qa_questions").insert({
            question: qa.question,
            answer: qa.answer,
            status: "draft",
            external_key: `migrated-fawaid:${row.id}`,
          });
          if (!qaErr) qaMigrated++;
        }
      }
    }

    if (!dryRun) {
      for (let i = 0; i < blocked.length; i += 100) {
        const batch = blocked.slice(i, i + 100).map((r) => r.id);
        const { error: delErr } = await admin.from(table).delete().in("id", batch);
        if (delErr) {
          console.error(`  Delete failed (${table}): ${delErr.message}`);
          break;
        }
        totalDeleted += batch.length;
      }
    }
  }

  console.log(`\n${dryRun ? "DRY RUN" : "APPLIED"}: found=${totalFound} deleted=${totalDeleted} qa_migrated=${qaMigrated}`);
  process.exit(dryRun && totalFound > 0 ? 0 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
