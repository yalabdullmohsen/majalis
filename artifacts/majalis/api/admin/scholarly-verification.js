import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import {
  runScholarlyVerificationScan,
  getScholarlyDashboard,
  searchScholarlyContent,
  verifyContentItem,
} from "../../lib/scholarly-verification/orchestrator.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      const result = await getScholarlyDashboard();
      sendJson(res, 200, result);
      return;
    }

    if (action === "scan") {
      const result = await runScholarlyVerificationScan({
        checkLinks: req.body?.checkLinks !== false,
        useAi: Boolean(req.body?.useAi),
        persist: req.body?.persist !== false,
        trigger: "manual",
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "search") {
      const filters = req.body?.filters ?? req.query ?? {};
      const result = await searchScholarlyContent(filters);
      sendJson(res, 200, result);
      return;
    }

    if (action === "verify") {
      const { content_type, content_id, item } = req.body ?? {};
      if (!content_type || !content_id || !item) {
        sendJson(res, 400, { ok: false, error: "missing content_type/content_id/item" });
        return;
      }
      const result = await verifyContentItem(content_type, content_id, item, {
        checkLinks: true,
        useAi: Boolean(req.body?.useAi),
        persist: Boolean(req.body?.persist),
        trigger: "manual",
      });
      sendJson(res, 200, { ok: true, result });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/scholarly-verification] failed", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
