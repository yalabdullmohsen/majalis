/**
 * Persist platform self-bootstrap run history.
 * Table must exist via SQL migration — never emit schema DDL at runtime.
 */

import { getPgClient } from "./database.mjs";
import { getSupabaseAdmin } from "./supabase-admin.mjs";

async function withPg(fn) {
  let clientInfo;
  try {
    clientInfo = await getPgClient();
  } catch {
    return null;
  }
  const { client } = clientInfo;
  try {
    return await fn(client);
  } catch (err) {
    const msg = String(err?.message || err);
    if (/platform_bootstrap_runs|does not exist|42P01/i.test(msg)) {
      console.error(
        JSON.stringify({
          level: "warn",
          msg: "platform_bootstrap_runs_missing",
          hint: "Apply supabase/platform_bootstrap_runs_v1.sql (REQUIRES_EXPLICIT_APPROVAL)",
          ts: new Date().toISOString(),
        }),
      );
      return null;
    }
    throw err;
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

export async function isBootstrapRunning() {
  const pgRow = await withPg(async (client) => {
    const { rows } = await client.query(
      `SELECT id, started_at, current_step
       FROM platform_bootstrap_runs
       WHERE status = 'running'
       ORDER BY started_at DESC
       LIMIT 1`,
    );
    return rows[0] || null;
  });
  if (pgRow) {
    const ageMs = Date.now() - new Date(pgRow.started_at).getTime();
    if (ageMs > 15 * 60 * 1000) {
      await withPg(async (client) => {
        await client.query(
          `UPDATE platform_bootstrap_runs SET
            status = 'failed',
            completed_at = now(),
            error = 'stale running lock (>15m)',
            current_step = 'stale_lock'
           WHERE id = $1 AND status = 'running'`,
          [pgRow.id],
        );
      });
      return false;
    }
    return true;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin
    .from("platform_bootstrap_runs")
    .select("id, started_at, status")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  const ageMs = Date.now() - new Date(data.started_at).getTime();
  return ageMs <= 15 * 60 * 1000;
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
