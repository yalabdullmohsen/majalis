/**
 * AKP v3 — Backup & Recovery registry.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { logAuditEvent } from "./security.mjs";

const BACKUP_TABLES = [
  "akp_content_sources",
  "akp_content_fingerprints",
  "akp_pipeline_runs",
  "akp_platform_analytics_daily",
  "akp_daily_goal_progress",
  "fawaid",
  "qa_questions",
  "verified_hadith_items",
  "sharia_rulings",
  "akp_stories",
];

export async function runDailyBackupSnapshot(actor = "cron") {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const rowCounts = {};
  for (const table of BACKUP_TABLES) {
    try {
      const { count } = await admin.from(table).select("id", { count: "exact", head: true });
      rowCounts[table] = count || 0;
    } catch {
      rowCounts[table] = null;
    }
  }

  const snapshot = {
    snapshot_type: "daily",
    tables_included: BACKUP_TABLES,
    row_counts: rowCounts,
    storage_path: `backup/${new Date().toISOString().slice(0, 10)}/metadata.json`,
    status: "completed",
    metadata: { actor, version: "3.0.0" },
  };

  const { data, error } = await admin.from("akp_backup_snapshots").insert(snapshot).select("id").single();
  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    actor: { label: actor },
    action: "backup.create",
    resourceType: "akp_backup_snapshots",
    resourceId: data.id,
    metadata: { tables: BACKUP_TABLES.length },
  });

  return { ok: true, snapshotId: data.id, rowCounts };
}

export async function listBackupSnapshots(limit = 30) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, snapshots: [] };

  const { data } = await admin
    .from("akp_backup_snapshots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return { ok: true, snapshots: data || [] };
}

export async function restoreTableFromSnapshot(snapshotId, tableName, actor = null) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const { data: snap } = await admin.from("akp_backup_snapshots").select("*").eq("id", snapshotId).maybeSingle();
  if (!snap) return { ok: false, error: "snapshot_not_found" };
  if (!snap.tables_included?.includes(tableName)) {
    return { ok: false, error: "table_not_in_snapshot" };
  }

  await logAuditEvent({
    actor,
    action: "backup.restore_table",
    resourceType: tableName,
    resourceId: snapshotId,
    metadata: { note: "metadata-only restore registry — use Supabase PITR for full restore" },
  });

  return {
    ok: true,
    snapshotId,
    tableName,
    rowCountAtBackup: snap.row_counts?.[tableName],
    message: "تم تسجيل طلب الاستعادة — للاستعادة الكاملة استخدم Supabase Point-in-Time Recovery",
  };
}
