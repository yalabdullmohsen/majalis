/**
 * Notification Engine — internal notifications for new content.
 */
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { processNotificationQueue } from "../../majlis-knowledge-engine/notification-platform.mjs";
import { startEngineRun, finishEngineRun, createRunLogger } from "../run-manager.mjs";

const ENGINE_ID = "notifications";

export async function run({ runType = "incremental" } = {}) {
  const admin = getSupabaseAdmin();
  const { runId, startedAt } = await startEngineRun(ENGINE_ID, runType);
  const log = createRunLogger(runId, ENGINE_ID);
  const stats = {
    items_fetched: 0,
    items_published: 0,
    errors: 0,
  };

  try {
    const notifResult = await processNotificationQueue({ batchSize: 20 });
    stats.items_fetched = notifResult?.processed || notifResult?.sent || 0;
    stats.items_published = notifResult?.sent || notifResult?.delivered || 0;

    if (admin) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentAudit } = await admin
        .from("content_engine_publish_audit")
        .select("engine_id, target_table, target_id, created_at")
        .gte("created_at", since)
        .eq("action", "publish")
        .limit(50);

      stats.items_fetched += recentAudit?.length || 0;

      for (const entry of recentAudit || []) {
        try {
          await admin.from("notifications").insert({
            type: "content_published",
            title: "محتوى جديد",
            body: `نُشر محتوى جديد من ${entry.engine_id}`,
            metadata: {
              engine_id: entry.engine_id,
              target_table: entry.target_table,
              target_id: entry.target_id,
              badge: "جديد",
            },
            read: false,
          });
          stats.items_published++;
        } catch {
          /* dedup or schema */
        }
      }
    }

    await log("publish_or_review", "info", `Notifications: ${stats.items_published}`);
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { report: notifResult });
    return { ok: true, engineId: ENGINE_ID, runId, stats };
  } catch (err) {
    stats.errors = 1;
    await finishEngineRun(runId, ENGINE_ID, stats, startedAt, { errorMessage: err.message });
    return { ok: false, error: err.message, stats };
  }
}
