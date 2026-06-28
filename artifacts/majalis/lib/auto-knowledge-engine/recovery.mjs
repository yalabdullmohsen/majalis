/**
 * Recover interrupted / failed / unpublished items before new fetches.
 */

import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";
import { publishItem } from "../knowledge-engine/publisher.mjs";
import { indexAndEmbed } from "../knowledge-engine/indexer.mjs";
import { analysisFromKnowledgeRow } from "./knowledge-item-record.mjs";
import { runQualityGate } from "./quality-gate.mjs";
import { auditLog } from "./monitoring.mjs";
import { isPermanentFetchError } from "./connector-scheduler.mjs";
import { nextJobSchedule, classifyRetryError, RETRY_CLASS } from "./hardening/adaptive-retry.mjs";

const STUCK_RUNNING_MS = 10 * 60_000;
const STUCK_RUN_MS = 30 * 60_000;

export async function recoverInterruptedWork(admin, runId, options = {}) {
  const stats = { recovered: 0, retried: 0, reset: 0, errors: [] };
  if (!admin) return stats;

  try {
    stats.reset += await resetStuckQueueJobs(admin);
    stats.reset += await finalizeStuckRuns(admin);
    const pending = await recoverPendingKnowledgeItems(admin, runId, options);
    stats.recovered += pending.recovered;
    stats.retried += pending.retried;
    stats.errors.push(...pending.errors);
    const queue = await requeueFailedJobs(admin);
    stats.retried += queue;
  } catch (err) {
    stats.errors.push(err.message);
  }

  return stats;
}

async function resetStuckQueueJobs(admin) {
  const cutoff = new Date(Date.now() - STUCK_RUNNING_MS).toISOString();
  try {
    const { data } = await admin
      .from("ake_job_queue")
      .update({ status: "pending", last_error: "recovery_reset_stuck" })
      .eq("status", "running")
      .lt("started_at", cutoff)
      .select("id");
    return (data || []).length;
  } catch {
    return 0;
  }
}

async function finalizeStuckRuns(admin) {
  const cutoff = new Date(Date.now() - STUCK_RUN_MS).toISOString();
  try {
    const { data } = await admin
      .from("ake_engine_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_summary: "recovery_stuck_run" })
      .eq("status", "running")
      .lt("started_at", cutoff)
      .select("id");
    return (data || []).length;
  } catch {
    return 0;
  }
}

async function recoverPendingKnowledgeItems(admin, runId, options = {}) {
  const limit = options.recoveryLimit || 8;
  const result = { recovered: 0, retried: 0, errors: [] };

  const { data: items } = await admin
    .from("knowledge_items")
    .select("*")
    .in("publish_status", ["pending", "verified", "analyzed"])
    .neq("verification_status", "duplicate")
    .is("deleted_at", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  for (const row of items || []) {
    try {
      const analysis = analysisFromKnowledgeRow(row);
      const gate = runQualityGate(
        { ...row, raw_url: row.raw_url, raw_title: row.raw_title, raw_body: row.raw_body },
        analysis,
        { sourceVerified: true, trustScore: row.trust_score || 60, isDuplicate: false },
        { trust_level: 4, auto_publish: true },
      );

      if (!gate.canPublish || !gate.autoPublish) continue;

      const pub = await publishItem(admin, { ...row, can_publish: true }, analysis);
      if (pub.published) {
        await admin.from("knowledge_items").update({
          publish_status: "published",
          pipeline_stage: "published",
          target_table: pub.target_table,
          target_record_id: pub.target_record_id,
          published_at: row.source_published_at || new Date().toISOString(),
        }).eq("id", row.id);
        await indexAndEmbed(admin, row);
        result.recovered++;
        await auditLog(admin, { runId, action: "recovery_publish", status: "success", entityId: row.external_id });
      } else {
        result.retried++;
      }
    } catch (err) {
      result.errors.push(err.message);
    }
  }

  return result;
}

async function requeueFailedJobs(admin) {
  try {
    const { data } = await admin
      .from("ake_job_queue")
      .update({
        status: "pending",
        scheduled_at: new Date().toISOString(),
      })
      .eq("status", "failed")
      .lt("attempts", 4)
      .not("last_error", "like", "%404%")
      .select("id");
    return (data || []).length;
  } catch {
    return 0;
  }
}

export async function enqueueFailedStage(admin, { connectorId, knowledgeItemId, stage, error, payload = {} }) {
  const { class: errorClass } = classifyRetryError(error);
  if (!admin || isPermanentFetchError(error) || errorClass === RETRY_CLASS.NEVER) return null;
  try {
    const scheduledAt = nextJobSchedule(error, (payload.attempt || 0) + 1)
      || new Date(Date.now() + 60_000).toISOString();
    const { data } = await admin.from("ake_job_queue").insert({
      connector_id: connectorId || null,
      knowledge_item_id: knowledgeItemId || null,
      job_type: stage || "publish",
      payload: { ...payload, stage, knowledgeItemId },
      status: "pending",
      max_attempts: 4,
      scheduled_at: scheduledAt,
      last_error: error || null,
      checkpoint: { stage, at: new Date().toISOString() },
    }).select("id").single();
    return data?.id || null;
  } catch {
    return null;
  }
}
