import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import type { CmsContentKind } from "./content-types";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "archive"
  | "restore"
  | "publish"
  | "unpublish"
  | "schedule"
  | "import"
  | "merge"
  | "reject";

export type AuditLogEntry = {
  user_id?: string;
  action: AuditAction;
  table_name: string;
  record_id?: string;
  content_kind?: CmsContentKind;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("admin_audit_logs").insert({
      user_id: user?.id || entry.user_id || null,
      action: entry.action,
      table_name: entry.table_name,
      record_id: entry.record_id || null,
      content_kind: entry.content_kind || null,
      metadata: entry.metadata || {},
    });
    if (error) logSupabaseError("writeAuditLog", error, entry);
  } catch (err) {
    logSupabaseError("writeAuditLog", err, entry);
  }
}

export async function getRecentAuditLogs(limit = 20) {
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("id, action, table_name, record_id, content_kind, metadata, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("getRecentAuditLogs", error);
    return [];
  }
  return data || [];
}

export async function getAuditLogsForRecord(tableName: string, recordId: string, limit = 50) {
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("*")
    .eq("table_name", tableName)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("getAuditLogsForRecord", error);
    return [];
  }
  return data || [];
}
