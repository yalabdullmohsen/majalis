/**
 * P0 security gates — runtime DDL blocked, universities AuthZ, safe errors.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

{
  const adminBootstrap = read("lib/api-handlers/admin/platform-bootstrap.js");
  assert.match(adminBootstrap, /verify_only|schemaMutationBlocked/);
  assert.doesNotMatch(adminBootstrap, /runPlatformBootstrap\s*\(/);
  assert.doesNotMatch(adminBootstrap, /applyMigrations\s*\(/);

  const activate = read("lib/api-handlers/admin/production-activate.js");
  assert.match(activate, /runtime_schema_migrations_disabled/);
  assert.doesNotMatch(activate, /runActivationMigrations\s*\(/);
  assert.doesNotMatch(activate, /runPlatformBootstrap\s*\(/);

  const ensure = read("lib/content-import/ensure-schema.mjs");
  assert.match(ensure, /verifyContentImportSchema|schemaMutationBlocked/);
  assert.doesNotMatch(ensure, /client\.query\(\s*sql\s*\)/);

  const importJobs = read("lib/content-import/import-jobs.mjs");
  assert.match(importJobs, /verifyImportTables/);
  assert.doesNotMatch(importJobs, /client\.query\(\s*sql\s*\)/);

  const state = read("lib/platform-bootstrap-state.mjs")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(state, /\bCREATE\s+TABLE\b/i);
  assert.doesNotMatch(state, /ENSURE_BOOTSTRAP_STATE_SQL/);

  const migrate = read("lib/db-migrate.mjs");
  assert.match(migrate, /MAJALIS_ALLOW_CLI_MIGRATIONS/);
  assert.match(migrate, /runtime_schema_migrations_disabled/);
}

{
  const univ = read("lib/api-handlers/universities.js");
  assert.match(univ, /requireAdminAccess/);
  assert.doesNotMatch(univ, /async function assertAdmin/);
  assert.match(univ, /sendSafeError/);
}

{
  const auth = read("lib/admin-auth.mjs");
  // Client responses must not include debug snapshots
  assert.doesNotMatch(
    auth,
    /debug:\s*auth\.debug|debug,\s*\n\s*\}/,
  );
  const requireFn = auth.slice(auth.indexOf("export async function requireAdminAccess"));
  assert.doesNotMatch(requireFn, /\bdebug:/);
}

{
  assert.ok(existsSync(join(root, "supabase/platform_bootstrap_runs_v1.sql")));
  assert.ok(existsSync(join(root, "supabase/platform_bootstrap_runs_v1_ROLLBACK.sql")));
  assert.ok(existsSync(join(root, "supabase/p0_security_definer_grants_v2.sql")));
  assert.ok(existsSync(join(root, "supabase/p0_security_definer_grants_v2_ROLLBACK.sql")));
  assert.ok(existsSync(join(root, "../../docs/REQUIRES_EXPLICIT_APPROVAL.md")));
}

{
  const { clientErrorBody } = await import("../api/safe-error.mjs");
  const body = clientErrorBody(new Error("relation \"secret\" does not exist"), { code: "x" });
  assert.equal(body.error, "x");
  assert.equal(body.ok, false);
  assert.doesNotMatch(JSON.stringify(body), /secret|relation/);
}

console.log("p0-security-runtime-ddl: ok");
