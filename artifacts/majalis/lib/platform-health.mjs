/**
 * Unified platform health — DB, secrets, cron, AI, MKE, assistant, search.
 */

import { getEnvStatus, validateCronEnv } from "./env-config.mjs";
import { SECRET_GROUPS } from "./release-gate.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { testDatabaseConnection } from "./database.mjs";
import { probeTables, ACTIVATION_TABLES, countTableRows } from "./table-probe.mjs";
import { getSystemHealth } from "./system-health.mjs";
import { runMkeHealthCheck } from "./majlis-knowledge-engine/orchestrator.mjs";
import { getSeedItemCount } from "./rulings-db-seed.mjs";

const PRODUCTION_BASE = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

async function probeAssistantPost() {
  try {
    const res = await fetch(`${PRODUCTION_BASE}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ما حكم الوضوء؟" }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json.ok === true, status: res.status, json };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function probeRoute(path) {
  try {
    const res = await fetch(`${PRODUCTION_BASE}${path}`, { redirect: "follow" });
    const text = await res.text();
    return {
      ok: res.status === 200 && !text.includes("تعذر عرض هذه الصفحة"),
      status: res.status,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getPlatformHealth(options = {}) {
  const started = Date.now();
  const env = getEnvStatus();
  const cronEnv = validateCronEnv();

  const secretGroups = {};
  for (const [group, keys] of Object.entries(SECRET_GROUPS)) {
    secretGroups[group] = {
      ok: keys.every((k) => env[k]),
      missing: keys.filter((k) => !env[k]),
    };
  }

  const [systemHealth, dbConn, rawTables, mkeHealth, assistantPost, shariaCount] = await Promise.all([
    getSystemHealth().catch((e) => ({ ok: false, error: e.message })),
    testDatabaseConnection().catch((e) => ({ ok: false, error: e.message })),
    probeTables(ACTIVATION_TABLES),
    runMkeHealthCheck().catch((e) => ({ ok: false, error: e.message })),
    options.skipRemote ? Promise.resolve(null) : probeAssistantPost(),
    countTableRows("sharia_rulings"),
  ]);

  const tables = Object.fromEntries(ACTIVATION_TABLES.map((t) => [t, rawTables[t] === true]));

  const seedAvailable = getSeedItemCount();

  const services = {
    database: {
      ok: dbConn.ok === true,
      pooler: dbConn,
      tables,
      sharia_rulings_count: shariaCount,
      rulings_seed_available: seedAvailable,
      rulings_using_db: tables.sharia_rulings && (shariaCount ?? 0) > 0,
    },
    supabase: {
      ok: Boolean(getSupabaseAdmin()),
      anon: Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY),
      serviceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    cron: {
      ok: cronEnv.ok,
      missing: cronEnv.missing || [],
    },
    assistant: {
      ok: assistantPost ? assistantPost.ok : Boolean(env.ANTHROPIC_API_KEY),
      anthropic: Boolean(env.ANTHROPIC_API_KEY),
      remote: assistantPost,
    },
    openai: { ok: Boolean(env.OPENAI_API_KEY) },
    instagram: secretGroups.instagram,
    mke: mkeHealth,
    automation: {
      ok: systemHealth.ok !== false,
      detail: systemHealth,
    },
  };

  const blockers = [];
  if (!services.supabase.anon) blockers.push("VITE_SUPABASE_URL/ANON_KEY");
  if (!services.database.tables?.mke_runs) blockers.push("migrations:mke_runs");
  if (!services.database.tables?.sharia_rulings) blockers.push("migrations:sharia_rulings");
  if (!services.database.rulings_using_db) blockers.push("seed:sharia_rulings");
  if (!services.cron.ok) blockers.push(`secrets:${(cronEnv.missing || []).join(",")}`);
  if (!services.assistant.anthropic) blockers.push("ANTHROPIC_API_KEY");

  return {
    ok: blockers.length === 0,
    at: new Date().toISOString(),
    durationMs: Date.now() - started,
    env,
    secretGroups,
    services,
    blockers,
    systemHealth,
  };
}

export async function probeProductionRoutes(routes) {
  const out = {};
  for (const r of routes) {
    out[r] = await probeRoute(r);
  }
  return out;
}
