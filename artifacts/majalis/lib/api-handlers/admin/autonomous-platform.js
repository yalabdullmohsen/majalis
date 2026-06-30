import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  getPlatformDashboard,
  runHealthCheck,
  probePlatformTables,
  listContentSources,
  runAutonomousPlatform,
} from "../../../lib/autonomous-platform/index.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      const dashboard = await getPlatformDashboard();
      sendJson(res, 200, { ok: true, ...dashboard });
      return;
    }

    if (action === "health") {
      const health = await runHealthCheck();
      sendJson(res, health.ok ? 200 : 503, { ok: health.ok, ...health });
      return;
    }

    if (action === "probe-tables") {
      const tables = await probePlatformTables();
      const missingTables = Object.entries(tables).filter(([, ok]) => !ok).map(([t]) => t);
      sendJson(res, 200, {
        ok: missingTables.length === 0,
        tables,
        missing: missingTables,
        readyCount: Object.values(tables).filter(Boolean).length,
        totalCount: Object.keys(tables).length,
      });
      return;
    }

    if (action === "sources") {
      const sources = await listContentSources({ activeOnly: false });
      sendJson(res, 200, { ok: true, sources, count: sources.length });
      return;
    }

    if (action === "alerts") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 200, { ok: true, alerts: [] }); return; }
      const limit = parseInt(req.query?.limit || "50", 10);
      const { data } = await admin
        .from("akp_alerts")
        .select("*")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(limit);
      sendJson(res, 200, { ok: true, alerts: data || [] });
      return;
    }

    if (action === "resolve-alert") {
      const id = req.query?.id || req.body?.id;
      if (!id) { sendJson(res, 400, { ok: false, error: "missing id" }); return; }
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 503, { ok: false, error: "no_admin" }); return; }
      await admin.from("akp_alerts").update({ resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (action === "review-queue") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 200, { ok: true, items: [] }); return; }
      const status = req.query?.status || "pending";
      const limit = parseInt(req.query?.limit || "50", 10);
      const { data } = await admin
        .from("akp_review_queue")
        .select("*")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(limit);
      sendJson(res, 200, { ok: true, items: data || [], count: data?.length || 0 });
      return;
    }

    if (action === "review-decide") {
      const id = req.query?.id || req.body?.id;
      const decision = req.body?.decision || req.query?.decision;
      if (!id || !decision) { sendJson(res, 400, { ok: false, error: "missing id or decision" }); return; }
      if (!["approved", "rejected", "duplicate"].includes(decision)) {
        sendJson(res, 400, { ok: false, error: "invalid decision" }); return;
      }
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 503, { ok: false, error: "no_admin" }); return; }
      await admin.from("akp_review_queue").update({
        status: decision,
        resolved_at: new Date().toISOString(),
      }).eq("id", id);
      sendJson(res, 200, { ok: true, id, decision });
      return;
    }

    if (action === "dlq") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 200, { ok: true, items: [] }); return; }
      const limit = parseInt(req.query?.limit || "30", 10);
      const { data } = await admin
        .from("akp_dead_letter_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      sendJson(res, 200, { ok: true, items: data || [], count: data?.length || 0 });
      return;
    }

    if (action === "logs") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 200, { ok: true, logs: [] }); return; }
      const level = req.query?.level;
      const limit = parseInt(req.query?.limit || "50", 10);
      let q = admin.from("akp_structured_logs").select("*").order("created_at", { ascending: false }).limit(limit);
      if (level) q = q.eq("level", level);
      const { data } = await q;
      sendJson(res, 200, { ok: true, logs: data || [] });
      return;
    }

    if (action === "pipeline-runs") {
      const admin = getSupabaseAdmin();
      if (!admin) { sendJson(res, 200, { ok: true, runs: [] }); return; }
      const pipeline = req.query?.pipeline;
      const limit = parseInt(req.query?.limit || "20", 10);
      let q = admin.from("akp_pipeline_runs").select("*").order("started_at", { ascending: false }).limit(limit);
      if (pipeline) q = q.eq("pipeline", pipeline);
      const { data } = await q;
      sendJson(res, 200, { ok: true, runs: data || [] });
      return;
    }

    if (action === "run") {
      const mode = req.body?.mode || req.query?.mode || "full";
      const result = await runAutonomousPlatform({ mode, triggerType: "admin" });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown action",
      actions: ["dashboard", "health", "probe-tables", "sources", "alerts", "resolve-alert",
        "review-queue", "review-decide", "dlq", "logs", "pipeline-runs", "run"],
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message });
  }
}
