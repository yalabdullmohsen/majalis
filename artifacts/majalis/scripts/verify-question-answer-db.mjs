#!/usr/bin/env node
/**
 * Verify سؤال وجواب database — sin_jeem_questions must have >= 500 published rows.
 */
import { createClient } from "@supabase/supabase-js";
import { verifySinJeemSchema } from "../lib/sin-jeem-migration.mjs";
import { SIN_JEEM_TABLES } from "../lib/sin-jeem-migration.mjs";
import { getBankAudit } from "../lib/question-answer-bank.mjs";

let pass = 0;
let fail = 0;
let skip = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`✓ ${m}`);
  } else {
    fail++;
    console.error(`✗ ${m}`);
  }
}

function skipped(m) {
  skip++;
  console.log(`⊘ ${m}`);
}

async function main() {
  console.log("\n=== سؤال وجواب — DB Verification ===\n");
  console.log("Source table: sin_jeem_questions (NOT quiz_questions)");
  const audit = getBankAudit();
  ok(audit.productionReady >= 500, `Local bank >= 500 (${audit.productionReady})`);
  ok(audit.categoriesInSeed >= 20, `Category seed >= 20 (${audit.categoriesInSeed})`);

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasDb = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_ACCESS_TOKEN);

  if (hasDb) {
    const schema = await verifySinJeemSchema();
    ok(schema.ok, `Schema verify (${schema.tableCount}/${SIN_JEEM_TABLES.length} tables)`);
    if (schema.missing?.length) ok(false, `Missing tables: ${schema.missing.join(", ")}`);
  } else {
    skipped("DATABASE_URL not set — pg schema verify skipped");
  }

  if (!url) {
    skipped("SUPABASE_URL not set — REST checks skipped");
    console.log(`\nResult: ${pass} passed, ${fail} failed, ${skip} skipped`);
    process.exit(fail > 0 ? 1 : 0);
  }

  const key = serviceKey || process.env.VITE_SUPABASE_ANON_KEY;
  const sb = createClient(url, key);

  for (const table of ["sin_jeem_categories", "sin_jeem_questions", "sin_jeem_leaderboard_entries"]) {
    const { error } = await sb.from(table).select("id").limit(1);
    if (error?.code === "PGRST205" || error?.code === "42P01") {
      ok(false, `Table exists: ${table}`);
    } else if (error && !serviceKey) {
      skipped(`Table ${table}: ${error.message}`);
    } else {
      ok(!error, `Table reachable: ${table}`);
    }
  }

  // Report empty legacy quiz tables (informational)
  for (const legacy of ["quiz_questions", "platform_quiz_questions", "learning_quiz_questions"]) {
    const { count } = await sb.from(legacy).select("*", { count: "exact", head: true });
    console.log(`  ℹ ${legacy}: ${count ?? 0} rows (not used by game)`);
  }

  if (serviceKey) {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { count: qCount } = await admin
      .from("sin_jeem_questions")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");
    ok((qCount || 0) >= 500, `sin_jeem_questions published >= 500 (${qCount || 0})`);

    const { count: cCount } = await admin.from("sin_jeem_categories").select("*", { count: "exact", head: true });
    ok((cCount || 0) >= 20, `sin_jeem_categories >= 20 (${cCount || 0})`);

    const { data: dupCheck } = await admin.from("sin_jeem_questions").select("content_hash").not("content_hash", "is", null);
    const hashes = (dupCheck || []).map((r) => r.content_hash);
    ok(new Set(hashes).size === hashes.length, "No duplicate content_hash values");
  } else {
    skipped("SERVICE_ROLE_KEY not set — row count checks skipped");
  }

  console.log(`\nResult: ${pass} passed, ${fail} failed, ${skip} skipped`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
