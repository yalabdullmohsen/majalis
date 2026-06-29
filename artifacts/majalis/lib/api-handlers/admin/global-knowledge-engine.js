/**
 * Admin API — Global Knowledge Engine (GKE)
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  getDashboard,
  validateArchitecture,
  runPipelineDryRun,
  recordGkeRun,
  getHealthDashboard,
  GKE_VERSION,
  GKE_PHASE,
  PIPELINE_FLOW,
  GKE_LAYERS,
} from "../../../lib/global-knowledge-engine/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "dashboard").trim();

  try {
    if (action === "dashboard" || action === "health") {
      const dashboard = await getDashboard();
      sendJson(res, 200, dashboard);
      return;
    }

    if (action === "validate" || action === "architecture") {
      const result = await validateArchitecture();
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "dry-run" || action === "pipeline-dry-run") {
      const sample = body.sample || {
        title: body.title,
        body: body.body,
        content_kind: body.content_kind,
        external_key: body.external_key,
      };
      const result = await runPipelineDryRun(sample);
      await recordGkeRun(result);
      sendJson(res, result.ok ? 200 : 422, { ok: result.ok, ...result });
      return;
    }

    if (action === "layers") {
      sendJson(res, 200, {
        ok: true,
        version: GKE_VERSION,
        phase: GKE_PHASE,
        pipeline: PIPELINE_FLOW,
        layers: GKE_LAYERS,
        health: await getHealthDashboard(),
      });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action", action });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
