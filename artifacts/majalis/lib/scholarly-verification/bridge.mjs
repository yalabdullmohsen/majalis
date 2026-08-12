import { runReviewGate } from './review-gate.mjs';
import { buildProvenanceRow } from './provenance.mjs';
import { logVerification, logPublishing } from './storage.mjs';

/** Bridge for ingestion pipelines (auto-content, AKE, fiqh sync) */
export async function gateBeforePublish(contentType, contentId, item, context = {}) {
  const gate = await runReviewGate(
    {
      ...item,
      trust_level: item.trust_level ?? context.trust_level ?? 50,
    },
    {
      checkLinks: context.checkLinks ?? false,
      seenHashes: context.seenHashes,
      defaults: context.defaults,
    },
  );

  if (context.log !== false) {
    await logVerification({
      content_type: contentType,
      content_id: String(contentId),
      external_key: item.external_key ?? item.id,
      verification_status: gate.verification_status,
      trust_level: gate.trust_level,
      quality_score: gate.quality_score,
      checks: gate.checks,
      errors: gate.errors,
      checks_passed: gate.checks.filter((c) => c.passed).length,
      checks_failed: gate.checks.filter((c) => !c.passed).length,
    });
  }

  return gate;
}

export async function applyScholarlyGateToAutoContentRecord(record, source, context = {}) {
  const gate = await gateBeforePublish(
    'auto_imported_content',
    record.external_key ?? record.slug,
    {
      ...record,
      title: record.title,
      content: record.content ?? record.summary,
      source_name: record.source_name ?? source?.name,
      source_url: record.original_url ?? record.source_url ?? source?.url,
      trust_level: source?.trust_level ?? 50,
    },
    { ...context, trust_level: source?.trust_level },
  );

  record.quality_score = Math.max(record.quality_score ?? 0, gate.quality_score);

  if (!gate.can_publish) {
    record.verification_status = 'needs_review';
    record.status = 'needs_review';
    record.pipeline_stage = 'scholarly_review';
    return { autoPublish: false, gate };
  }

  return { autoPublish: true, gate };
}

export { buildProvenanceRow };
