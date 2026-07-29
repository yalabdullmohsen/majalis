/**
 * GET/POST /api/cron/apply-migrations
 * Runtime NEVER applies DDL. Verify / connection test only.
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { verifySchema } from "../../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../../lib/database.mjs";

function resolvedMeta() {
  const r = resolveDatabaseUrl();
  return {
    urlRedacted: r.urlRedacted,
    source: r.source,
    rawConfigured: r.rawConfigured,
    normalized: r.normalized,
    normalizeReason: r.normalizeReason,
  };
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "verify";

  try {
    if (action === "test") {
      const conn = await testDatabaseConnection();
      sendJson(res, conn.ok ? 200 : 500, { connection: conn, resolved: resolvedMeta() });
      return;
    }

    if (action === "verify") {
      const schema = await verifySchema();
      sendJson(res, schema.ok ? 200 : 500, { ...schema, resolved: resolvedMeta() });
      return;
    }

    const schema = await verifySchema();
    sendJson(res, 403, {
      ok: false,
      error: "runtime_schema_migrations_disabled",
      schemaMutationBlocked: true,
      message:
        "Runtime schema migrations are permanently disabled. Apply DDL via approved workflow or SQL Editor.",
      requestedAction: action,
      schema,
      resolved: resolvedMeta(),
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      resolved: resolvedMeta(),
    });
  }
}
