/**
 * AKE queue drain — process pending jobs until empty or time budget exhausted.
 */

import { processNextJobs } from "./queue.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { publishItem } from "../knowledge-engine/publisher.mjs";
import { indexAndEmbed } from "../knowledge-engine/indexer.mjs";
import { analysisFromKnowledgeRow } from "./knowledge-item-record.mjs";
import { auditLog } from "./monitoring.mjs";

export async function getQueueSize(admin) {
  if (!admin) return 0;
  try {
    const { count } = await admin
      .from("ake_job_queue")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "running"]);
    return count || 0;
  } catch {
    return 0;
  }
}

async function handleQueueJob(admin, job) {
  const itemId = job.knowledge_item_id || job.payload?.knowledgeItemId;
  if (!itemId) return { ok: true, skipped: true };

  const { data: row } = await admin.from("knowledge_items").select("*").eq("id", itemId).maybeSingle();
  if (!row) return { ok: false, error: "item_not_found" };

  const analysis = analysisFromKnowledgeRow(row);
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
    await auditLog(admin, { action: "queue_publish", status: "success", entityId: row.external_id });
    return { ok: true, published: true };
  }

  return { ok: false, error: pub.reason || "publish_failed" };
}

export async function drainAkeQueue(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, processed: 0, published: 0 };

  const budgetMs = options.budgetMs || 45_000;
  const batchSize = options.batchSize || 5;
  const started = Date.now();
  let processed = 0;
  let published = 0;

  while (Date.now() - started < budgetMs) {
    const results = await processNextJobs(admin, handleQueueJob, batchSize);
    if (!results.length) break;

    for (const r of results) {
      processed++;
      if (r.ok && r.result?.published) published++;
    }
  }

  const queueSize = await getQueueSize(admin);
  return {
    ok: true,
    processed,
    published,
    queueSize,
    durationMs: Date.now() - started,
  };
}
