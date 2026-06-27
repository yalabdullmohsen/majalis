import { sendJson } from "../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import {
  runPlatformBootstrap,
  getPlatformBootstrapStatus,
} from "../../../lib/platform-bootstrap.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = String(req.query?.action || req.body?.action || "status").trim();

  try {
    if (action === "status") {
      const status = await getPlatformBootstrapStatus();
      sendJson(res, 200, { ok: status.bootstrap?.productionReady === true, ...status });
      return;
    }

    if (action === "run" || action === "bootstrap") {
      const result = await runPlatformBootstrap({
        forceMigrations: req.query?.force === "1" || req.body?.force === true,
        skipProductionTests: req.query?.skipTests === "1",
      });
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    sendJson(res, 400, { ok: false, error: "unknown_action", actions: ["status", "run", "bootstrap"] });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message || String(err) });
  }
}
