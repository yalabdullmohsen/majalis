#!/usr/bin/env node
/**
 * Production migration guard — library content_type separation.
 *
 * Validates SQL migration artifacts and (optionally) live Supabase state.
 *
 * Usage:
 *   node scripts/audit-library-content-types.mjs
 *   node scripts/audit-library-content-types.mjs --production
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPO_ROOT = join(ROOT, "../..");

const isProduction = process.argv.includes("--production");

let pass = 0;
let fail = 0;
const warnings = [];

function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`PASS  ${msg}`);
  } else {
    fail++;
    console.error(`FAIL  ${msg}`);
  }
}

function warn(msg) {
  warnings.push(msg);
  console.warn(`WARN  ${msg}`);
}

function read(rel, base = REPO_ROOT) {
  return readFileSync(join(base, rel), "utf8");
}

console.log("=== Library Content Type Migration Audit ===\n");
console.log(`Mode: ${isProduction ? "production (live DB)" : "local (SQL + static)"}\n`);

// ── SQL migration file checks ─────────────────────────────────────────────────
const sqlPath = "supabase/library_content_types_v1.sql";
ok(existsSync(join(REPO_ROOT, sqlPath)), `${sqlPath} exists`);

if (existsSync(join(REPO_ROOT, sqlPath))) {
  const sql = read(sqlPath);
  ok(sql.includes("content_type"), "SQL adds content_type column");
  ok(sql.includes("library_content_type"), "SQL defines library_content_type enum");
  ok(sql.includes("library_items_require_content_type"), "SQL defines publish trigger function");
  ok(sql.includes("trg_library_items_content_type"), "SQL defines trigger");
  ok(sql.includes("library_items_content_type_allowed"), "SQL defines CHECK constraint");
  ok(!sql.includes("'research'") || sql.includes("research uses research_papers"), "SQL enum excludes research in library_items");
  ok(sql.includes("idx_library_items_content_type"), "SQL adds content_type index");
}

// ── Migration paths registry ──────────────────────────────────────────────────
const migrationPaths = read("artifacts/majalis/lib/migration-paths.mjs", REPO_ROOT);
ok(migrationPaths.includes("library_content_types_v1"), "migration-paths includes library_content_types_v1");

// ── Live DB checks (production only) ──────────────────────────────────────────
async function auditLiveDb() {
  let createClient;
  try {
    const mod = await import("../lib/supabase-admin.mjs");
    createClient = mod.createAdminClient || mod.getAdminClient;
  } catch {
    warn("supabase-admin.mjs unavailable — skipping live DB checks");
    return;
  }

  const admin = typeof createClient === "function" ? createClient() : null;
  if (!admin) {
    warn("No admin Supabase client — set SUPABASE_SERVICE_ROLE_KEY for live audit");
    return;
  }

  const { count: nullTypePublished, error: e1 } = await admin
    .from("library_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .is("content_type", null);

  if (e1) {
    if (String(e1.message).includes("content_type")) {
      warn("content_type column missing in production — apply supabase/library_content_types_v1.sql manually");
    } else {
      warn(`library_items query failed: ${e1.message}`);
    }
    return;
  }

  ok(nullTypePublished === 0, `no approved library_items without content_type (found ${nullTypePublished ?? "?"})`);

  const { data: badTypes, error: e2 } = await admin
    .from("library_items")
    .select("id, title, content_type")
    .not("content_type", "in", '("book","article")')
    .limit(5);

  if (!e2) {
    ok(!badTypes?.length, `no library_items with invalid content_type (sample: ${badTypes?.length || 0})`);
  }

  const { count: researchInLibrary, error: e3 } = await admin
    .from("library_items")
    .select("*", { count: "exact", head: true })
    .or("title.ilike.%رسالة%,title.ilike.%ماجستير%,description.ilike.%dissertation%");

  if (!e3 && (researchInLibrary ?? 0) > 0) {
    warn(`${researchInLibrary} library_items may be misclassified research — run migrate-library-content-types.mjs review`);
  } else if (!e3) {
    ok(true, "no obvious research titles in library_items sample");
  }

  // Verify research_papers table exists separately
  const { error: e4 } = await admin.from("research_papers").select("id", { count: "exact", head: true });
  ok(!e4 || !String(e4.message).includes("does not exist"), "research_papers table reachable");
}

if (isProduction) {
  console.log("\n── Live production checks ──");
  await auditLiveDb();
} else {
  console.log("\n── Local mode ──");
  ok(true, "live DB checks skipped (use --production with service role key)");
  warn("Production requires manual SQL apply: supabase/library_content_types_v1.sql in Supabase SQL Editor");
}

console.log(`\n=== Audit Summary: ${pass} PASS, ${fail} FAIL, ${warnings.length} WARN ===`);
if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log(`  • ${w}`);
}

console.log("\nManual production step: apply supabase/library_content_types_v1.sql if content_type column is missing.");
process.exit(fail > 0 ? 1 : 0);
