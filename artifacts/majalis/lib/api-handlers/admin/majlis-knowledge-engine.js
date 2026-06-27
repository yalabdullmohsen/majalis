/**
 * Admin API — Majlis Knowledge Engine (Autonomous Platform 1.0).
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  runMajlisKnowledgeEngine,
  runMkeHealthCheck,
  getEngineMetrics,
  listRegisteredSources,
  listSupportedPlatforms,
  upsertSourcePlugin,
  analyzeImage,
  getVisionStatus,
  makeContentDecision,
  runQualityChecks,
  ENGINE_VERSION,
  PIPELINE_STAGES,
  SUPPORTED_SOURCE_TYPES,
} from "../../../lib/majlis-knowledge-engine/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "dashboard").trim();

  try {
    if (action === "dashboard" || action === "metrics") {
      const metrics = await getEngineMetrics();
      sendJson(res, 200, {
        ok: true,
        engineVersion: ENGINE_VERSION,
        pipelineStages: PIPELINE_STAGES,
        supportedSourceTypes: SUPPORTED_SOURCE_TYPES.length,
        platforms: listSupportedPlatforms(),
        stats: metrics,
      });
      return;
    }

    if (action === "health") {
      const health = await runMkeHealthCheck();
      sendJson(res, 200, health);
      return;
    }

    if (action === "list-sources") {
      const sources = await listRegisteredSources({ activeOnly: body.activeOnly !== false });
      sendJson(res, 200, { ok: true, sources, count: sources.length });
      return;
    }

    if (action === "upsert-source") {
      const result = await upsertSourcePlugin(body.source || body);
      sendJson(res, result.ok ? 200 : 422, result);
      return;
    }

    if (action === "run") {
      const result = await runMajlisKnowledgeEngine({
        mode: body.mode || "full",
        triggerType: "admin",
        maxSources: body.maxSources,
      });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "vision-status") {
      sendJson(res, 200, { ok: true, ...getVisionStatus() });
      return;
    }

    if (action === "analyze-image") {
      if (!body.imageBase64) {
        sendJson(res, 400, { ok: false, error: "imageBase64_required" });
        return;
      }
      const buffer = Buffer.from(body.imageBase64, "base64");
      const result = await analyzeImage({
        imageBuffer: buffer,
        mimeType: body.mimeType || "image/jpeg",
        caption: body.caption,
        sourceUrl: body.sourceUrl,
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "decide") {
      const decision = await makeContentDecision({
        source: body.source,
        parsed: body.parsed,
        confidenceScore: body.confidenceScore,
        sourceUrl: body.sourceUrl,
        imageUrl: body.imageUrl,
      });
      sendJson(res, 200, decision);
      return;
    }

    if (action === "quality-check") {
      const quality = await runQualityChecks({
        parsed: body.parsed,
        sourceUrl: body.sourceUrl,
        imageHash: body.imageHash,
      });
      sendJson(res, 200, { ok: true, ...quality });
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: [
        "dashboard", "health", "list-sources", "upsert-source", "run",
        "vision-status", "analyze-image", "decide", "quality-check",
      ],
    });
  } catch (err) {
    console.error("[admin/majlis-knowledge-engine]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
