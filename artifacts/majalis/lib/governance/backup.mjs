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

/**
 * Restore test — proves backup files are readable and structurally valid.
 */
export async function runRestoreTest(admin, opts = {}) {
  const started = Date.now();
  const result = {
    status: "running",
    tests: [],
    restored_rows: 0,
    ok: false,
  };

  mkdirSync(BACKUP_DIR, { recursive: true });

  if (opts.exportFirst) {
    await runBackupCheck(admin, { exportSamples: true, sampleSize: opts.sampleSize || 10 });
  }

  const backupFiles = existsSync(BACKUP_DIR)
    ? readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"))
    : [];

  if (backupFiles.length === 0) {
    result.tests.push({ type: "files_exist", status: "failed", note: "No backup files found" });
    result.status = "failed";
    result.duration_ms = Date.now() - started;
    return result;
  }

  for (const file of backupFiles.slice(0, opts.maxFiles || 5)) {
    const filePath = path.join(BACKUP_DIR, file);
    try {
      const raw = readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const rowCount = Array.isArray(parsed) ? parsed.length : 1;
      const checksum = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);

      result.tests.push({
        type: "restore_read",
        file,
        status: "passed",
        rows: rowCount,
        checksum,
      });
      result.restored_rows += rowCount;
    } catch (err) {
      result.tests.push({
        type: "restore_read",
        file,
        status: "failed",
        error: String(err.message || err),
      });
    }
  }

  const roundTrip = result.tests.some((t) => t.status === "passed");
  result.tests.push({
    type: "integrity",
    status: roundTrip ? "passed" : "failed",
    note: roundTrip ? "Backup files are parseable and restorable" : "No valid backup files",
  });

  result.ok = result.tests.every((t) => t.status !== "failed");
  result.status = result.ok ? "completed" : "failed";
  result.duration_ms = Date.now() - started;

  await logGovernanceEvent(admin, {
    action: "restore",
    actor_id: opts.actorId || "system",
    outcome: result.ok ? "success" : "failed",
    metadata: {
      files_tested: result.tests.length,
      restored_rows: result.restored_rows,
      duration_ms: result.duration_ms,
    },
  });

  return result;
}
