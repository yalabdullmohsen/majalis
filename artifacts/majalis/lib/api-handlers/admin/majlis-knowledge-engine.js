/**
 * Admin API — Majlis Knowledge Engine (Autonomous Platform 1.0).
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  runMajlisKnowledgeEngine,
  runMkeHealthCheck,
  getEngineMetrics,
  getPlatformMonitoring,
  listRegisteredSources,
  listSupportedPlatforms,
  upsertSourcePlugin,
  analyzeImage,
  analyzeImageV2,
  getVisionStatus,
  makeContentDecision,
  makeMultiStageDecision,
  runQualityChecks,
  runQualityEngine,
  intelligentSearch,
  recommendForLesson,
  runSelfHealing,
  ENGINE_VERSION,
  PIPELINE_STAGES,
  SUPPORTED_SOURCE_TYPES,
  INTELLIGENCE_LAYERS,
} from "../../../lib/majlis-knowledge-engine/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "dashboard").trim();

  try {
    if (action === "dashboard" || action === "metrics") {
      const monitoring = await getPlatformMonitoring();
      sendJson(res, 200, {
        ok: true,
        engineVersion: ENGINE_VERSION,
        intelligenceLayers: INTELLIGENCE_LAYERS,
        pipelineStages: PIPELINE_STAGES,
        supportedSourceTypes: SUPPORTED_SOURCE_TYPES.length,
        platforms: listSupportedPlatforms(),
        stats: monitoring,
        legacyMetrics: await getEngineMetrics(),
      });
      return;
    }

    if (action === "monitoring") {
      sendJson(res, 200, { ok: true, ...(await getPlatformMonitoring()) });
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
      const fn = body.v2 !== false ? runQualityEngine : runQualityChecks;
      const quality = await fn({
        parsed: body.parsed,
        source: body.source,
        sourceUrl: body.sourceUrl,
        imageUrl: body.imageUrl,
        imageHash: body.imageHash,
        visionMetrics: body.visionMetrics,
      });
      sendJson(res, 200, { ok: true, ...quality });
      return;
    }

    if (action === "decide-v2") {
      const decision = await makeMultiStageDecision({
        source: body.source,
        parsed: body.parsed,
        confidenceScore: body.confidenceScore,
        sourceUrl: body.sourceUrl,
        imageUrl: body.imageUrl,
        visionMetrics: body.visionMetrics,
        quality: body.quality,
      });
      sendJson(res, 200, decision);
      return;
    }

    if (action === "search") {
      const results = await intelligentSearch(body.query || body.q, { limit: body.limit });
      sendJson(res, 200, { ok: true, ...results });
      return;
    }

    if (action === "recommend") {
      const rec = await recommendForLesson(body.lessonId, { limit: body.limit ?? 8 });
      sendJson(res, 200, { ok: true, ...rec });
      return;
    }

    if (action === "self-heal") {
      const result = await runSelfHealing();
      sendJson(res, 200, { ok: result.ok, ...result });
      return;
    }

    if (action === "analyze-image-v2") {
      if (!body.imageBase64) {
        sendJson(res, 400, { ok: false, error: "imageBase64_required" });
        return;
      }
      const buffer = Buffer.from(body.imageBase64, "base64");
      const result = await analyzeImageV2({
        imageBuffer: buffer,
        mimeType: body.mimeType || "image/jpeg",
        caption: body.caption,
        sourceUrl: body.sourceUrl,
      });
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: [
        "dashboard", "monitoring", "health", "list-sources", "upsert-source", "run",
        "vision-status", "analyze-image", "analyze-image-v2", "decide", "decide-v2",
        "quality-check", "search", "recommend", "self-heal",
      ],
    });
  } catch (err) {
    console.error("[admin/majlis-knowledge-engine]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
