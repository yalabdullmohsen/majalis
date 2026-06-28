import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getVisionAiStatus } from "../../../lib/ai/vision-provider-fallback.mjs";
import { getSmartExtractionStats } from "../../../lib/ai/smart-extraction/monitoring.mjs";
import { getEnvConfig } from "../../../lib/env-config.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  const env = getEnvConfig();
  const status = getVisionAiStatus();
  const smartExtraction = getSmartExtractionStats();

  sendJson(res, 200, {
    ...status,
    smartExtraction,
    pipeline: {
      order: ["preprocess", "ocr", "rule_engine", "confidence", "decision", "ai_optional", "validation"],
      aiOrder: ["openai", "anthropic", "manual_review"],
      aiOnlyWhenNeeded: true,
    },
    keys: {
      anthropic: Boolean(env.anthropicKey),
      openai: Boolean(env.openaiKey),
    },
    env: {
      VISION_PRIMARY_PROVIDER: process.env.VISION_PRIMARY_PROVIDER || "anthropic",
      VISION_FALLBACK_ENABLED: process.env.VISION_FALLBACK_ENABLED ?? "true",
      LOCAL_OCR_ENABLED: process.env.LOCAL_OCR_ENABLED || "false",
    },
  });
}
