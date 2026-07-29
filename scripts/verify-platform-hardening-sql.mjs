#!/usr/bin/env node
/**
 * Static gate: platform hardening SQL + rollback exist and contain required guards.
 * Does NOT apply SQL to any database.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlPath = join(
  root,
  "artifacts/majalis/supabase/platform_hardening_security_v1.sql",
);
const rollbackPath = join(
  root,
  "artifacts/majalis/supabase/platform_hardening_security_v1_ROLLBACK.sql",
);

const failures = [];

function requireFile(path, label) {
  if (!existsSync(path)) failures.push(`missing ${label}: ${path}`);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const sql = requireFile(sqlPath, "hardening SQL");
const rollback = requireFile(rollbackPath, "rollback SQL");

const mustInclude = [
  "REQUIRES_EXPLICIT_APPROVAL",
  "FORCE ROW LEVEL SECURITY",
  "USING (false)",
  "WITH CHECK (false)",
  "SET search_path = pg_catalog, public",
  "REVOKE ALL ON FUNCTION public.is_admin()",
  "governance_user_roles",
  "background_jobs",
  "ai_provider_circuit",
  "increment_fiqh_item_views",
  "record_lesson_view",
];

const sqlNoComments = sql
  .split("\n")
  .filter((line) => !/^\s*--/.test(line))
  .join("\n");

const mustNotMatch = [
  { re: /USING\s*\(\s*true\s*\)/i, label: "USING (true) policy" },
  { re: /WITH\s+CHECK\s*\(\s*true\s*\)/i, label: "WITH CHECK (true) policy" },
  { re: /\\i\s+/i, label: "psql \\i include" },
  { re: /\bDROP\s+TABLE\b/i, label: "DROP TABLE" },
  { re: /\bTRUNCATE\b/i, label: "TRUNCATE" },
  { re: /\buser_metadata\b/i, label: "user_metadata privilege proof" },
];

for (const needle of mustInclude) {
  if (!sql.includes(needle)) failures.push(`hardening SQL missing: ${needle}`);
}
for (const { re, label } of mustNotMatch) {
  if (re.test(sqlNoComments)) failures.push(`hardening SQL forbidden: ${label}`);
}
if (!rollback.includes("DROP POLICY IF EXISTS deny_all_select")) {
  failures.push("rollback missing deny_all_select drops");
}
if (!rollback.includes("REQUIRES_EXPLICIT_APPROVAL")) {
  failures.push("rollback missing approval marker");
}

if (failures.length) {
  console.error("verify-platform-hardening-sql FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("verify-platform-hardening-sql OK");
