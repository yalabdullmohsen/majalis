import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getPlatformBootstrapStatus } from "../../../lib/platform-bootstrap.mjs";
import { verifySchema } from "../../../lib/db-migrate.mjs";
import { sendSafeError } from "../../api/safe-error.mjs";

/**
 * Admin platform bootstrap — verify/status only.
 * Schema apply is CLI / SQL Editor only (never HTTP).
 */
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

    if (action === "verify" || action === "run" || action === "bootstrap") {
      // "run"/"bootstrap" kept as aliases but permanently verify-only (no DDL).
      const [status, schema] = await Promise.all([
        getPlatformBootstrapStatus(),
        verifySchema(),
      ]);
      const ok = schema?.ok === true;
      sendJson(res, ok ? 200 : 503, {
        ok,
        mode: "verify_only",
        schemaMutationBlocked: true,
        error: ok ? undefined : "runtime_schema_migrations_disabled",
        message:
          "Runtime schema migrations are permanently disabled over HTTP. Apply SQL via CLI/SQL Editor (see REQUIRES_EXPLICIT_APPROVAL.md).",
        schema,
        bootstrap: status,
      });
      return;
    }

    sendJson(res, 400, {
      ok: false,
      error: "unknown_action",
      actions: ["status", "verify"],
    });
  } catch (err) {
    sendSafeError(res, sendJson, err, { code: "platform_bootstrap_failed" });
  }
}
