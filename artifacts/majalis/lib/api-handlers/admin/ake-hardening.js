import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  getHardeningDashboard,
  ensureHardeningSchema,
} from "../../../lib/auto-knowledge-engine/hardening/dashboard.mjs";
import { migrateFiqhFromLibraryItems, getFiqhMigrationStatus } from "../../../lib/auto-knowledge-engine/hardening/fiqh-migration.mjs";
import { runIncidentRecoveryCycle } from "../../../lib/auto-knowledge-engine/hardening/incident-recovery.mjs";
import { snapshotPublishingAnalytics } from "../../../lib/auto-knowledge-engine/hardening/analytics.mjs";
import { runSourceDiscoveryCycle } from "../../../lib/auto-knowledge-engine/hardening/source-discovery.mjs";
import { ensureAkeRpcFunctions, getAkeRpcHealth } from "../../../lib/auto-knowledge-engine/rpc-probe.mjs";
import { evaluateHardeningAlerts } from "../../../lib/auto-knowledge-engine/hardening/notifications.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "dashboard";

  try {
    if (action === "dashboard") {
      sendJson(res, 200, await getHardeningDashboard());
      return;
    }

    if (action === "migrate-fiqh") {
      const dryRun = req.body?.dryRun === true || req.query?.dryRun === "1";
      const result = await migrateFiqhFromLibraryItems(undefined, {
        limit: Number(req.body?.limit || req.query?.limit || 50),
        dryRun,
      });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "fiqh-status") {
      sendJson(res, 200, await getFiqhMigrationStatus());
      return;
    }

    if (action === "recover") {
      const result = await runIncidentRecoveryCycle();
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "analytics") {
      const periodType = req.query?.period || req.body?.period || "daily";
      const result = await snapshotPublishingAnalytics(undefined, periodType);
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "discover-sources") {
      const urls = req.body?.urls || [];
      const result = await runSourceDiscoveryCycle(undefined, urls, {
        limit: Number(req.body?.limit || 5),
      });
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (action === "repair-rpc") {
      const repair = await ensureAkeRpcFunctions({ force: req.body?.force === true });
      const health = await getAkeRpcHealth();
      sendJson(res, repair.ok ? 200 : 500, { ok: repair.ok, repair, health });
      return;
    }

    if (action === "rpc-health") {
      sendJson(res, 200, await getAkeRpcHealth());
      return;
    }

    if (action === "apply-migration") {
      const result = await ensureHardeningSchema();
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    if (action === "evaluate-alerts") {
      const alerts = await evaluateHardeningAlerts(undefined, req.body || {});
      sendJson(res, 200, { ok: true, alerts });
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action", action });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
