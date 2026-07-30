import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { ACTIVATION_ROLLBACK_SQL } from "../../../lib/migration-runner.mjs";
import { getPlatformHealth } from "../../../lib/platform-health.mjs";
import { getPlatformBootstrapStatus } from "../../../lib/platform-bootstrap.mjs";
import { verifySchema } from "../../../lib/db-migrate.mjs";
import { sendSafeError } from "../../api/safe-error.mjs";

/**
 * Production activation admin API — status/verify/rollback-SQL text only.
 * migrate/bootstrap DDL permanently disabled over HTTP.
 */
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
      return sendJson(res, health.ok && bootstrap.ok ? 200 : 503, {
        ok: health.ok && bootstrap.ok,
        health,
        bootstrap,
      });
    }

    if (action === "bootstrap-status" || action === "verify") {
      const [status, schema] = await Promise.all([
        getPlatformBootstrapStatus(),
        verifySchema(),
      ]);
      return sendJson(res, schema?.ok ? 200 : 503, {
        ok: schema?.ok === true,
        mode: "verify_only",
        schema,
        bootstrap: status,
      });
    }

    if (
      action === "bootstrap" ||
      action === "self-bootstrap" ||
      action === "migrate" ||
      action === "seed-rulings"
    ) {
      return sendJson(res, 403, {
        ok: false,
        error: "runtime_schema_migrations_disabled",
        schemaMutationBlocked: true,
        message:
          "Runtime schema migrations / seed writes via Admin HTTP are permanently disabled. Use documented CLI or Supabase SQL Editor after explicit approval.",
        actions: {
          cli: "pnpm --filter @workspace/majalis exec node scripts/apply-activation-migrations.mjs",
          docs: "docs/REQUIRES_EXPLICIT_APPROVAL.md",
        },
      });
    }

    if (action === "rollback-sql") {
      return sendJson(res, 200, {
        ok: true,
        warning: "Emergency rollback — data loss. Run in Supabase SQL Editor only after approval.",
        sql: ACTIVATION_ROLLBACK_SQL,
      });
    }

    return sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (err) {
    return sendSafeError(res, sendJson, err, { code: "production_activate_failed" });
  }
}
