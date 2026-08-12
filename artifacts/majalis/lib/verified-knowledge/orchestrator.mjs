/**
 * Verified Knowledge Platform — main orchestrator.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { logGovernanceEvent } from "../governance/audit.mjs";
import { runImportEngine } from "./import-engine.mjs";
import { generateKnowledgeQualityReport } from "./report.mjs";
import { runScholarlyVerificationScan } from "../scholarly-verification/orchestrator.mjs";

export async function runVerifiedKnowledgeCycle(opts = {}) {
  const admin = getSupabaseAdmin();
  const started = Date.now();

  const result = {
    ok: true,
    at: new Date().toISOString(),
    import: null,
    verification: null,
    report: null,
    duration_ms: 0,
    errors: [],
  };

  try {
    result.import = await runImportEngine(admin, {
      dryRun: opts.dryRun === true,
      probeSources: opts.probeSources !== false,
      runAutoContent: opts.runAutoContent !== false,
      runAutoKnowledge: opts.runAutoKnowledge !== false,
      persistProvenance: opts.persistProvenance !== false,
    });

    if (opts.runVerification !== false) {
      result.verification = await runScholarlyVerificationScan({
        checkLinks: opts.checkLinks === true,
        persist: opts.persistVerification !== false,
        trigger: opts.trigger ?? "verified-knowledge-cycle",
      });
    }

    result.report = await generateKnowledgeQualityReport(admin);

    if (result.import?.errors?.length) result.errors.push(...result.import.errors);
    result.ok = result.errors.length === 0;
  } catch (err) {
    result.ok = false;
    result.errors.push(String(err?.message || err));
  }

  result.duration_ms = Date.now() - started;

  await logGovernanceEvent(admin, {
    action: "verified_knowledge_cycle",
    actor_id: opts.actorId ?? "system",
    outcome: result.ok ? "success" : "partial",
    metadata: {
      duration_ms: result.duration_ms,
      gaps: result.report?.gaps?.length ?? 0,
      imported: result.import?.bootstrap?.imported ?? 0,
    },
  });

  return result;
}

export { runImportEngine } from "./import-engine.mjs";
export { generateKnowledgeQualityReport, getLatestQualityReport } from "./report.mjs";
export { getVerifiedSourceRegistry, getVerifiedSourcesDashboard, syncVerifiedSourceRegistry } from "./source-registry.mjs";
export { runVerifiedKnowledgeGate } from "./verification-gate.mjs";
export { bootstrapVerifiedContent } from "./bootstrap-content.mjs";
export { rebuildKnowledgeRelations } from "./relation-builder.mjs";
