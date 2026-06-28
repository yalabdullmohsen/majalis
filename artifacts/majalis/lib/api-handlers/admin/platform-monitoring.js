import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getPlatformMonitoring } from "../../../lib/platform-monitoring.mjs";
import { getMonitoringDashboard } from "../../../lib/auto-knowledge-engine/monitoring/dashboard.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || "dashboard";

  try {
    if (action === "dashboard" || action === "full") {
      const data = await getPlatformMonitoring();
      sendJson(res, 200, data);
      return;
    }

    if (action === "ake") {
      const data = await getMonitoringDashboard();
      sendJson(res, 200, data);
      return;
    }

    if (action === "backfill-pause") {
      const admin = getSupabaseAdmin();
      const monthKey = req.body?.monthKey || new Date().toISOString().slice(0, 7);
      if (!admin) {
        sendJson(res, 503, { ok: false, error: "no_admin" });
        return;
      }
      const { data: state } = await admin
        .from("content_engine_backfill_status")
        .select("report")
        .eq("engine_id", "backfill")
        .eq("month_key", monthKey)
        .maybeSingle();
      const report = { ...(state?.report || {}), paused: true };
      await admin.from("content_engine_backfill_status").upsert(
        { engine_id: "backfill", month_key: monthKey, status: "running", report },
        { onConflict: "engine_id,month_key" },
      );
      sendJson(res, 200, { ok: true, paused: true, monthKey });
      return;
    }

    if (action === "backfill-resume") {
      const admin = getSupabaseAdmin();
      const monthKey = req.body?.monthKey || new Date().toISOString().slice(0, 7);
      if (!admin) {
        sendJson(res, 503, { ok: false, error: "no_admin" });
        return;
      }
      const { data: state } = await admin
        .from("content_engine_backfill_status")
        .select("report")
        .eq("engine_id", "backfill")
        .eq("month_key", monthKey)
        .maybeSingle();
      const report = { ...(state?.report || {}), paused: false };
      await admin.from("content_engine_backfill_status").upsert(
        { engine_id: "backfill", month_key: monthKey, status: "running", report },
        { onConflict: "engine_id,month_key" },
      );
      sendJson(res, 200, { ok: true, paused: false, monthKey });
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: ["dashboard", "full", "ake", "backfill-pause", "backfill-resume"],
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
