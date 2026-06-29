/**
 * Smart CMS Ops — server-side dashboard stats, queue control, integrity checks.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { processQueuedImportJobs } from "../../../lib/content-import/engine.mjs";
import { checkSmartCmsDataIntegrity, probeSmartCmsTables } from "../../../lib/smart-cms-production.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "ops-stats").trim();

  try {
    if (action === "ops-stats") {
      const admin = getSupabaseAdmin();
      if (!admin) {
        sendJson(res, 503, { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY required" });
        return;
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const isoDay = startOfDay.toISOString();

      const tables = await probeSmartCmsTables();

      const [
        draftsPending,
        draftsPublishedToday,
        draftsRejectedToday,
        importQueued,
        importProcessing,
        importCompletedToday,
        importFailedToday,
        engineRunsToday,
      ] = await Promise.all([
        countWhere(admin, "content_drafts", (q) => q.eq("workflow_status", "pending")),
        countWhere(admin, "content_drafts", (q) =>
          q.eq("workflow_status", "published").gte("updated_at", isoDay),
        ),
        countWhere(admin, "content_drafts", (q) =>
          q.eq("workflow_status", "rejected").gte("updated_at", isoDay),
        ),
        countWhere(admin, "content_import_jobs", (q) => q.in("status", ["queued", "pending"])),
        countWhere(admin, "content_import_jobs", (q) =>
          q.in("status", ["processing", "validating", "importing", "parsing"]),
        ),
        countWhere(admin, "content_import_jobs", (q) =>
          q.eq("status", "completed").gte("completed_at", isoDay),
        ),
        countWhere(admin, "content_import_jobs", (q) =>
          q.eq("status", "failed").gte("updated_at", isoDay),
        ),
        countWhere(admin, "content_engine_runs", (q) => q.gte("started_at", isoDay)),
      ]);

      const { data: lastImport } = await admin
        .from("content_import_jobs")
        .select("id, type, status, updated_at, error_message")
        .order("updated_at", { ascending: false })
        .limit(1);

      const { data: lastEngine } = await admin
        .from("content_engine_runs")
        .select("engine_id, status, started_at, duration_ms")
        .order("started_at", { ascending: false })
        .limit(1);

      const totalImportsToday = (importCompletedToday || 0) + (importFailedToday || 0);
      const successRate =
        totalImportsToday > 0 ? Math.round(((importCompletedToday || 0) / totalImportsToday) * 100) : null;

      sendJson(res, 200, {
        ok: true,
        tables,
        ops: {
          publishedToday: draftsPublishedToday ?? 0,
          pendingReview: draftsPending ?? 0,
          rejectedToday: draftsRejectedToday ?? 0,
          importQueued: importQueued ?? 0,
          importProcessing: importProcessing ?? 0,
          importCompletedToday: importCompletedToday ?? 0,
          importFailedToday: importFailedToday ?? 0,
          importSuccessRatePct: successRate,
          automationRunsToday: engineRunsToday ?? 0,
          lastImport: lastImport?.[0] || null,
          lastAutomation: lastEngine?.[0] || null,
          workerStatus: importProcessing > 0 ? "busy" : importQueued > 0 ? "queued" : "idle",
          queueStatus: `${importQueued ?? 0} queued · ${importProcessing ?? 0} processing`,
          databaseHealth: tables.ok ? "healthy" : `missing: ${tables.missing.join(", ")}`,
        },
      });
      return;
    }

    if (action === "run-import-queue") {
      const limit = Number(body.limit || req.query?.limit) || 3;
      const result = await processQueuedImportJobs(limit);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "integrity-check") {
      const integrity = await checkSmartCmsDataIntegrity();
      sendJson(res, integrity.ok ? 200 : 500, { ok: integrity.ok, integrity });
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: ["ops-stats", "run-import-queue", "integrity-check"],
    });
  } catch (err) {
    console.error("[admin/cms-ops]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}

async function countWhere(admin, table, filterFn) {
  try {
    let q = admin.from(table).select("*", { count: "exact", head: true });
    q = filterFn(q);
    const { count, error } = await q;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}
