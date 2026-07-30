#!/usr/bin/env node
/**
 * Fail if runtime HTTP/Admin/Cron/content-import paths can apply DDL.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const majalis = join(root, "artifacts", "majalis");

const DDL =
  /\b(CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|CREATE\s+INDEX|CREATE\s+(OR\s+REPLACE\s+)?FUNCTION|CREATE\s+POLICY|DROP\s+POLICY)\b/i;

const FORBIDDEN_CALLS =
  /\b(applyMigrations|ensureSchemaReady|runActivationMigrations|runActivationTableMigrations|ensureContentImportSchema|ensureImportTables)\s*\(/;

const SCAN_DIRS = [
  join(majalis, "lib", "api-handlers"),
  join(majalis, "lib", "api"),
  join(majalis, "lib", "content-import"),
  join(majalis, "lib", "jobs"),
  join(majalis, "api"),
];

/** Files that may mention migration helpers but must not invoke apply from HTTP trees */
const FORBIDDEN_CALL_FILES = [
  "lib/api-handlers/admin/platform-bootstrap.js",
  "lib/api-handlers/admin/production-activate.js",
  "lib/api-handlers/cron/apply-migrations.js",
  "lib/api-handlers/cron/bootstrap-database.js",
  "lib/content-import/ensure-schema.mjs",
  "lib/content-import/import-jobs.mjs",
  "lib/content-import/phase2-trial.mjs",
  "lib/platform-bootstrap-state.mjs",
];

const ALLOW_DDL_PATH_SUBSTR = [
  "/supabase/",
  "/migrations/",
  ".migration-backup/",
  "/lib/db-migrate",
  "/lib/migration-runner",
  "/lib/migration-tracker",
  "/lib/migration-paths",
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "__tests__") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(mjs|js|cjs|ts)$/.test(name)) out.push(p);
  }
  return out;
}

let failed = 0;
console.log("=== verify-no-runtime-ddl ===\n");

const files = SCAN_DIRS.flatMap((d) => walk(d));
for (const file of files) {
  const rel = relative(majalis, file).replace(/\\/g, "/");
  if (ALLOW_DDL_PATH_SUBSTR.some((s) => file.includes(s) || rel.includes(s.replace(/^\//, "")))) {
    continue;
  }
  const body = readFileSync(file, "utf8");
  if (!DDL.test(body)) continue;

  if (rel === "lib/database.mjs" && !/\bDROP\s+TABLE\b/i.test(body) && /_db_connection_test/.test(body)) {
    console.log(`  ~ ${rel}: allowed connection-test DDL`);
    continue;
  }

  console.error(`  ✗ ${rel}: contains DDL`);
  failed++;
}

// platform-bootstrap-state must not contain executable schema DDL
{
  const rel = "lib/platform-bootstrap-state.mjs";
  const full = join(majalis, rel);
  const body = readFileSync(full, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  if (/\bCREATE\s+TABLE\b/i.test(body) || /\bENSURE_BOOTSTRAP_STATE_SQL\b/.test(body)) {
    console.error(`  ✗ ${rel}: runtime schema DDL forbidden`);
    failed++;
  } else {
    console.log(`  ✓ ${rel}: no runtime schema DDL`);
  }
}

// ensure-schema / import-jobs must not query migration SQL
for (const rel of ["lib/content-import/ensure-schema.mjs", "lib/content-import/import-jobs.mjs"]) {
  const full = join(majalis, rel);
  const body = readFileSync(full, "utf8");
  if (/client\.query\(\s*sql\s*\)/.test(body) || /client\.query\(\s*ENSURE_/.test(body)) {
    console.error(`  ✗ ${rel}: still applies SQL via client.query`);
    failed++;
  } else if (/CREATE\s+TABLE/i.test(body)) {
    console.error(`  ✗ ${rel}: contains CREATE TABLE`);
    failed++;
  } else {
    console.log(`  ✓ ${rel}: verify-only (no DDL apply)`);
  }
}

for (const rel of [
  "lib/api-handlers/cron/apply-migrations.js",
  "lib/api-handlers/cron/bootstrap-database.js",
  "lib/api-handlers/admin/platform-bootstrap.js",
  "lib/api-handlers/admin/production-activate.js",
]) {
  const full = join(majalis, rel);
  if (!existsSync(full)) {
    console.error(`  ✗ missing ${rel}`);
    failed++;
    continue;
  }
  const body = readFileSync(full, "utf8");
  if (/applyMigrations\s*\(/.test(body) || /ensureSchemaReady\s*\(/.test(body)) {
    console.error(`  ✗ ${rel}: still invokes applyMigrations/ensureSchemaReady`);
    failed++;
  } else if (/runActivationMigrations\s*\(/.test(body) || /runPlatformBootstrap\s*\(/.test(body)) {
    console.error(`  ✗ ${rel}: still invokes activation/bootstrap mutate helpers`);
    failed++;
  } else if (/ALLOW_RUNTIME_SCHEMA_MIGRATIONS/.test(body)) {
    console.error(`  ✗ ${rel}: still references ALLOW_RUNTIME_SCHEMA_MIGRATIONS escape hatch`);
    failed++;
  } else if (!/runtime_schema_migrations_disabled|verify_only|schemaMutationBlocked/.test(body) && rel.includes("admin")) {
    console.error(`  ✗ ${rel}: must advertise verify-only / schemaMutationBlocked`);
    failed++;
  } else {
    console.log(`  ✓ ${rel}: no runtime DDL apply`);
  }
}

// Forbidden call patterns in HTTP-adjacent files
for (const rel of FORBIDDEN_CALL_FILES) {
  const full = join(majalis, rel);
  if (!existsSync(full)) continue;
  const body = readFileSync(full, "utf8");
  // allow function *definitions* named ensure* that delegate to verify — ban applyMigrations etc.
  if (/\b(applyMigrations|ensureSchemaReady|runActivationMigrations|runActivationTableMigrations)\s*\(/.test(body)) {
    console.error(`  ✗ ${rel}: forbidden migration apply call`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nNo runtime DDL violations.");
