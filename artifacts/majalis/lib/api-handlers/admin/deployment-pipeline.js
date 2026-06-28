/**
 * Admin API — Autonomous CD / Deployment Pipeline dashboard.
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getDeploymentDashboardStats } from "../../../lib/cd/deploy-state.mjs";
import { runPostDeployVerification } from "../../../lib/cd/post-deploy-verify.mjs";
import { runProductionSelfHeal } from "../../../lib/cd/self-heal.mjs";
import { listRecentDeployments } from "../../../lib/cd/vercel-client.mjs";
import { getSystemHealth } from "../../../lib/system-health.mjs";
import { analyzeChangeRisk } from "../../../lib/cd/safety-rules.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      const [stats, health, vercel] = await Promise.all([
        getDeploymentDashboardStats(),
        getSystemHealth(),
        listRecentDeployments(5),
      ]);

      sendJson(res, 200, {
        ok: true,
        stats,
        health: {
          ok: health.ok,
          production: health.ok !== false,
          supabase: health.supabase,
          cron: health.cron,
          ai: health.ai,
          queue: health.queue,
          database: health.database,
          metrics: health.metrics,
          errors: health.errors,
        },
        vercel: vercel.ok ? vercel.deployments : [],
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
        at: new Date().toISOString(),
      });
      return;
    }

    if (action === "verify") {
      const result = await runPostDeployVerification({ selfHeal: true });
      sendJson(res, result.ok ? 200 : 503, { ok: result.ok, ...result });
      return;
    }

    if (action === "heal") {
      const result = await runProductionSelfHeal();
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "risk") {
      const risk = analyzeChangeRisk();
      sendJson(res, 200, { ok: true, risk });
      return;
    }

    sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("[admin/deployment-pipeline]", error);
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
