/**
 * Field-level revision audit log.
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

export async function writeRevisionLogs({
  tableName,
  recordId,
  changedBy,
  draftId,
  changes = [],
  action = "update",
}) {
  const admin = getSupabaseAdmin();
  if (!admin || !changes.length) return;

  const rows = changes.map((c) => ({
    table_name: tableName,
    record_id: recordId,
    field_name: c.field,
    old_value: c.oldValue ?? null,
    new_value: c.newValue ?? null,
    changed_by: changedBy || null,
    draft_id: draftId || null,
    metadata: { action },
  }));

  await admin.from("content_revision_log").insert(rows);

  await admin.from("admin_audit_logs").insert({
    user_id: changedBy || null,
    action,
    table_name: tableName,
    record_id: recordId,
    metadata: { draft_id: draftId, fields: changes.map((c) => c.field) },
    new_values: Object.fromEntries(changes.map((c) => [c.field, c.newValue])),
    old_values: Object.fromEntries(changes.filter((c) => c.oldValue != null).map((c) => [c.field, c.oldValue])),
  });
}

export async function getRevisionHistory(tableName, recordId, limit = 50) {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("content_revision_log")
    .select("*")
    .eq("table_name", tableName)
    .eq("record_id", recordId)
    .order("changed_at", { ascending: false })
    .limit(limit);
  return data || [];
}
