import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import {
  resolveGlobalRef,
  registerAndLink,
  getRelations,
  getRelationGraph,
  getVersionHistory,
  getReferenceDashboard,
  runReviewCycle,
  aiAnalyzeReference,
} from "../../lib/global-reference/index.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "GET only" });
    return;
  }

  const admin = getSupabaseAdmin();
  const refId = req.query?.ref;
  const action = req.query?.action || (refId ? "resolve" : "dashboard");

  try {
    if (action === "dashboard") {
      const dashboard = await getReferenceDashboard(admin);
      sendJson(res, 200, { ok: true, ...dashboard });
      return;
    }

    if (action === "resolve" && refId) {
      const ref = await resolveGlobalRef(admin, refId);
      if (!ref) {
        sendJson(res, 404, { ok: false, error: "ref_not_found" });
        return;
      }
      const [relations, versions, ai] = await Promise.all([
        getRelations(admin, refId),
        getVersionHistory(admin, refId),
        aiAnalyzeReference(ref),
      ]);
      sendJson(res, 200, { ok: true, ref, relations, versions, ai_suggestions: ai });
      return;
    }

    if (action === "graph" && refId) {
      const graph = await getRelationGraph(admin, refId, Number(req.query?.depth || 2));
      sendJson(res, 200, { ok: true, graph });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
