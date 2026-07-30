/**
 * Static audit: flag FOR ALL USING (true) policies that are not limited to service_role.
 * Does not connect to production DB.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walkSql(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkSql(full, out);
    else if (name.endsWith(".sql")) out.push(full);
  }
  return out;
}

const cwd = process.cwd();
const searchRoots = [join(cwd, "../../supabase"), join(cwd, "supabase")];
const files = searchRoots.flatMap((r) => walkSql(r));
assert.ok(files.length > 10, `expected SQL files, found ${files.length}`);

const dangerous = [];
const allowListed = new Set(["20260729_enterprise_phase5_hardening.sql"]);

/** Matches only the dangerous form: FOR ALL … USING (true) without TO service_role. */
const policyOpenAll =
  /for\s+all(?![^\n;]{0,80}to\s+service_role)\s+using\s*\(\s*true\s*\)/gi;

for (const file of files) {
  const base = file.split(/[/\\]/).pop() || file;
  if (allowListed.has(base)) continue;
  const sql = readFileSync(file, "utf8");
  const matches = sql.match(policyOpenAll) || [];
  for (const m of matches) {
    dangerous.push(`${base}: ${m.replace(/\s+/g, " ").slice(0, 120)}`);
  }
}

if (dangerous.length) {
  console.error("Dangerous open FOR ALL USING (true) policies:");
  for (const d of dangerous) console.error(" -", d);
}

assert.equal(
  dangerous.length,
  0,
  `found ${dangerous.length} overly-permissive FOR ALL USING (true) policies without TO service_role`,
);

console.log(`supabase-policy-audit: ok (${files.length} sql files scanned)`);
