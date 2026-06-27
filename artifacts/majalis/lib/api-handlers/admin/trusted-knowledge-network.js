/**
 * Admin API — Trusted Knowledge Network (Phase 5).
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  TKN_VERSION,
  SUPPORTED_SOURCE_TYPES,
  SOURCE_TYPE_LABELS,
  PIPELINE_STAGES,
  listConnectors,
  listSourcesWithStats,
  upsertContentSource,
  toggleSource,
  listSourceOperations,
  getSourceById,
  syncSourceNow,
  getTknDashboard,
  runHealthCheck,
  loadPlatformSettings,
  updatePlatformSettings,
  processRetryQueue,
  runTknPipeline,
  runTknFetch,
} from "../../../lib/trusted-knowledge-network/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "dashboard").trim();

  try {
    if (action === "dashboard") {
      const dashboard = await getTknDashboard();
      sendJson(res, 200, { ok: true, version: TKN_VERSION, dashboard });
      return;
    }

    if (action === "health") {
      const health = await runHealthCheck();
      sendJson(res, health.ok ? 200 : 503, health);
      return;
    }

    if (action === "list-sources") {
      const sources = await listSourcesWithStats({ activeOnly: body.activeOnly === true });
      sendJson(res, 200, { ok: true, sources, connectors: listConnectors(), types: SUPPORTED_SOURCE_TYPES, typeLabels: SOURCE_TYPE_LABELS });
      return;
    }

    if (action === "get-source") {
      const source = await getSourceById(String(body.sourceId || req.query?.sourceId || ""));
      sendJson(res, source ? 200 : 404, { ok: Boolean(source), source });
      return;
    }

    if (action === "upsert-source") {
      const source = body.source || {};
      const result = await upsertContentSource(source);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "toggle-source") {
      const result = await toggleSource(body.sourceId, body.active !== false);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "sync-source") {
      const source = await getSourceById(body.sourceId);
      if (!source) {
        sendJson(res, 404, { ok: false, error: "source_not_found" });
        return;
      }
      const contentType = body.contentType || source.content_types?.[0] || "benefits";
      const result = await syncSourceNow(source, contentType, {
        triggeredBy: auth.userId || auth.email || "admin",
        maxItems: body.maxItems,
        forcePublish: body.forcePublish === true,
      });
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "list-operations") {
      const ops = await listSourceOperations(body.sourceId, Number(body.limit) || 50);
      sendJson(res, 200, { ok: true, operations: ops });
      return;
    }

    if (action === "update-quotas") {
      const daily = body.dailyQuotas || body.quotas;
      const weekly = body.weeklyQuotas;
      const results = [];
      if (daily) results.push(await updatePlatformSettings("daily_quotas", daily, auth.userId));
      if (weekly) results.push(await updatePlatformSettings("weekly_quotas", weekly, auth.userId));
      if (body.autoPublish) results.push(await updatePlatformSettings("auto_publish", body.autoPublish, auth.userId));
      const ok = results.every((r) => r.ok);
      sendJson(res, ok ? 200 : 422, { ok, results });
      return;
    }

    if (action === "get-settings") {
      const settings = await loadPlatformSettings(true);
      sendJson(res, 200, { ok: true, ...settings, pipelineStages: PIPELINE_STAGES });
      return;
    }

    if (action === "run-pipeline") {
      const result = await runTknPipeline(body.pipeline || body.contentType || "benefits", {
        triggerType: "admin",
        force: body.force === true,
        forcePublish: body.forcePublish === true,
        maxItems: body.maxItems,
      });
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "fetch-all") {
      const result = await runTknFetch({ contentType: body.contentType });
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "process-retry-queue") {
      const result = await processRetryQueue(Number(body.batchSize) || 10);
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: [
        "dashboard", "health", "list-sources", "get-source", "upsert-source",
        "toggle-source", "sync-source", "list-operations", "update-quotas",
        "get-settings", "run-pipeline", "fetch-all", "process-retry-queue",
      ],
    });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
