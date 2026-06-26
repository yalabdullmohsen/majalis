import { sendJson } from "../_http.js";
import { validateAdminAuth } from "../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import {
  getIntelligenceStatus,
  runIslamicIntelligencePlatform,
  runIntelligenceAgent,
  getIntelligenceAnalytics,
  generateWeeklyReport,
  generateIslamicIntelligenceReport,
  buildDevelopmentPlan,
  AGENTS,
} from "../../lib/islamic-intelligence/index.mjs";

export default async function handler(req, res) {
  if (!validateAdminAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "dashboard";
  const admin = getSupabaseAdmin();

  try {
    if (action === "dashboard") {
      const status = await getIntelligenceStatus(admin);
      sendJson(res, 200, { ok: true, ...status });
      return;
    }

    if (action === "analytics") {
      const days = Number(req.query?.days || req.body?.days || 30);
      const analytics = await getIntelligenceAnalytics(admin, { days });
      sendJson(res, 200, { ok: true, analytics });
      return;
    }

    if (action === "run") {
      const mode = req.body?.mode || req.query?.mode || "full";
      const agents = req.body?.agents;
      const result = await runIslamicIntelligencePlatform({ mode, agents, checkLinks: req.body?.checkLinks ?? true });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "run-agent") {
      const agentId = req.body?.agent || req.query?.agent;
      if (!agentId || !AGENTS[agentId]) {
        sendJson(res, 400, { ok: false, error: "invalid_agent" });
        return;
      }
      const result = await runIntelligenceAgent(agentId, admin, req.body || {});
      sendJson(res, 200, { ok: true, agent: agentId, result });
      return;
    }

    if (action === "weekly-report") {
      const report = await generateWeeklyReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "report") {
      const report = await generateIslamicIntelligenceReport(admin);
      sendJson(res, 200, { ok: true, report });
      return;
    }

    if (action === "plan") {
      const plan = buildDevelopmentPlan();
      sendJson(res, 200, { ok: true, plan });
      return;
    }

    if (action === "agents") {
      sendJson(res, 200, { ok: true, agents: AGENTS });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
