import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import {
  runReasoningCycle,
  runReasoningQuery,
  getReasoningDashboard,
  getTopLinkedEntities,
  retrieveEvidence,
  scanReasoningQuality,
  autoFixQualityIssues,
} from "../../../lib/reasoning-engine/orchestrator.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const [dashboard, topLinked] = await Promise.all([
        getReasoningDashboard(admin),
        getTopLinkedEntities(admin, 10),
      ]);
      sendJson(res, 200, { ok: true, dashboard, top_linked: topLinked });
      return;
    }

    if (action === "query") {
      const result = await runReasoningQuery({
        query: req.body?.query,
        synthesize: req.body?.synthesize !== false,
        actorId: auth.userId ?? "admin",
      });
      sendJson(res, 200, result);
      return;
    }

    if (action === "search") {
      const result = await retrieveEvidence(req.body?.query || req.query?.q, {
        limit: req.body?.limit ?? 30,
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "run") {
      const result = await runReasoningCycle({
        trigger: "admin",
        actorId: auth.userId ?? "admin",
        autoFix: req.body?.autoFix === true,
        inferenceLimit: req.body?.inferenceLimit ?? 150,
      });
      sendJson(res, 200, { ok: true, result });
      return;
    }

    if (action === "quality") {
      const result = await scanReasoningQuality(admin, { limit: req.body?.limit ?? 100 });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "fix") {
      const result = await autoFixQualityIssues(admin, {
        inferRelations: true,
        inferenceLimit: req.body?.inferenceLimit ?? 100,
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    sendJson(res, 400, { ok: false, message: "Unknown action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
