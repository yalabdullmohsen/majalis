/**
 * 14-stage content pipeline — wraps existing engines with unified audit.
 */

import { logPipelineEvent } from "./audit.mjs";
import { AI_CONSTRAINTS } from "./config.mjs";
import { runFullKnowledgeSync } from "../auto-knowledge-sync.mjs";
import { runAutoContentSync } from "../auto-content/auto-content-sync.mjs";
import { runScholarlyVerificationScan } from "../scholarly-verification/orchestrator.mjs";
import { applyScholarlyGateToAutoContentRecord } from "../scholarly-verification/bridge.mjs";

function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function contentFingerprint(item) {
  const key = [item.title, item.url, item.source_url, item.external_id].filter(Boolean).join("|");
  return normalizeArabic(key).toLowerCase();
}

export async function runPipelineStage(admin, runId, stageId, ctx = {}) {
  const t0 = Date.now();
  let result = { ok: true, count: 0, items: [] };

  try {
    switch (stageId) {
      case "discover":
      case "fetch": {
        result = { ok: true, count: 0, message: "delegated to ingest" };
        break;
      }
      case "clean": {
        if (ctx.rawItems?.length) {
          result.items = ctx.rawItems.map((item) => ({
            ...item,
            title: normalizeArabic(item.title || item.raw_title || ""),
            body: normalizeArabic(item.body || item.raw_body || item.summary || ""),
          }));
          result.count = result.items.length;
        }
        break;
      }
      case "dedup": {
        const seen = new Set();
        const unique = [];
        for (const item of ctx.rawItems || []) {
          const fp = contentFingerprint(item);
          if (seen.has(fp)) continue;
          seen.add(fp);
          unique.push(item);
        }
        result.items = unique;
        result.count = unique.length;
        result.duplicatesRemoved = (ctx.rawItems?.length || 0) - unique.length;
        break;
      }
      case "verify_source": {
        const verified = [];
        for (const item of ctx.rawItems || []) {
          if (!item.source_url && !item.source_name && AI_CONSTRAINTS.requireSourceUrl) {
            item._rejected = true;
            item._rejectReason = "missing_source";
            continue;
          }
          verified.push(item);
        }
        result.items = verified;
        result.count = verified.length;
        break;
      }
      case "classify":
      case "keywords":
      case "summarize":
      case "seo": {
        result.message = "AI metadata extraction via AKE/auto-content engines";
        result.ok = true;
        break;
      }
      case "relate": {
        result.message = "Related content linking via knowledge engine recommendations";
        break;
      }
      case "store":
      case "publish":
      case "index": {
        result.message = "Storage/publish/index via existing engines";
        break;
      }
      case "audit": {
        result.message = "Audit trail recorded";
        break;
      }
      default:
        result = { ok: false, error: "unknown_stage" };
    }
  } catch (error) {
    result = { ok: false, error: error.message };
  }

  await logPipelineEvent(admin, {
    runId,
    stage: stageId,
    eventType: result.ok ? "stage_complete" : "stage_error",
    message: result.message || result.error || `Processed ${result.count} items`,
    durationMs: Date.now() - t0,
    success: result.ok,
    metadata: { count: result.count, duplicatesRemoved: result.duplicatesRemoved },
  });

  return result;
}

export async function runScholarlyGate(admin, runId, item) {
  const t0 = Date.now();
  try {
    const gate = await applyScholarlyGateToAutoContentRecord(item, { checkLinks: true, useAi: false });
    const passed = gate?.passed !== false && gate?.verification_status !== "rejected";

    await logPipelineEvent(admin, {
      runId,
      stage: "verify_source",
      eventType: passed ? "verified" : "rejected",
      contentId: item.id || item.external_id,
      message: passed ? "Passed scholarly gate" : gate?.rejectReason || "Failed verification",
      durationMs: Date.now() - t0,
      success: passed,
      metadata: gate,
    });

    return { passed, gate };
  } catch (error) {
    await logPipelineEvent(admin, {
      runId,
      stage: "verify_source",
      eventType: "gate_error",
      message: error.message,
      success: false,
    });
    return { passed: false, error: error.message };
  }
}

export async function runIngestPipelines(admin, runId, opts = {}) {
  const results = {};
  const t0 = Date.now();

  await logPipelineEvent(admin, { runId, stage: "discover", message: "Starting ingest pipelines" });

  try {
    results.knowledge = await runFullKnowledgeSync({
      triggerType: opts.triggerType || "cron",
      checkLinks: opts.checkLinks ?? false,
      skipAutoContent: opts.skipAutoContent ?? false,
    });
  } catch (error) {
    results.knowledge = { ok: false, error: error.message };
  }

  if (!opts.skipAutoContent) {
    try {
      results.autoContent = await runAutoContentSync({
        triggerType: opts.triggerType || "cron",
        skipSchemaCheck: true,
      });
    } catch (error) {
      results.autoContent = { ok: false, error: error.message };
    }
  }

  if (opts.runScholarlyScan) {
    try {
      results.scholarly = await runScholarlyVerificationScan({
        checkLinks: true,
        useAi: false,
        persist: true,
        trigger: opts.triggerType || "cron",
      });
    } catch (error) {
      results.scholarly = { ok: false, error: error.message };
    }
  }

  const published =
    (results.knowledge?.stats?.published || 0) +
    (results.autoContent?.stats?.published || 0);
  const rejected =
    (results.knowledge?.stats?.rejected || 0) +
    (results.autoContent?.stats?.needs_review || 0);

  await logPipelineEvent(admin, {
    runId,
    stage: "publish",
    message: `Ingest complete: ${published} published, ${rejected} rejected/needs review`,
    durationMs: Date.now() - t0,
    metadata: results,
  });

  return {
    ok: results.knowledge?.ok !== false || results.autoContent?.ok !== false,
    published,
    rejected,
    discovered: (results.knowledge?.stats?.fetched || 0) + (results.autoContent?.stats?.fetched || 0),
    pipelines: results,
    durationMs: Date.now() - t0,
  };
}
