import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import type {
  CmsContentKind,
  CmsContentRecord,
  CmsWorkflowStatus,
  ImportJobSummary,
  ImportRowLog,
} from "./content-types";
import { getContentConfig } from "./content-registry";
import { writeAuditLog } from "./audit-log";
import {
  buildContentFingerprint,
  detectDuplicates,
  ensureExternalKey,
  type DedupCandidate,
} from "./dedup-service";
import { normalizeImportRow, stripHtml, validateUrl } from "./normalize";

export type CmsUpsertOptions = {
  skipDedup?: boolean;
  mergeOnDuplicate?: boolean;
  validateLinks?: boolean;
};

export type CmsUpsertResult = {
  ok: boolean;
  action: "insert" | "update" | "skip" | "duplicate" | "error";
  recordId?: string;
  message?: string;
  duplicateOf?: string;
};

/** Fetch existing rows for dedup from DB (best-effort). */
export async function fetchDedupCandidates(kind: CmsContentKind, limit = 500): Promise<DedupCandidate[]> {
  if (!isSupabaseConfigured()) return [];
  const config = getContentConfig(kind);
  const titleCol = config.titleField;
  const select = ["id", titleCol, config.externalKeyField, config.slugField, config.speakerField]
    .filter(Boolean)
    .join(", ");

  const { data, error } = await supabase
    .from(config.table)
    .select(select)
    .limit(limit);

  if (error) {
    logSupabaseError("fetchDedupCandidates", error, { kind });
    return [];
  }

  return (data || []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      id: String(r.id),
      table: config.table,
      external_key: config.externalKeyField ? (r[config.externalKeyField] as string | undefined) : undefined,
      slug: config.slugField ? (r[config.slugField] as string | undefined) : undefined,
      title: String(r[titleCol] || ""),
      speaker_name: config.speakerField ? String(r[config.speakerField] || "") : undefined,
    };
  });
}

/** Upsert CMS index row for unified search/dashboard. */
export async function upsertCmsIndex(record: CmsContentRecord, recordId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const config = getContentConfig(record.kind);
  const { error } = await supabase.from("cms_content_index").upsert(
    {
      content_kind: record.kind,
      record_table: config.table,
      record_id: recordId,
      external_key: record.external_key,
      slug: record.slug,
      title: record.title,
      summary: record.summary,
      speaker_name: record.speaker_name,
      category: record.category,
      workflow_status: record.status || "approved",
      published_at: record.published_at || new Date().toISOString(),
      scheduled_at: record.scheduled_at,
      archived_at: record.archived_at,
      metadata: record.metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "record_table,record_id" },
  );
  if (error) logSupabaseError("upsertCmsIndex", error);
}

/** Archive content (soft delete). */
export async function archiveContent(kind: CmsContentKind, recordId: string): Promise<CmsUpsertResult> {
  const config = getContentConfig(kind);
  const archivedAt = new Date().toISOString();
  const { error } = await supabase
    .from(config.table)
    .update({ [config.archivedField || "archived_at"]: archivedAt, updated_at: archivedAt })
    .eq("id", recordId);

  if (error) return { ok: false, action: "error", message: error.message };

  await writeAuditLog({ action: "archive", table_name: config.table, record_id: recordId, content_kind: kind });
  return { ok: true, action: "update", recordId };
}

/** Restore archived content. */
export async function restoreContent(kind: CmsContentKind, recordId: string): Promise<CmsUpsertResult> {
  const config = getContentConfig(kind);
  const { error } = await supabase
    .from(config.table)
    .update({ [config.archivedField || "archived_at"]: null, updated_at: new Date().toISOString() })
    .eq("id", recordId);

  if (error) return { ok: false, action: "error", message: error.message };

  await writeAuditLog({ action: "restore", table_name: config.table, record_id: recordId, content_kind: kind });
  return { ok: true, action: "update", recordId };
}

/** Set workflow status (publish/unpublish/review). */
export async function setContentStatus(
  kind: CmsContentKind,
  recordId: string,
  status: CmsWorkflowStatus,
): Promise<CmsUpsertResult> {
  const config = getContentConfig(kind);
  const mapped = config.statusMap[status] ?? status;
  const payload: Record<string, unknown> = {
    [config.statusField]: mapped,
    updated_at: new Date().toISOString(),
  };
  if (config.table === "sheikhs" && config.statusField === "is_verified") {
    payload.is_verified = status === "approved" || status === "published";
  }
  if (status === "published" || status === "approved") {
    payload[config.publishedField || "published_at"] = new Date().toISOString();
  }

  const { error } = await supabase.from(config.table).update(payload).eq("id", recordId);
  if (error) return { ok: false, action: "error", message: error.message };

  await writeAuditLog({
    action: status === "archived" ? "archive" : status === "approved" || status === "published" ? "publish" : "update",
    table_name: config.table,
    record_id: recordId,
    content_kind: kind,
    metadata: { status },
  });
  return { ok: true, action: "update", recordId };
}

/** Schedule future publish. */
export async function scheduleContent(
  kind: CmsContentKind,
  recordId: string,
  scheduledAt: string,
): Promise<CmsUpsertResult> {
  const config = getContentConfig(kind);
  const field = config.scheduledField || "scheduled_at";
  const { error } = await supabase
    .from(config.table)
    .update({ [field]: scheduledAt, [config.statusField]: config.statusMap.pending || "pending" })
    .eq("id", recordId);

  if (error) return { ok: false, action: "error", message: error.message };

  await writeAuditLog({
    action: "schedule",
    table_name: config.table,
    record_id: recordId,
    content_kind: kind,
    metadata: { scheduledAt },
  });
  return { ok: true, action: "update", recordId };
}

/** Map CmsContentRecord to table-specific payload. */
function recordToPayload(record: CmsContentRecord): Record<string, unknown> {
  const config = getContentConfig(record.kind);
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (config.externalKeyField && record.external_key) payload[config.externalKeyField] = record.external_key;
  if (config.slugField && record.slug) payload[config.slugField] = record.slug;
  if (config.titleField) payload[config.titleField] = record.title;
  if (config.summaryField && record.summary) payload[config.summaryField] = record.summary;
  if (config.bodyField && record.body) payload[config.bodyField] = record.body;
  if (config.speakerField && record.speaker_name) payload[config.speakerField] = record.speaker_name;
  if (config.categoryField && record.category) payload[config.categoryField] = record.category;
  if (record.status) {
    const mapped = config.statusMap[record.status] ?? record.status;
    if (config.table === "sheikhs" && config.statusField === "is_verified") {
      payload.is_verified = record.status === "approved" || record.status === "published";
    } else {
      payload[config.statusField] = mapped;
    }
  }
  if (config.publishedField && (record.status === "approved" || record.status === "published")) {
    payload[config.publishedField] = record.published_at || new Date().toISOString();
  }
  if (config.scheduledField && record.scheduled_at) payload[config.scheduledField] = record.scheduled_at;

  // Lesson-specific
  if (record.kind === "course") {
    payload.is_course = true;
    payload.activity_type = "دورة";
  } else if (record.kind === "lecture") {
    payload.activity_type = "درس";
  }

  // Merge raw metadata fields
  if (record.raw) Object.assign(payload, record.raw);

  return payload;
}

/** Core CMS upsert with dedup + audit + index. */
export async function cmsUpsert(
  record: CmsContentRecord,
  options: CmsUpsertOptions = {},
): Promise<CmsUpsertResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, action: "error", message: "Supabase غير مهيأ — فعّل الاتصال أو نفّذ migrations" };
  }

  if (!record.title?.trim()) {
    return { ok: false, action: "error", message: "العنوان مطلوب" };
  }

  record.external_key = ensureExternalKey(record);
  const config = getContentConfig(record.kind);

  if (!options.skipDedup) {
    const candidates = await fetchDedupCandidates(record.kind);
    const dedup = detectDuplicates(record, candidates);
    if (dedup.isDuplicate && dedup.matches[0]) {
      const match = dedup.matches[0];
      if (!options.mergeOnDuplicate) {
        return {
          ok: true,
          action: "duplicate",
          duplicateOf: match.existingId,
          message: `مكرر (${match.matchType}): ${match.existingId}`,
        };
      }
      // Update existing
      const payload = recordToPayload(record);
      const { error } = await supabase.from(config.table).update(payload).eq("id", match.existingId);
      if (error) return { ok: false, action: "error", message: error.message };
      await upsertCmsIndex(record, match.existingId);
      await writeAuditLog({
        action: "merge",
        table_name: config.table,
        record_id: match.existingId,
        content_kind: record.kind,
        metadata: { external_key: record.external_key },
      });
      return { ok: true, action: "update", recordId: match.existingId };
    }
  }

  if (options.validateLinks && record.source_urls?.length) {
    for (const url of record.source_urls) {
      const v = await validateUrl(url, true);
      if (!v.ok) return { ok: false, action: "error", message: `رابط غير صالح: ${url}` };
    }
  }

  const payload = recordToPayload(record);
  const { data, error } = await supabase.from(config.table).insert(payload).select("id").single();

  if (error) {
    // Try upsert by external_key if unique violation
    if (record.external_key && error.code === "23505") {
      const { data: existing } = await supabase
        .from(config.table)
        .select("id")
        .eq(config.externalKeyField || "external_key", record.external_key)
        .maybeSingle();
      if (existing?.id) {
        await supabase.from(config.table).update(payload).eq("id", existing.id);
        await upsertCmsIndex(record, existing.id);
        return { ok: true, action: "update", recordId: existing.id };
      }
    }
    return { ok: false, action: "error", message: error.message };
  }

  const recordId = String(data.id);
  await upsertCmsIndex(record, recordId);

  const fp = buildContentFingerprint(record);
  await supabase.from("content_dedup_keys").upsert(
    {
      content_kind: record.kind,
      external_key: record.external_key,
      slug: fp.slug,
      content_hash: fp.hash,
      title_norm: fp.titleNorm,
      speaker_norm: fp.speakerNorm,
      record_table: config.table,
      record_id: recordId,
    },
    { onConflict: "content_kind,content_hash" },
  );

  await writeAuditLog({
    action: "create",
    table_name: config.table,
    record_id: recordId,
    content_kind: record.kind,
    metadata: { external_key: record.external_key },
  });

  return { ok: true, action: "insert", recordId };
}

/** Run import job — persists job log when DB available. */
export async function runImportJob(
  kind: CmsContentKind,
  rows: Record<string, unknown>[],
  sourceSlug = "json-bulk",
  options: CmsUpsertOptions = {},
): Promise<ImportJobSummary> {
  const summary: ImportJobSummary = {
    sourceSlug,
    contentKind: kind,
    status: "running",
    totalRows: rows.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    duplicates: 0,
    errors: 0,
    startedAt: new Date().toISOString(),
    rowLog: [],
  };

  let jobId: string | undefined;
  if (isSupabaseConfigured()) {
    const { data: job } = await supabase
      .from("import_jobs")
      .insert({
        content_kind: kind,
        status: "running",
        total_rows: rows.length,
        started_at: summary.startedAt,
      })
      .select("id")
      .single();
    jobId = job?.id;
  }

  for (let i = 0; i < rows.length; i++) {
    const cleaned = { ...rows[i] };
    for (const key of Object.keys(cleaned)) {
      if (typeof cleaned[key] === "string") cleaned[key] = stripHtml(String(cleaned[key]));
    }

    const record = normalizeImportRow(kind, cleaned);
    const result = await cmsUpsert(record, { ...options, mergeOnDuplicate: true });

    const log: ImportRowLog = {
      rowIndex: i,
      action: result.action,
      external_key: record.external_key,
      record_id: result.recordId,
      duplicate_of: result.duplicateOf,
      message: result.message,
    };
    summary.rowLog.push(log);

    if (result.action === "insert") summary.inserted++;
    else if (result.action === "update") summary.updated++;
    else if (result.action === "duplicate") summary.duplicates++;
    else if (result.action === "skip") summary.skipped++;
    else if (result.action === "error") summary.errors++;

    if (jobId && isSupabaseConfigured()) {
      await supabase.from("import_job_rows").insert({
        job_id: jobId,
        row_index: i,
        external_key: record.external_key,
        action: result.action,
        record_id: result.recordId,
        duplicate_of: result.duplicateOf,
        message: result.message,
        raw_payload: cleaned,
      });
    }
  }

  summary.finishedAt = new Date().toISOString();
  summary.status = summary.errors === rows.length ? "failed" : summary.errors > 0 ? "partial" : "completed";

  if (jobId && isSupabaseConfigured()) {
    await supabase.from("import_jobs").update({
      status: summary.status,
      finished_at: summary.finishedAt,
      inserted_count: summary.inserted,
      updated_count: summary.updated,
      skipped_count: summary.skipped,
      duplicate_count: summary.duplicates,
      error_count: summary.errors,
    }).eq("id", jobId);
  }

  await writeAuditLog({
    action: "import",
    table_name: getContentConfig(kind).table,
    content_kind: kind,
    metadata: { source: sourceSlug, inserted: summary.inserted, updated: summary.updated, duplicates: summary.duplicates, errors: summary.errors },
  });

  return summary;
}
