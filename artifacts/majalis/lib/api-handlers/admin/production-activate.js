import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { runActivationMigrations, ACTIVATION_ROLLBACK_SQL } from "../../../lib/migration-runner.mjs";
import { getPlatformHealth } from "../../../lib/platform-health.mjs";
import { seedRulingsFromFilesystem } from "../../../lib/rulings-db-seed.mjs";
import {
  runPlatformBootstrap,
  getPlatformBootstrapStatus,
} from "../../../lib/platform-bootstrap.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson);
  if (!auth) return;

  const action = req.query?.action || req.body?.action || "status";

  try {
    if (action === "status" || action === "health") {
      const [health, bootstrap] = await Promise.all([
        getPlatformHealth({ skipRemote: false }),
        getPlatformBootstrapStatus(),
      ]);
      return sendJson(res, health.ok && bootstrap.ok ? 200 : 503, { ok: health.ok && bootstrap.ok, health, bootstrap });
    }

    if (action === "bootstrap" || action === "self-bootstrap") {
      const result = await runPlatformBootstrap({
        forceMigrations: req.query?.force === "1",
        skipProductionTests: req.query?.skipTests === "1",
      });
      return sendJson(res, result.ok ? 200 : 500, result);
    }

    if (action === "bootstrap-status") {
      const status = await getPlatformBootstrapStatus();
      return sendJson(res, 200, status);
    }

    if (action === "migrate") {
      const result = await runActivationMigrations({
        seedRulings: req.query?.seed !== "0",
        dryRunSeed: req.query?.dryRun === "1",
      });
      return sendJson(res, result.ok ? 200 : 500, result);
    }

    if (action === "seed-rulings") {
      const dryRun = req.query?.dryRun === "1";
      const seed = await seedRulingsFromFilesystem({ dryRun });
      return sendJson(res, seed.ok ? 200 : 500, seed);
    }

    if (action === "rollback-sql") {
      return sendJson(res, 200, {
        ok: true,
        warning: "Emergency rollback — data loss. Run in Supabase SQL Editor only.",
        sql: ACTIVATION_ROLLBACK_SQL,
      });
    }

    return sendJson(res, 400, { ok: false, error: "Unknown action" });
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}
