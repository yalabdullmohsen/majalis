import { getSupabaseAdmin, isMissingTableError } from '../supabase-admin.mjs';
import { buildProvenanceRow } from './provenance.mjs';

export async function upsertProvenance(row, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };
  const { data, error } = await admin
    .from('content_provenance')
    .upsert(row, { onConflict: 'content_type,content_id' })
    .select('id, content_type, content_id, verification_status')
    .single();
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'content_provenance_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true, data };
}

export async function recordRevision(entry, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };
  const { error } = await admin.from('content_revision_log').insert({
    content_type: entry.content_type,
    content_id: entry.content_id,
    revision_number: entry.revision_number ?? 1,
    change_reason: entry.change_reason ?? null,
    change_source: entry.change_source ?? 'system',
    is_automated: entry.is_automated !== false,
    changed_fields: entry.changed_fields ?? [],
    diff_summary: entry.diff_summary ?? null,
    actor_id: entry.actor_id ?? null,
  });
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'content_revision_log_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function saveVersionSnapshot(snapshot, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };
  const { error } = await admin.from('content_version_snapshots').upsert(snapshot, {
    onConflict: 'content_type,content_id,version_number',
  });
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'content_version_snapshots_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function logVerification(entry, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };
  const { error } = await admin.from('verification_logs').insert({
    entity_type: entry.content_type,
    entity_id: entry.content_id,
    external_key: entry.external_key ?? null,
    content_type: entry.content_type,
    verification_status: entry.verification_status,
    trust_score: entry.trust_level,
    quality_score: entry.quality_score,
    checks: entry.checks ?? {},
    errors: (entry.errors ?? []).map((e) => e.message ?? String(e)),
    checks_passed: entry.checks_passed ?? 0,
    checks_failed: entry.checks_failed ?? 0,
    run_id: entry.run_id ?? null,
  });
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'verification_logs_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function logPublishing(entry, admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false, error: 'missing_supabase_config' };
  const { error } = await admin.from('publishing_history').insert({
    content_id: entry.content_id,
    content_type: entry.content_type,
    slug: entry.slug ?? null,
    action: entry.action ?? 'verify',
    status: entry.verification_status ?? entry.status,
    quality_score: entry.quality_score,
    trust_level: entry.trust_level,
    verification_status: entry.verification_status,
    revision_number: entry.revision_number ?? null,
    is_automated: entry.is_automated !== false,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    if (isMissingTableError(error)) return { ok: false, error: 'publishing_history_missing' };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function getLatestVersionNumber(contentType, contentId, admin = getSupabaseAdmin()) {
  if (!admin) return 0;
  const { data } = await admin
    .from('content_version_snapshots')
    .select('version_number')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.version_number ?? 0;
}

export async function persistVerificationResult(contentType, contentId, item, gateResult, context = {}) {
  const provRow = buildProvenanceRow(contentType, contentId, {
    ...item,
    ...gateResult.provenance,
    trust_level: gateResult.trust_level,
  });
  provRow.verification_status = gateResult.verification_status;
  provRow.quality_score = gateResult.quality_score;
  provRow.completeness_score = gateResult.completeness_score;
  provRow.link_status = gateResult.checks?.find((c) => c.name === 'source_link')?.link?.status ?? 'unknown';
  provRow.last_reviewed_at = new Date().toISOString();

  const versionNumber = (await getLatestVersionNumber(contentType, contentId)) + 1;

  await saveVersionSnapshot({
    content_type: contentType,
    content_id: String(contentId),
    version_number: versionNumber,
    snapshot: item,
    provenance: provRow,
    verification_status: gateResult.verification_status,
    created_by: context.actor ?? 'system',
  });

  await recordRevision({
    content_type: contentType,
    content_id: String(contentId),
    revision_number: versionNumber,
    change_reason: context.change_reason ?? 'verification_run',
    change_source: context.change_source ?? 'cron',
    is_automated: context.is_automated !== false,
    changed_fields: context.changed_fields ?? [],
    diff_summary: gateResult.can_publish ? 'passed verification' : 'needs review',
  });

  const prov = await upsertProvenance(provRow);

  await logVerification({
    content_type: contentType,
    content_id: String(contentId),
    external_key: item.external_key ?? item.id,
    verification_status: gateResult.verification_status,
    trust_level: gateResult.trust_level,
    quality_score: gateResult.quality_score,
    checks: gateResult.checks,
    errors: gateResult.errors,
    checks_passed: gateResult.checks.filter((c) => c.passed).length,
    checks_failed: gateResult.checks.filter((c) => !c.passed).length,
    run_id: context.run_id ?? null,
  });

  return { prov, versionNumber };
}
