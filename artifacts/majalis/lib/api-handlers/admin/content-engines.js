import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  runContentEngine,
  runAllContentEngines,
  runBackfillCurrentMonth,
  retryFailedEngines,
  getContentEngineStats,
  getVerificationReport,
  listPendingReviews,
  ENGINE_IDS,
} from "../../../lib/content-engines/index.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "stats";

  try {
    if (action === "stats" || action === "dashboard") {
      const days = Number(req.query?.days || req.body?.days || 7);
      const stats = await getContentEngineStats(days);
      const verification = await getVerificationReport();
      sendJson(res, 200, { ok: true, stats, verification });
      return;
    }

    if (action === "verification") {
      const report = await getVerificationReport();
      sendJson(res, 200, report);
      return;
    }

    if (action === "review-queue") {
      const pending = await listPendingReviews({
        limit: Number(req.query?.limit || 50),
        engineId: req.query?.engineId,
      });
      sendJson(res, 200, { ok: true, pending, count: pending.length });
      return;
    }

    if (action === "run-all") {
      const result = await runAllContentEngines({
        runType: "manual",
        engineIds: req.body?.engineIds,
        skip: req.body?.skip,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "run") {
      const engineId = req.query?.engine || req.body?.engineId;
      if (!engineId) {
        sendJson(res, 400, { ok: false, error: "engineId required" });
        return;
      }
      const result = await runContentEngine(engineId, {
        runType: "manual",
        maxItems: Number(req.body?.maxItems || 10),
        lessonId: req.body?.lessonId,
        force: req.body?.force === true,
      });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "backfill") {
      const result = await runBackfillCurrentMonth({
        skipDerivation: req.body?.skipDerivation === true,
        drain: req.body?.drain === true,
      });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "backfill-status") {
      const admin = getSupabaseAdmin();
      const monthKey = req.query?.monthKey || new Date().toISOString().slice(0, 7);
      if (!admin) {
        sendJson(res, 503, { ok: false, error: "no_admin" });
        return;
      }
      const { data } = await admin
        .from("content_engine_backfill_status")
        .select("*")
        .eq("engine_id", "backfill")
        .eq("month_key", monthKey)
        .maybeSingle();
      sendJson(res, 200, { ok: true, monthKey, status: data });
      return;
    }

    if (action === "retry-failed") {
      const result = await retryFailedEngines();
      sendJson(res, 200, result);
      return;
    }

    if (action === "toggle") {
      const admin = getSupabaseAdmin();
      const engineId = req.body?.engineId;
      const enabled = req.body?.enabled;
      if (!admin || !engineId || typeof enabled !== "boolean") {
        sendJson(res, 400, { ok: false, error: "engineId and enabled required" });
        return;
      }
      await admin
        .from("content_engine_config")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", engineId);
      sendJson(res, 200, { ok: true, engineId, enabled });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action", actions: ["stats", "run", "run-all", "backfill", "retry-failed", "review-queue", "verification", "toggle"], engines: ENGINE_IDS });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
