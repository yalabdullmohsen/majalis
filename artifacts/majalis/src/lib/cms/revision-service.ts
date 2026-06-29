import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";

export type RevisionLogEntry = {
  id: string;
  table_name: string;
  record_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by?: string;
  draft_id?: string;
};

export async function getRevisionLog(tableName: string, recordId: string, limit = 50): Promise<RevisionLogEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("content_revision_log")
    .select("*")
    .eq("table_name", tableName)
    .eq("record_id", recordId)
    .order("changed_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code !== "PGRST205") logSupabaseError("getRevisionLog", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    table_name: String(row.table_name),
    record_id: String(row.record_id),
    field_name: String(row.field_name),
    old_value: row.old_value != null ? String(row.old_value) : null,
    new_value: row.new_value != null ? String(row.new_value) : null,
    changed_at: String(row.changed_at),
    changed_by: row.changed_by ? String(row.changed_by) : undefined,
    draft_id: row.draft_id ? String(row.draft_id) : undefined,
  }));
}

export async function writeRevisionEntry(input: {
  tableName: string;
  recordId: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  draftId?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("content_revision_log").insert({
    table_name: input.tableName,
    record_id: input.recordId,
    field_name: input.fieldName,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    changed_by: user?.id || null,
    draft_id: input.draftId || null,
  });

  if (error && error.code !== "PGRST205") {
    logSupabaseError("writeRevisionEntry", error);
  }
}

/** Restore a field to a previous revision value. */
export async function restoreRevision(
  tableName: string,
  recordId: string,
  revision: RevisionLogEntry,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase غير مهيأ" };
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update({ [revision.field_name]: revision.old_value, updated_at: new Date().toISOString() })
    .eq("id", recordId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await writeRevisionEntry({
    tableName,
    recordId,
    fieldName: revision.field_name,
    oldValue: revision.new_value,
    newValue: revision.old_value,
  });

  return { ok: true };
}
