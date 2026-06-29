/**
 * Phase 1 — Startup validation after deploy.
 * Probes tables, views, RPC, triggers, indexes, storage buckets, RLS.
 */
import { getPgClient } from "../database.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { probeTables } from "../table-probe.mjs";
import { probeAkeRpcViaPg } from "../auto-knowledge-engine/rpc-probe.mjs";
import {
  EXPECTED_TABLES,
  EXPECTED_RPC,
  EXPECTED_VIEWS,
  EXPECTED_TRIGGERS,
  CRITICAL_INDEXES,
  EXPECTED_STORAGE_BUCKETS,
  RLS_PROTECTED_TABLES,
} from "./expected-schema.mjs";

async function probeViaPg() {
  let client;
  try {
    client = await getPgClient();
  } catch {
    return null;
  }
  if (!client) return null;

  try {
    const tables = {};
    for (const t of EXPECTED_TABLES) {
      const { rows } = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) AS ok`,
        [t],
      );
      tables[t] = rows[0]?.ok === true;
    }

    const { rows: viewRows } = await client.query(
      `SELECT table_name FROM information_schema.views WHERE table_schema = 'public'`,
    );
    const viewsPresent = new Set(viewRows.map((r) => r.table_name));
    const views = Object.fromEntries(EXPECTED_VIEWS.map((v) => [v, viewsPresent.has(v)]));

    const { rows: rpcRows } = await client.query(
      `SELECT p.proname AS name FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       WHERE n.nspname = 'public' AND p.proname = ANY($1::text[])`,
      [EXPECTED_RPC],
    );
    const rpcPresent = new Set(rpcRows.map((r) => r.name));
    const rpc = Object.fromEntries(EXPECTED_RPC.map((f) => [f, rpcPresent.has(f)]));

    const triggers = {};
    for (const tr of EXPECTED_TRIGGERS) {
      const { rows } = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.triggers
          WHERE event_object_schema = 'public'
            AND event_object_table = $1
            AND trigger_name = $2
        ) AS ok`,
        [tr.table, tr.name],
      );
      triggers[`${tr.table}.${tr.name}`] = rows[0]?.ok === true;
    }

    const indexes = {};
    for (const idx of CRITICAL_INDEXES) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS c FROM pg_indexes
         WHERE schemaname = 'public' AND tablename = $1 AND indexname LIKE $2`,
        [idx.table, idx.pattern],
      );
      indexes[idx.table] = (rows[0]?.c || 0) > 0;
    }

    const rls = {};
    for (const t of RLS_PROTECTED_TABLES) {
      const { rows } = await client.query(
        `SELECT c.relrowsecurity AS enabled,
                (SELECT COUNT(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = $1) AS policies
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'public' AND c.relname = $1`,
        [t],
      );
      rls[t] = {
        enabled: rows[0]?.enabled === true,
        policies: rows[0]?.policies ?? 0,
        ok: rows[0]?.enabled === true && (rows[0]?.policies ?? 0) > 0,
      };
    }

    return { tables, views, rpc, triggers, indexes, rls, via: "postgres" };
  } finally {
    await client.end().catch(() => {});
  }
}

async function probeStorageBuckets() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "no_admin", buckets: {} };
  }
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) return { ok: false, error: error.message, buckets: {} };
    const present = new Set((data || []).map((b) => b.name));
    const buckets = Object.fromEntries(
      EXPECTED_STORAGE_BUCKETS.map((b) => [b, present.has(b)]),
    );
    return { ok: true, buckets, listed: data?.length ?? 0 };
  } catch (err) {
    return { ok: false, error: err.message, buckets: {} };
  }
}

export async function runStartupValidation() {
  const started = Date.now();
  const issues = [];
  const alerts = [];

  const pgProbe = await probeViaPg();
  let tables = {};
  let views = {};
  let rpc = {};
  let triggers = {};
  let indexes = {};
  let rls = {};

  if (pgProbe) {
    ({ tables, views, rpc, triggers, indexes, rls } = pgProbe);
  } else {
    const restProbe = await probeTables(EXPECTED_TABLES);
    for (const t of EXPECTED_TABLES) {
      tables[t] = restProbe[t] === true;
    }
    alerts.push({
      severity: "warning",
      code: "no_database_url",
      message: "DATABASE_URL غير متوفر — التحقق محدود عبر REST فقط",
    });
  }

  const akeRpc = await probeAkeRpcViaPg().catch(() => []);
  if (Array.isArray(akeRpc)) {
    for (const fn of akeRpc.filter((f) => f.required && !f.exists)) {
      issues.push({ type: "missing_rpc", name: fn.name, autoFixable: true });
    }
  }

  const missingTables = EXPECTED_TABLES.filter((t) => !tables[t]);
  for (const t of missingTables) {
    issues.push({ type: "missing_table", name: t, autoFixable: true });
  }

  for (const [name, ok] of Object.entries(views)) {
    if (!ok) issues.push({ type: "missing_view", name, autoFixable: true });
  }

  for (const [name, ok] of Object.entries(rpc)) {
    if (!ok) issues.push({ type: "missing_rpc", name, autoFixable: name.startsWith("ake_") });
  }

  for (const [name, ok] of Object.entries(triggers)) {
    if (!ok) issues.push({ type: "missing_trigger", name, autoFixable: true });
  }

  for (const [table, ok] of Object.entries(indexes)) {
    if (!ok) issues.push({ type: "missing_index", name: table, autoFixable: false });
  }

  for (const [table, info] of Object.entries(rls)) {
    if (!info.ok) {
      issues.push({
        type: "rls_incomplete",
        name: table,
        autoFixable: false,
        detail: `enabled=${info.enabled} policies=${info.policies}`,
      });
      alerts.push({
        severity: "warning",
        code: "rls_manual",
        message: `RLS على ${table} يحتاج مراجعة يدوية`,
      });
    }
  }

  const storage = await probeStorageBuckets();
  for (const [bucket, ok] of Object.entries(storage.buckets || {})) {
    if (!ok) {
      issues.push({ type: "missing_storage_bucket", name: bucket, autoFixable: false });
      alerts.push({
        severity: "warning",
        code: "storage_manual",
        message: `Storage bucket "${bucket}" مفقود — يتطلب إنشاء يدوي في Supabase`,
      });
    }
  }

  const tablesPresent = EXPECTED_TABLES.filter((t) => tables[t]).length;

  return {
    ok: missingTables.length === 0 && issues.filter((i) => i.type === "missing_rpc" && !i.autoFixable).length === 0,
    via: pgProbe ? "postgres" : "rest",
    tables: { expected: EXPECTED_TABLES.length, present: tablesPresent, missing: missingTables },
    views: { expected: EXPECTED_VIEWS.length, present: Object.values(views).filter(Boolean).length, missing: EXPECTED_VIEWS.filter((v) => !views[v]) },
    rpc: { expected: EXPECTED_RPC.length, present: Object.values(rpc).filter(Boolean).length },
    triggers: { expected: EXPECTED_TRIGGERS.length, present: Object.values(triggers).filter(Boolean).length },
    indexes,
    rls,
    storage,
    issues,
    alerts,
    criticalCount: issues.filter((i) => ["missing_table", "missing_rpc"].includes(i.type)).length,
    durationMs: Date.now() - started,
  };
}
