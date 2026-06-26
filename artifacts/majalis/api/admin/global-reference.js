import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import {
  getReferenceDashboard,
  runReviewCycle,
  registerAndLink,
  generateGlobalReferenceReport,
  buildThreeYearRoadmap,
  auditAllSources,
  getReviewHistory,
} from "../../lib/global-reference/index.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const dashboard = await getReferenceDashboard(admin);
      sendJson(res, 200, { ok: true, ...dashboard });
      return;
    }

    if (action === "review") {
      const cycle = await runReviewCycle(admin, { checkLinks: true });
      sendJson(res, 200, { ok: true, cycle });
      return;
    }

    if (action === "register") {
      const item = req.body?.item;
      if (!item) {
        sendJson(res, 400, { ok: false, error: "item_required" });
        return;
      }
      const result = await registerAndLink(admin, item);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "audit-sources") {
      const results = await auditAllSources(admin);
      sendJson(res, 200, { ok: true, results });
      return;
    }

    if (action === "reviews") {
      const history = await getReviewHistory(admin);
      sendJson(res, 200, { ok: true, reviews: history });
      return;
    }

    if (action === "report") {
      const report = await generateGlobalReferenceReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "roadmap") {
      const roadmap = buildThreeYearRoadmap();
      sendJson(res, 200, { ok: true, roadmap });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
