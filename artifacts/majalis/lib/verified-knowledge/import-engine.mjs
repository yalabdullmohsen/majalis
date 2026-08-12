/**
 * Smart Import Engine — discover, dedupe, analyze, link, audit.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { runAutoContentSync } from "../auto-content/auto-content-sync.mjs";
import { runAutoKnowledgeEngine } from "../auto-knowledge-engine/orchestrator.mjs";
import { syncTrustedSources } from "../trusted-sources/index.mjs";
import { runVerifiedKnowledgeGate } from "./verification-gate.mjs";
import { syncVerifiedSourceRegistry } from "./source-registry.mjs";
import { bootstrapVerifiedContent } from "./bootstrap-content.mjs";
import { rebuildKnowledgeRelations } from "./relation-builder.mjs";

async function logImportOperation(admin, row) {
  if (!admin) return null;
  try {
    const { data } = await admin.from("import_operations_log").insert(row).select("id").maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function finishImportOperation(admin, id, patch) {
  if (!admin || !id) return;
  try {
    await admin.from("import_operations_log").update({
      ...patch,
      finished_at: new Date().toISOString(),
    }).eq("id", id);
  } catch {
    /* table may not exist yet */
  }
}

export async function runImportEngine(admin, opts = {}) {
  admin = admin ?? getSupabaseAdmin();
  const started = Date.now();
  const opId = await logImportOperation(admin, {
    operation: "verified_knowledge_import",
    status: "running",
    actor_id: opts.actorId ?? "system",
    metadata: { opts },
  });

  const report = {
    ok: true,
    duration_ms: 0,
    sources: null,
    trusted_sync: null,
    auto_content: null,
    auto_knowledge: null,
    bootstrap: null,
    relations: null,
    gate_samples: [],
    errors: [],
  };

  try {
    report.sources = await syncVerifiedSourceRegistry(admin);
    report.trusted_sync = await syncTrustedSources(admin, { probe: opts.probeSources !== false });

    if (opts.runAutoContent !== false) {
      report.auto_content = await runAutoContentSync({
        triggerType: opts.triggerType ?? "verified-knowledge",
        skipSchemaCheck: opts.skipSchemaCheck === true,
      }).catch((e) => ({ ok: false, error: e.message }));
    }

    if (opts.runAutoKnowledge !== false) {
      report.auto_knowledge = await runAutoKnowledgeEngine({
        triggerType: opts.triggerType ?? "verified-knowledge",
        maxConnectors: opts.akeLimit ?? 15,
      }).catch((e) => ({ ok: false, error: e.message }));
    }

    report.bootstrap = await bootstrapVerifiedContent(admin, {
      dryRun: opts.dryRun === true,
      persistProvenance: opts.persistProvenance !== false,
    });

    report.relations = await rebuildKnowledgeRelations(admin, { limit: opts.relationLimit ?? 200 });

    if (opts.sampleGate !== false && report.bootstrap?.samples?.length) {
      for (const sample of report.bootstrap.samples.slice(0, 5)) {
        const gate = await runVerifiedKnowledgeGate(sample.item, { checkLinks: false });
        report.gate_samples.push({
          content_type: sample.content_type,
          content_id: sample.content_id,
          confidence: gate.confidence_score,
          can_auto_publish: gate.can_auto_publish,
          status: gate.verification_status,
        });
      }
    }

    report.ok = report.errors.length === 0;
  } catch (err) {
    report.ok = false;
    report.errors.push(String(err?.message || err));
  }

  report.duration_ms = Date.now() - started;
  await finishImportOperation(admin, opId, {
    status: report.ok ? "completed" : "failed",
    items_discovered: report.bootstrap?.discovered ?? 0,
    items_imported: report.bootstrap?.imported ?? 0,
    items_updated: report.bootstrap?.updated ?? 0,
    items_rejected: report.bootstrap?.rejected ?? 0,
    items_needs_review: report.bootstrap?.needs_review ?? 0,
    error_summary: report.errors.join("; ") || null,
    metadata: report,
  });

  return report;
}
