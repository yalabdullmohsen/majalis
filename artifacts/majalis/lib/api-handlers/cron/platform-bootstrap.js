import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import {
  runPlatformBootstrap,
  getPlatformBootstrapStatus,
} from "../../../lib/platform-bootstrap.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  const action = String(req.query?.action || req.body?.action || "run").trim();

  try {
    if (action === "status") {
      const status = await getPlatformBootstrapStatus();
      sendJson(res, status.ok ? 200 : 503, { ok: status.ok, ...status });
      return;
    }

    const result = await runPlatformBootstrap({
      forceMigrations: req.query?.force === "1" || req.body?.force === true,
      skipProductionTests: req.query?.skipTests === "1",
    });

    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || String(error) });
  }
}
