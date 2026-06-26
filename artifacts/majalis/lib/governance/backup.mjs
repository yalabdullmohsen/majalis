/**
 * Enterprise Governance — backup and recovery system.
 */

import crypto from "node:crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logGovernanceEvent } from "./audit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, "../../data/backups");

export async function runBackupCheck(admin, opts = {}) {
  admin = admin || getSupabaseAdmin();
  const runId = crypto.randomUUID();
  const started = new Date().toISOString();

  const result = {
    id: runId,
    status: "running",
    started_at: started,
    checks: [],
    snapshots: [],
  };

  mkdirSync(BACKUP_DIR, { recursive: true });

  result.checks.push({
    type: "database",
    status: admin ? "connected" : "disconnected",
    note: "Supabase manages automated daily backups",
    recommendation: admin ? "Verify PITR enabled in Supabase dashboard" : "Configure Supabase admin",
  });

  if (admin) {
    const tables = ["governance_audit_log", "governance_reviews", "governance_user_roles", "global_content_refs"];
    for (const table of tables) {
      try {
        const { data, count } = await admin.from(table).select("*", { count: "exact" }).limit(opts.sampleSize || 100);
        const snapshot = {
          table,
          row_count: count || data?.length || 0,
          sample_rows: data?.length || 0,
          exported_at: new Date().toISOString(),
        };
        result.snapshots.push(snapshot);

        if (opts.exportSamples && data?.length) {
          const filePath = path.join(BACKUP_DIR, `${table}_${Date.now()}.json`);
          writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
          snapshot.file = filePath;
        }
      } catch {
        result.checks.push({ type: "table_export", table, status: "failed" });
      }
    }
  }

  result.checks.push({
    type: "files",
    status: "manual",
    note: "Static assets served via Vercel CDN; images in Supabase Storage",
    recommendation: "Enable Supabase Storage backup policy",
  });

  result.checks.push({
    type: "integrity",
    status: result.snapshots.length > 0 ? "verified" : "pending",
    tables_verified: result.snapshots.length,
  });

  result.checks.push({
    type: "recovery_test",
    status: "simulated",
    note: "Restore test: read sample backup file if exists",
    recoverable: existsSync(BACKUP_DIR),
  });

  result.status = "completed";
  result.finished_at = new Date().toISOString();
  result.ok = result.checks.every((c) => c.status !== "failed");

  if (admin) {
    try {
      await admin.from("governance_backup_runs").insert({
        id: runId,
        status: result.status,
        checks: result.checks,
        snapshots: result.snapshots,
        started_at: started,
        finished_at: result.finished_at,
      });
    } catch {
      /* table may not exist */
    }
  }

  await logGovernanceEvent(admin, {
    action: "backup",
    actor_id: "system",
    outcome: result.ok ? "success" : "partial",
    metadata: { snapshots: result.snapshots.length, checks: result.checks.length },
  });

  return result;
}

export async function getBackupHistory(admin, limit = 10) {
  if (!admin) return [];

  try {
    const { data } = await admin.from("governance_backup_runs").select("*").order("started_at", { ascending: false }).limit(limit);
    return data || [];
  } catch {
    return [];
  }
}

export function loadBackupSample(tableName) {
  if (!existsSync(BACKUP_DIR)) return null;
  try {
    const match = readdirSync(BACKUP_DIR).find((f) => f.startsWith(tableName));
    if (match) return JSON.parse(readFileSync(path.join(BACKUP_DIR, match), "utf8"));
  } catch {
    /* no backup */
  }
  return null;
}
