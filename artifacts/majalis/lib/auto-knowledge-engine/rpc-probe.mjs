/**
 * Auto Knowledge Engine — RPC probe, repair, and health.
 */
import { getPgClient } from "../database.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { applyMigrations } from "../db-migrate.mjs";

export const AKE_RPC_FUNCTIONS = [
  {
    name: "ake_engine_stats",
    args: "integer",
    pgIdentity: "ake_engine_stats(integer)",
    testParams: { p_days: 7 },
    required: true,
    usedBy: "auto-knowledge-engine/orchestrator.mjs",
  },
  {
    name: "ake_search_semantic",
    args: "vector, integer, double precision",
    pgIdentity: "ake_search_semantic(vector,integer,double precision)",
    testParams: null,
    required: true,
    usedBy: "scholarly-intelligence/semantic-search.mjs",
  },
  {
    name: "knowledge_pipeline_stats",
    args: "integer",
    pgIdentity: "knowledge_pipeline_stats(integer)",
    testParams: { days: 7 },
    required: false,
    usedBy: "knowledge-engine/pipeline.mjs (legacy fallback)",
  },
  {
    name: "search_knowledge_hybrid",
    args: "text, integer",
    pgIdentity: "search_knowledge_hybrid(text,integer)",
    testParams: null,
    required: false,
    usedBy: "knowledge-engine/recommendations.mjs (legacy)",
  },
];

export async function probeAkeRpcViaPg() {
  const names = AKE_RPC_FUNCTIONS.map((f) => f.name);
  try {
    const { client } = await getPgClient();
    try {
      const { rows } = await client.query(
        `SELECT p.proname AS name,
                pg_get_function_identity_arguments(p.oid) AS args,
                has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_exec,
                has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_exec,
                has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec
         FROM pg_proc p
         JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname = 'public' AND p.proname = ANY($1::text[])`,
        [names],
      );
      const found = new Map(rows.map((r) => [r.name, r]));
      return AKE_RPC_FUNCTIONS.map((fn) => {
        const row = found.get(fn.name);
        return {
          ...fn,
          exists: Boolean(row),
          dbArgs: row?.args || null,
          grants: row
            ? {
                service_role: row.service_role_exec,
                authenticated: row.authenticated_exec,
                anon: row.anon_exec,
              }
            : null,
        };
      });
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err) {
    return { ok: false, error: err.message, functions: [] };
  }
}

export async function probeAkeRpcViaSupabase(admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: "no_admin", results: [] };

  const results = [];
  for (const fn of AKE_RPC_FUNCTIONS) {
    if (!fn.testParams) {
      results.push({ ...fn, callable: null, rpcError: "existence_only" });
      continue;
    }
    const { data, error } = await admin.rpc(fn.name, fn.testParams);
    results.push({
      name: fn.name,
      required: fn.required,
      callable: !error,
      rpcError: error?.message || null,
      hasData: data != null,
    });
  }
  return { ok: true, results };
}

export async function getAkeRpcHealth() {
  const pgProbe = await probeAkeRpcViaPg();
  const admin = getSupabaseAdmin();
  const supabaseProbe = await probeAkeRpcViaSupabase(admin);

  const functions = Array.isArray(pgProbe) ? pgProbe : [];
  const pgOk = functions.length > 0;

  const akeEngineStats = functions.find((f) => f.name === "ake_engine_stats");
  const akeSearch = functions.find((f) => f.name === "ake_search_semantic");

  const rpcTest = supabaseProbe.results?.find((r) => r.name === "ake_engine_stats");
  const engineStatsCallable = rpcTest?.callable === true;

  const missingRequired = functions.filter((f) => f.required && !f.exists).map((f) => f.name);
  const missingGrants = functions
    .filter((f) => f.required && f.exists && f.grants && (!f.grants.authenticated || !f.grants.anon))
    .map((f) => f.name);

  return {
    ok: missingRequired.length === 0 && engineStatsCallable,
    pgProbeOk: pgOk,
    pgProbeError: pgProbe.error || null,
    functions,
    supabaseProbe,
    engineStatsExists: akeEngineStats?.exists ?? false,
    engineStatsCallable,
    searchSemanticExists: akeSearch?.exists ?? false,
    missingRequired,
    missingGrants,
    repairFile: "auto_knowledge_engine_v13_rpc_fix.sql",
  };
}

export async function ensureAkeRpcFunctions(options = {}) {
  const health = await getAkeRpcHealth();
  if (health.ok && !options.force) {
    return { ok: true, skipped: true, reason: "rpc_healthy", health };
  }

  const migration = await applyMigrations({
    files: ["auto_knowledge_engine_v13_rpc_fix.sql"],
    continueOnError: false,
    trackApplied: true,
  });

  if (!migration.ok) {
    return { ok: false, health, migration, error: migration.error || "rpc_migration_failed" };
  }

  const after = await getAkeRpcHealth();
  return { ok: after.ok, health: after, migration, repaired: true };
}

export default getAkeRpcHealth;
