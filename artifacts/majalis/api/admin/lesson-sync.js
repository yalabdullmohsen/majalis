import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import {
  runKuwaitLessonsSync,
  getLessonSyncDashboard,
  generateLessonSyncReport,
} from "../../lib/kuwait-lessons-sync/sync.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "stats";

  try {
    if (action === "stats") {
      const limit = Number(req.query?.limit || 10);
      const result = await getLessonSyncDashboard(limit);
      sendJson(res, 200, result);
      return;
    }

    if (action === "run") {
      const useAi = req.body?.useAi !== false;
      const dryRun = Boolean(req.body?.dryRun);
      const result = await runKuwaitLessonsSync({ useAi, dryRun, trigger: "manual" });
      sendJson(res, result.ok ? 200 : 207, result);
      return;
    }

    if (action === "report") {
      const report = await generateLessonSyncReport();
      sendJson(res, 200, { ok: true, report });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/lesson-sync] failed", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
