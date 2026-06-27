/**
 * Persist platform self-bootstrap run history.
 */

import { getPgClient } from "./database.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";

export const ENSURE_BOOTSTRAP_STATE_SQL = `
CREATE TABLE IF NOT EXISTS platform_bootstrap_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  error TEXT,
  owner_actions JSONB,
  production_ready BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_platform_bootstrap_runs_started
  ON platform_bootstrap_runs (started_at DESC);
`;

async function withPg(fn) {
  let clientInfo;
  try {
    clientInfo = await getPgClient();
  } catch {
    return null;
  }
  const { client } = clientInfo;
  try {
    await client.query(ENSURE_BOOTSTRAP_STATE_SQL);
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

export async function startBootstrapRun(currentStep = "precheck") {
  return (
    (await withPg(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO platform_bootstrap_runs (status, current_step)
         VALUES ('running', $1)
         RETURNING id, started_at`,
        [currentStep],
      );
      return rows[0];
    })) || { id: null, started_at: new Date().toISOString(), via: "no_pg" }
  );
}

export async function updateBootstrapRun(runId, patch) {
  if (!runId) return;
  await withPg(async (client) => {
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [key, value] of Object.entries(patch)) {
      sets.push(`${key} = $${i++}`);
      vals.push(key === "steps" || key === "owner_actions" ? JSON.stringify(value) : value);
    }
    if (!sets.length) return;
    vals.push(runId);
    await client.query(
      `UPDATE platform_bootstrap_runs SET ${sets.join(", ")} WHERE id = $${i}`,
      vals,
    );
  });
}

export async function finishBootstrapRun(runId, { ok, error, ownerActions, steps, productionReady }) {
  if (!runId) return;
  await withPg(async (client) => {
    await client.query(
      `UPDATE platform_bootstrap_runs SET
        status = $2,
        completed_at = now(),
        error = $3,
        owner_actions = $4::jsonb,
        steps = $5::jsonb,
        production_ready = $6,
        current_step = $7
       WHERE id = $1`,
      [
        runId,
        ok ? "completed" : "failed",
        error || null,
        JSON.stringify(ownerActions || []),
        JSON.stringify(steps || []),
        Boolean(productionReady),
        ok ? "complete" : "failed",
      ],
    );
  });
}

export async function getLatestBootstrapRun() {
  const pgRow = await withPg(async (client) => {
    const { rows } = await client.query(
      `SELECT id, started_at, completed_at, status, current_step, steps, error, owner_actions, production_ready
       FROM platform_bootstrap_runs
       ORDER BY started_at DESC
       LIMIT 1`,
    );
    return rows[0] || null;
  });
  if (pgRow) return { ...pgRow, via: "postgres" };

  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("platform_bootstrap_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data ? { ...data, via: "supabase" } : null;
}
