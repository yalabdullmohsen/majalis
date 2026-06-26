import { sendJson } from "../_http.js";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import {
  runAgentPipeline,
  runAgent,
  getAgentsDashboard,
  AGENTS,
} from "../../lib/ai-agents/index.mjs";
import { getTrustedSourcesSummary } from "../../lib/trusted-sources/index.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const [agents, sources] = await Promise.all([
        getAgentsDashboard(admin),
        getTrustedSourcesSummary(admin),
      ]);
      sendJson(res, 200, { ok: true, ...agents, trusted_sources: sources });
      return;
    }

    if (action === "run") {
      const agentId = req.query?.agent || req.body?.agent;
      if (agentId) {
        const result = await runAgent(admin, agentId, req.body || {});
        sendJson(res, 200, { ok: true, result });
        return;
      }
      const pipeline = await runAgentPipeline(admin, req.body || {});
      sendJson(res, 200, { ok: true, pipeline });
      return;
    }

    if (action === "sources") {
      const sources = await getTrustedSourcesSummary(admin);
      sendJson(res, 200, { ok: true, sources });
      return;
    }

    if (action === "agents") {
      sendJson(res, 200, { ok: true, agents: Object.values(AGENTS) });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (err) {
    console.error("[admin/ai-agents]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
