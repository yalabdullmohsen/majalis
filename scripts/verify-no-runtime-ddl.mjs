#!/usr/bin/env node
/**
 * Fail if runtime (non-migration) files contain DDL statements.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const majalis = join(root, "artifacts", "majalis");

const DDL =
  /\b(CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|CREATE\s+INDEX|CREATE\s+(OR\s+REPLACE\s+)?FUNCTION|CREATE\s+POLICY|DROP\s+POLICY)\b/i;

const SCAN_DIRS = [
  join(majalis, "lib", "api-handlers"),
  join(majalis, "lib", "api"),
  join(majalis, "api"),
];

const ALLOW_PATH_SUBSTR = [
  "/supabase/",
  "/migrations/",
  ".migration-backup/",
  "/lib/db-migrate",
  "/lib/migration-runner",
  "/lib/migration-tracker",
  "/lib/migration-paths",
  "/lib/content-import/ensure-schema",
  "/lib/platform-bootstrap-state", // documented legacy DDL helper — must not be called from HTTP
  "/lib/database.mjs", // connection test table only — flagged separately if CREATE TABLE present
];

const ALLOW_FILES_WITH_REASON = new Map([
  [
    "lib/database.mjs",
    "_db_connection_test only — not schema migration; still scanned for DROP/ALTER policy",
  ],
]);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
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
  if (ALLOW_PATH_SUBSTR.some((s) => rel.includes(s.replace(/^\//, "")) || file.includes(s))) {
    continue;
  }
  const body = readFileSync(file, "utf8");
  if (!DDL.test(body)) continue;

  // Special-case: database.mjs may create ephemeral test table
  if (rel === "lib/database.mjs" && !/\bDROP\s+TABLE\b/i.test(body) && /_db_connection_test/.test(body)) {
    console.log(`  ~ ${rel}: allowed connection-test DDL (${ALLOW_FILES_WITH_REASON.get(rel)})`);
    continue;
  }

  console.error(`  ✗ ${rel}: contains DDL`);
  failed++;
}

// Hard: apply-migrations / bootstrap must not import applyMigrations
for (const rel of [
  "lib/api-handlers/cron/apply-migrations.js",
  "lib/api-handlers/cron/bootstrap-database.js",
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
  } else {
    console.log(`  ✓ ${rel}: no applyMigrations/ensureSchemaReady`);
  }
  if (/ALLOW_RUNTIME_SCHEMA_MIGRATIONS/.test(body)) {
    console.error(`  ✗ ${rel}: still references ALLOW_RUNTIME_SCHEMA_MIGRATIONS escape hatch`);
    failed++;
  }
}

if (failed) {
  console.error(`\n${failed} issue(s)`);
  process.exit(1);
}
console.log("\nNo runtime DDL violations.");
